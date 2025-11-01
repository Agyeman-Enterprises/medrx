from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from services.drchrono_service import DrChronoService
from database import db
import logging
import requests
import os

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/drchrono", tags=["drchrono"])

drchrono = DrChronoService()

class CreatePatientRequest(BaseModel):
    access_token: str
    doctor_id: int
    patient_data: Dict[str, Any]

class CreateAppointmentRequest(BaseModel):
    access_token: str
    patient_id: int
    doctor_id: int
    office_id: int
    appointment_data: Dict[str, Any]

class AddClinicalNoteRequest(BaseModel):
    access_token: str
    appointment_id: int
    doctor_id: int
    intake_data: Dict[str, Any]

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class CheckAvailabilityRequest(BaseModel):
    datetime: str
    timezone: str
    duration: int = 30

@router.get("/auth/authorize")
async def authorize_drchrono(state: Optional[str] = None):
    """
    Redirect provider to DrChrono OAuth authorization page
    """
    if not drchrono.enabled:
        raise HTTPException(status_code=500, detail="DrChrono not configured")
    
    auth_url = drchrono.get_authorization_url(state)
    return {"authorization_url": auth_url}


@router.get("/auth/callback")
async def drchrono_callback(
    code: str = Query(...),
    state: Optional[str] = Query(None)
):
    """
    Handle OAuth callback from DrChrono
    Exchange authorization code for access token
    """
    try:
        # Exchange code for token
        token_response = await drchrono.exchange_code_for_token(code)
        
        if not token_response.get("success"):
            raise HTTPException(
                status_code=400,
                detail=token_response.get("error", "Failed to get access token")
            )
        
        # Store tokens in database (associated with provider)
        # For now, return them to frontend for storage
        return {
            "success": True,
            "access_token": token_response["access_token"],
            "refresh_token": token_response.get("refresh_token"),
            "expires_in": token_response.get("expires_in"),
            "message": "Successfully connected to DrChrono"
        }
        
    except Exception as e:
        logger.error(f"DrChrono callback error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/check-availability")
async def check_availability(request: CheckAvailabilityRequest):
    """
    Check if provider is available at requested time
    Uses DrChrono calendar ICS feed
    """
    try:
        calendar_link = os.getenv("DRCHRONO_CALENDAR_LINK")
        
        if not calendar_link or "placeholder" in calendar_link:
            # Graceful degradation - assume available if no calendar configured
            return {
                "available": True,
                "conflicts": [],
                "note": "Calendar check skipped - not configured"
            }
        
        # Fetch ICS calendar
        response = requests.get(calendar_link, timeout=5)
        
        if response.status_code != 200:
            logger.warning(f"Failed to fetch DrChrono calendar: {response.status_code}")
            return {
                "available": True,
                "conflicts": [],
                "note": "Calendar check failed - assuming available"
            }
        
        # Parse ICS for conflicts
        # Simple check: look for DTSTART entries that overlap
        ics_content = response.text
        requested_time = datetime.fromisoformat(request.datetime.replace('Z', '+00:00'))
        appointment_end = requested_time + timedelta(minutes=request.duration)
        
        conflicts = []
        
        # Basic ICS parsing (simplified)
        lines = ics_content.split('\n')
        for i, line in enumerate(lines):
            if line.startswith('DTSTART'):
                # Extract datetime from ICS format
                dt_str = line.split(':')[1].strip()
                try:
                    # Handle YYYYMMDDTHHMMSS format
                    if 'T' in dt_str:
                        event_start = datetime.strptime(dt_str[:15], '%Y%m%dT%H%M%S')
                        # Check if there's overlap
                        event_end = event_start + timedelta(minutes=30)  # Assume 30 min
                        
                        if (event_start < appointment_end and event_end > requested_time):
                            conflicts.append({
                                'start': event_start.isoformat(),
                                'end': event_end.isoformat()
                            })
                except Exception as parse_error:
                    logger.debug(f"Could not parse ICS date: {dt_str}")
                    continue
        
        return {
            "available": len(conflicts) == 0,
            "conflicts": conflicts
        }
        
    except Exception as e:
        logger.error(f"Availability check error: {e}")
        # Graceful degradation
        return {
            "available": True,
            "conflicts": [],
            "error": str(e)
        }


@router.post("/auth/refresh")
async def refresh_token(request: RefreshTokenRequest):
    """
    Refresh expired DrChrono access token
    """
    try:
        token_response = await drchrono.refresh_access_token(request.refresh_token)
        
        if not token_response.get("success"):
            raise HTTPException(
                status_code=400,
                detail=token_response.get("error", "Failed to refresh token")
            )
        
        return {
            "success": True,
            "access_token": token_response["access_token"],
            "refresh_token": token_response.get("refresh_token"),
            "expires_in": token_response.get("expires_in")
        }
        
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/patients")
async def create_or_update_patient(request: CreatePatientRequest):
    """
    Create or update patient in DrChrono from MedRx data
    """
    try:
        result = await drchrono.create_or_update_patient(
            access_token=request.access_token,
            patient_data=request.patient_data,
            doctor_id=request.doctor_id
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to create/update patient")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create patient error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/appointments")
async def create_appointment(request: CreateAppointmentRequest):
    """
    Create appointment in DrChrono from MedRx booking
    """
    try:
        result = await drchrono.create_appointment(
            access_token=request.access_token,
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            office_id=request.office_id,
            appointment_data=request.appointment_data
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to create appointment")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create appointment error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clinical-notes")
async def add_clinical_note(request: AddClinicalNoteRequest):
    """
    Add clinical note with MedRx intake data to DrChrono appointment
    """
    try:
        result = await drchrono.add_clinical_note(
            access_token=request.access_token,
            appointment_id=request.appointment_id,
            doctor_id=request.doctor_id,
            intake_data=request.intake_data
        )
        
        if not result.get("success"):
            raise HTTPException(
                status_code=400,
                detail=result.get("error", "Failed to add clinical note")
            )
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Add clinical note error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/iframe/patient-intake")
async def get_patient_intake_iframe(
    access_token: str = Query(...),
    patient_id: int = Query(...)
):
    """
    Get DrChrono patient intake iframe URL
    """
    try:
        iframe_url = await drchrono.get_patient_iframe_url(access_token, patient_id)
        return {
            "success": True,
            "iframe_url": iframe_url
        }
    except Exception as e:
        logger.error(f"Get iframe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/iframe/prescribe")
async def get_prescribe_iframe(
    access_token: str = Query(...),
    appointment_id: int = Query(...)
):
    """
    Get DrChrono e-prescribing iframe URL
    """
    try:
        iframe_url = await drchrono.get_prescribe_iframe_url(access_token, appointment_id)
        return {
            "success": True,
            "iframe_url": iframe_url
        }
    except Exception as e:
        logger.error(f"Get prescribe iframe error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Check DrChrono integration status"""
    return {
        "status": "ok",
        "drchrono_configured": drchrono.enabled,
        "client_id_present": bool(drchrono.client_id),
        "client_secret_present": bool(drchrono.client_secret)
    }
