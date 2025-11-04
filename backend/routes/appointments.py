from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from typing import List

from models import Appointment, AppointmentCreate, AppointmentUpdate, PatientInfo, Address
from services_data import ONE_OFF_SERVICES, get_service_info
from services.sms_service import SMSService

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

# MongoDB connection
from database import db

# SMS service
sms_service = SMSService()

@router.post("/", response_model=dict)
async def create_appointment(appointment_data: AppointmentCreate):
    """Book a new appointment - creates pending appointment requiring payment"""
    
    # Get service info
    service = get_service_info(appointment_data.serviceId)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid service ID"
        )
    
    # Check for already-booked time slot
    existing = await db.appointments.find_one({
        "appointmentDate": appointment_data.date,
        "appointmentTime": appointment_data.time,
        "status": {"$in": ["pending_payment", "scheduled", "completed"]}
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot is already booked. Please select a different time."
        )
    
    # Check if user exists, create if new
    user = await db.users.find_one({"email": appointment_data.email})
    if not user:
        # Create new user
        user_data = {
            "name": appointment_data.name,
            "email": appointment_data.email,
            "phone": appointment_data.phone,
            "timezone": appointment_data.timezone,
            "address": appointment_data.address.dict() if appointment_data.address else None,
            "subscriptionId": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        result = await db.users.insert_one(user_data)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
        # Update user address if provided
        if appointment_data.address:
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"address": appointment_data.address.dict(), "updatedAt": datetime.utcnow()}}
            )
    
    # All appointments are one-off consultations - require payment
    price = service['price']
    service_name = service['title']
    payment_status = 'pending'
    appointment_status = 'pending_payment'
    
    # Create appointment
    appointment = {
        "userId": user_id,
        "serviceId": appointment_data.serviceId,
        "serviceType": appointment_data.serviceType,
        "serviceName": service_name,
        "appointmentDate": appointment_data.date,
        "appointmentTime": appointment_data.time,
        "timezone": appointment_data.timezone,
        "status": appointment_status,
        "price": price,
        "patientInfo": {
            "name": appointment_data.name,
            "email": appointment_data.email,
            "phone": appointment_data.phone,
            "address": appointment_data.address.dict() if appointment_data.address else None
        },
        "notes": appointment_data.notes,
        "paymentSessionId": appointment_data.paymentSessionId,
        "paymentStatus": payment_status,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db.appointments.insert_one(appointment)
    appointment["id"] = str(result.inserted_id)
    appointment["_id"] = str(result.inserted_id)
    
    return {
        "success": True,
        "appointmentId": appointment["id"],
        "message": "Appointment created successfully" if payment_status == 'paid' else "Please complete payment to confirm appointment",
        "requiresPayment": payment_status == 'pending',
        "appointment": appointment
    }

@router.get("/", response_model=dict)
async def get_appointments_by_email(email: str):
    """Get all appointments for a user by email"""
    
    user = await db.users.find_one({"email": email})
    if not user:
        return {"success": True, "appointments": []}
    
    user_id = str(user["_id"])
    appointments = await db.appointments.find({"userId": user_id}).sort("appointmentDate", -1).to_list(100)
    
    # Convert ObjectId to string
    for apt in appointments:
        apt["id"] = str(apt["_id"])
        apt["_id"] = str(apt["_id"])
    
    return {
        "success": True,
        "appointments": appointments
    }

@router.get("/{appointment_id}", response_model=dict)
async def get_appointment(appointment_id: str):
    """Get single appointment details"""
    
    from bson import ObjectId
    try:
        appointment = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid appointment ID"
        )
    
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    appointment["id"] = str(appointment["_id"])
    appointment["_id"] = str(appointment["_id"])
    
    return {
        "success": True,
        "appointment": appointment
    }

@router.patch("/{appointment_id}", response_model=dict)
async def update_appointment(appointment_id: str, update_data: AppointmentUpdate):
    """Update appointment (reschedule, cancel, etc.)"""
    
    from bson import ObjectId
    try:
        existing = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid appointment ID"
        )
    
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found"
        )
    
    # Build update dict
    update_dict = {}
    if update_data.status:
        update_dict["status"] = update_data.status
    if update_data.date:
        update_dict["appointmentDate"] = update_data.date
    if update_data.time:
        update_dict["appointmentTime"] = update_data.time
    if update_data.notes:
        update_dict["notes"] = update_data.notes
    
    update_dict["updatedAt"] = datetime.utcnow()
    
    await db.appointments.update_one(
        {"_id": ObjectId(appointment_id)},
        {"$set": update_dict}
    )
    
    updated = await db.appointments.find_one({"_id": ObjectId(appointment_id)})
    updated["id"] = str(updated["_id"])
    updated["_id"] = str(updated["_id"])
    
    return {
        "success": True,
        "message": "Appointment updated successfully",
        "appointment": updated
    }
