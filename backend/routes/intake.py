from fastapi import APIRouter, HTTPException, status, UploadFile, File, Form
from fastapi.responses import JSONResponse
from datetime import datetime
from typing import Optional
import os

from services.photo_upload import PhotoUploadService
from database import db

router = APIRouter(prefix="/api/intake", tags=["intake"])

photo_service = PhotoUploadService()

@router.post("/upload-photo")
async def upload_photo(
    photo_base64: str = Form(...),
    photo_type: str = Form(...),
    patient_id: str = Form(...),
    appointment_id: Optional[str] = Form(None)
):
    """
    Upload a photo (ID, insurance, medication)
    
    Args:
        photo_base64: Base64 encoded image
        photo_type: Type of photo (medication, insurance_front, insurance_back, id_front, id_back)
        patient_id: Patient identifier
        appointment_id: Optional appointment ID
    """
    try:
        # Validate photo
        validation = photo_service.validate_photo(photo_base64, max_size_mb=10)
        if not validation.get("valid"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=validation.get("error", "Invalid photo")
            )
        
        # Upload photo
        result = await photo_service.upload_photo(
            photo_base64=photo_base64,
            photo_type=photo_type,
            patient_id=patient_id,
            metadata={
                "appointment_id": appointment_id,
                "uploaded_at": datetime.utcnow().isoformat()
            }
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Upload failed")
            )
        
        # Store photo reference in database
        photo_doc = {
            "patient_id": patient_id,
            "appointment_id": appointment_id,
            "photo_type": photo_type,
            "file_id": result["file_id"],
            "file_path": result["file_path"],
            "filename": result["filename"],
            "uploaded_at": datetime.utcnow(),
            "metadata": result.get("metadata", {})
        }
        
        await db.patient_photos.insert_one(photo_doc)
        
        return {
            "success": True,
            "file_id": result["file_id"],
            "file_path": result["file_path"],
            "filename": result["filename"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload error: {str(e)}"
        )

@router.post("/submit")
async def submit_intake(
    patient_id: str,
    appointment_id: Optional[str],
    intake_data: dict
):
    """
    Submit complete intake form
    
    Args:
        patient_id: Patient identifier
        appointment_id: Optional appointment ID
        intake_data: Complete intake form data
    """
    try:
        # Store intake data
        intake_doc = {
            "patient_id": patient_id,
            "appointment_id": appointment_id,
            "demographics": intake_data.get("demographics", {}),
            "medical_history": intake_data.get("medicalHistory", {}),
            "medications": intake_data.get("medications", []),
            "allergies": intake_data.get("allergies", []),
            "insurance": intake_data.get("insurance", {}),
            "identification": intake_data.get("identification", {}),
            "submitted_at": datetime.utcnow(),
            "status": "completed"
        }
        
        result = await db.intake_forms.insert_one(intake_doc)
        
        # Update appointment with intake status
        if appointment_id:
            from bson import ObjectId
            try:
                await db.appointments.update_one(
                    {"_id": ObjectId(appointment_id)},
                    {"$set": {
                        "intake_completed": True,
                        "intake_form_id": str(result.inserted_id),
                        "updatedAt": datetime.utcnow()
                    }}
                )
            except Exception:
                # If appointment_id is not a valid ObjectId, try as string
                await db.appointments.update_one(
                    {"id": appointment_id},
                    {"$set": {
                        "intake_completed": True,
                        "intake_form_id": str(result.inserted_id),
                        "updatedAt": datetime.utcnow()
                    }}
                )
        
        return {
            "success": True,
            "intake_form_id": str(result.inserted_id),
            "message": "Intake form submitted successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Submission error: {str(e)}"
        )

@router.post("/submit-consents")
async def submit_consents(
    patient_id: str,
    appointment_id: Optional[str],
    consents: dict
):
    """
    Submit signed consent forms
    
    Args:
        patient_id: Patient identifier
        appointment_id: Optional appointment ID
        consents: Dictionary of signed consent forms with signatures
    """
    try:
        # Store consent data
        consent_doc = {
            "patient_id": patient_id,
            "appointment_id": appointment_id,
            "hipaa_consent": consents.get("hipaa", {}),
            "privacy_consent": consents.get("privacy", {}),
            "financial_consent": consents.get("financial", {}),
            "submitted_at": datetime.utcnow(),
            "status": "completed"
        }
        
        result = await db.consents.insert_one(consent_doc)
        
        # Update appointment with consent status
        if appointment_id:
            from bson import ObjectId
            try:
                await db.appointments.update_one(
                    {"_id": ObjectId(appointment_id)},
                    {"$set": {
                        "consents_completed": True,
                        "consent_id": str(result.inserted_id),
                        "updatedAt": datetime.utcnow()
                    }}
                )
            except Exception:
                # If appointment_id is not a valid ObjectId, try as string
                await db.appointments.update_one(
                    {"id": appointment_id},
                    {"$set": {
                        "consents_completed": True,
                        "consent_id": str(result.inserted_id),
                        "updatedAt": datetime.utcnow()
                    }}
                )
        
        return {
            "success": True,
            "consent_id": str(result.inserted_id),
            "message": "Consent forms submitted successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Consent submission error: {str(e)}"
        )

@router.get("/photos/{patient_id}")
async def get_patient_photos(patient_id: str, appointment_id: Optional[str] = None):
    """Get all photos for a patient"""
    try:
        result = await photo_service.get_patient_photos(patient_id)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving photos: {str(e)}"
        )

