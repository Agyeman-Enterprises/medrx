from fastapi import APIRouter, HTTPException, status
from datetime import datetime
from typing import List

from models import Appointment, AppointmentCreate, AppointmentUpdate, PatientInfo
from services_data import ONE_OFF_SERVICES, SUBSCRIPTION_PLANS, get_service_info

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

# MongoDB connection
from database import db

@router.post("/", response_model=dict)
async def create_appointment(appointment_data: AppointmentCreate):
    """Book a new appointment (pay-per-visit or subscription)"""
    
    # Get service info
    service = get_service_info(appointment_data.serviceId)
    if not service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid service ID"
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
            "subscriptionId": None,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        result = await db.users.insert_one(user_data)
        user_id = str(result.inserted_id)
    else:
        user_id = str(user["_id"])
    
    # Check for subscription appointments
    if appointment_data.serviceType == "subscription":
        # Verify user has active subscription
        subscription = await db.subscriptions.find_one({
            "userId": user_id,
            "status": "active"
        })
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active subscription found. Please subscribe first."
            )
        
        # Check visit limits for Basic tier
        plan = SUBSCRIPTION_PLANS.get(subscription['planId'])
        if plan and plan.get('visitLimit'):
            if subscription['appointmentsThisMonth'] >= plan['visitLimit']:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Monthly visit limit reached ({plan['visitLimit']} visits/month)"
                )
        
        price = 0  # Subscription appointments are covered
        service_name = plan['title']
    else:
        # One-off appointment
        price = service['price']
        service_name = service['title']
    
    # Check for existing appointment at same time
    existing = await db.appointments.find_one({
        "appointmentDate": appointment_data.date,
        "appointmentTime": appointment_data.time,
        "status": {"$ne": "cancelled"}
    })
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This time slot is already booked"
        )
    
    # Create appointment
    appointment = {
        "userId": user_id,
        "serviceId": appointment_data.serviceId,
        "serviceType": appointment_data.serviceType,
        "serviceName": service_name,
        "appointmentDate": appointment_data.date,
        "appointmentTime": appointment_data.time,
        "timezone": appointment_data.timezone,
        "status": "scheduled",
        "price": price,
        "patientInfo": {
            "name": appointment_data.name,
            "email": appointment_data.email,
            "phone": appointment_data.phone
        },
        "notes": appointment_data.notes,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db.appointments.insert_one(appointment)
    appointment["id"] = str(result.inserted_id)
    appointment["_id"] = str(result.inserted_id)
    
    # Update subscription usage if applicable
    if appointment_data.serviceType == "subscription":
        await db.subscriptions.update_one(
            {"userId": user_id, "status": "active"},
            {"$inc": {"appointmentsThisMonth": 1}}
        )
    
    return {
        "success": True,
        "appointmentId": appointment["id"],
        "message": "Appointment booked successfully!",
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
    except:
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
    except:
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
