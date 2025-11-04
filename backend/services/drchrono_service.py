import os
import requests
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class DrChronoService:
    """Service for integrating with DrChrono EMR via OAuth and API"""
    
    def __init__(self):
        self.client_id = os.getenv("DRCHRONO_CLIENT_ID")
        self.client_secret = os.getenv("DRCHRONO_CLIENT_SECRET")
        self.redirect_uri = os.getenv("DRCHRONO_REDIRECT_URI")
        self.authorize_url = os.getenv("DRCHRONO_AUTHORIZE_URL", "https://app.drchrono.com/o/authorize/")
        self.token_url = os.getenv("DRCHRONO_TOKEN_URL", "https://app.drchrono.com/o/token/")
        self.api_base = os.getenv("DRCHRONO_API_BASE", "https://app.drchrono.com/api")
        
        # Check if properly configured
        self.enabled = bool(self.client_id and self.client_secret)
        if not self.enabled:
            logger.warning("DrChrono credentials not configured")
    
    def get_authorization_url(self, state: Optional[str] = None) -> str:
        """
        Generate OAuth authorization URL for provider to connect DrChrono
        
        Args:
            state: Optional state parameter for security
            
        Returns:
            Authorization URL to redirect provider to
        """
        params = {
            "response_type": "code",
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "scope": "patients:read patients:write clinical:read clinical:write calendar:read calendar:write"
        }
        
        if state:
            params["state"] = state
        
        query_string = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"{self.authorize_url}?{query_string}"
    
    async def exchange_code_for_token(self, authorization_code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for access token
        
        Args:
            authorization_code: Code received from DrChrono OAuth redirect
            
        Returns:
            Token response with access_token, refresh_token, expires_in
        """
        try:
            response = requests.post(
                self.token_url,
                data={
                    "code": authorization_code,
                    "grant_type": "authorization_code",
                    "redirect_uri": self.redirect_uri,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
                }
            )
            
            response.raise_for_status()
            token_data = response.json()
            
            logger.info("Successfully exchanged code for DrChrono access token")
            
            return {
                "success": True,
                "access_token": token_data["access_token"],
                "refresh_token": token_data.get("refresh_token"),
                "expires_in": token_data.get("expires_in", 3600),
                "token_type": token_data.get("token_type", "Bearer")
            }
            
        except Exception as e:
            logger.error(f"Failed to exchange code for token: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh expired access token"""
        try:
            response = requests.post(
                self.token_url,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": refresh_token,
                    "client_id": self.client_id,
                    "client_secret": self.client_secret
                }
            )
            
            response.raise_for_status()
            token_data = response.json()
            
            return {
                "success": True,
                "access_token": token_data["access_token"],
                "refresh_token": token_data.get("refresh_token", refresh_token),
                "expires_in": token_data.get("expires_in", 3600)
            }
            
        except Exception as e:
            logger.error(f"Failed to refresh token: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _make_api_request(
        self, 
        method: str, 
        endpoint: str, 
        access_token: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make authenticated API request to DrChrono"""
        try:
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            
            url = f"{self.api_base}/{endpoint.lstrip('/')}"
            
            response = requests.request(
                method=method,
                url=url,
                headers=headers,
                json=data,
                params=params
            )
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.HTTPError as e:
            logger.error(f"DrChrono API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Request failed: {e}")
            raise
    
    async def create_or_update_patient(
        self, 
        access_token: str,
        patient_data: Dict[str, Any],
        doctor_id: int
    ) -> Dict[str, Any]:
        """
        Create or update patient in DrChrono
        
        Args:
            access_token: DrChrono access token
            patient_data: Patient information from MedRx intake
            doctor_id: DrChrono doctor ID
            
        Returns:
            Created/updated patient data
        """
        try:
            # Search for existing patient by email
            existing = self._make_api_request(
                "GET",
                "/patients",
                access_token,
                params={"email": patient_data.get("email")}
            )
            
            # Prepare patient payload
            payload = {
                "doctor": doctor_id,
                "first_name": patient_data.get("first_name", ""),
                "last_name": patient_data.get("last_name", ""),
                "email": patient_data.get("email", ""),
                "cell_phone": patient_data.get("phone", ""),
                "date_of_birth": patient_data.get("dob", ""),
                "gender": patient_data.get("sex", ""),
                "address": patient_data.get("address", ""),
                "city": patient_data.get("city", ""),
                "state": patient_data.get("state", ""),
                "zip_code": patient_data.get("zip", "")
            }
            
            if existing.get("results") and len(existing["results"]) > 0:
                # Update existing patient
                patient_id = existing["results"][0]["id"]
                result = self._make_api_request(
                    "PATCH",
                    f"/patients/{patient_id}",
                    access_token,
                    data=payload
                )
                logger.info(f"Updated patient {patient_id} in DrChrono")
            else:
                # Create new patient
                result = self._make_api_request(
                    "POST",
                    "/patients",
                    access_token,
                    data=payload
                )
                logger.info(f"Created new patient {result['id']} in DrChrono")
            
            return {
                "success": True,
                "patient": result
            }
            
        except Exception as e:
            logger.error(f"Failed to create/update patient: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def create_appointment(
        self,
        access_token: str,
        patient_id: int,
        doctor_id: int,
        office_id: int,
        appointment_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Create appointment in DrChrono
        
        Args:
            access_token: DrChrono access token
            patient_id: DrChrono patient ID
            doctor_id: DrChrono doctor ID
            office_id: DrChrono office ID
            appointment_data: Appointment details from MedRx
            
        Returns:
            Created appointment data
        """
        try:
            payload = {
                "patient": patient_id,
                "doctor": doctor_id,
                "office": office_id,
                "scheduled_time": appointment_data.get("scheduled_time"),
                "duration": appointment_data.get("duration", 15),
                "exam_room": appointment_data.get("exam_room", 1),
                "reason": appointment_data.get("reason", "Telemedicine Consultation"),
                "status": "Scheduled",
                "allow_overlapping": False
            }
            
            result = self._make_api_request(
                "POST",
                "/appointments",
                access_token,
                data=payload
            )
            
            logger.info(f"Created appointment {result['id']} in DrChrono")
            
            return {
                "success": True,
                "appointment": result
            }
            
        except Exception as e:
            logger.error(f"Failed to create appointment: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def add_clinical_note(
        self,
        access_token: str,
        appointment_id: int,
        doctor_id: int,
        intake_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Add clinical note with MedRx intake data to DrChrono appointment
        
        Args:
            access_token: DrChrono access token
            appointment_id: DrChrono appointment ID
            doctor_id: DrChrono doctor ID
            intake_data: Structured intake data from MedRx
            
        Returns:
            Created clinical note
        """
        try:
            # Format intake data into clinical note sections
            sections = []
            
            # Chief Complaint
            if intake_data.get("chief_complaint"):
                sections.append({
                    "section_name": "Chief Complaint",
                    "content": intake_data["chief_complaint"]
                })
            
            # History of Present Illness
            if intake_data.get("hpi") or intake_data.get("voice_transcript"):
                sections.append({
                    "section_name": "History of Present Illness",
                    "content": intake_data.get("hpi") or intake_data.get("voice_transcript", "")
                })
            
            # Medications
            if intake_data.get("medications"):
                meds_text = "\n".join([
                    f"- {med.get('name')} {med.get('dosage')} {med.get('frequency')}"
                    for med in intake_data["medications"]
                ])
                sections.append({
                    "section_name": "Current Medications",
                    "content": meds_text
                })
            
            # Allergies
            if intake_data.get("allergies"):
                allergies_text = "\n".join([
                    f"- {allergy.get('allergen')}: {allergy.get('reaction')} ({allergy.get('severity')})"
                    for allergy in intake_data["allergies"]
                ])
                sections.append({
                    "section_name": "Allergies",
                    "content": allergies_text
                })
            
            # Past Medical History
            if intake_data.get("pmh"):
                pmh_text = "\n".join([
                    f"- {condition.get('condition')} ({condition.get('diagnosed_date', 'Unknown date')})"
                    for condition in intake_data["pmh"]
                ])
                sections.append({
                    "section_name": "Past Medical History",
                    "content": pmh_text
                })
            
            # GLP-1 Specific Data
            if intake_data.get("glp1_screening"):
                screening = intake_data["glp1_screening"]
                glp1_text = f"""
Weight: {screening.get('current_weight')} lbs
Height: {screening.get('current_height')} inches
BMI: {screening.get('bmi')}
Weight Loss Goal: {screening.get('weight_loss_goal')} lbs
Previous Attempts: {', '.join(screening.get('previous_weight_loss_attempts', []))}
                """.strip()
                sections.append({
                    "section_name": "GLP-1 Screening",
                    "content": glp1_text
                })
            
            payload = {
                "appointment": appointment_id,
                "doctor": doctor_id,
                "clinical_note_sections": sections
            }
            
            result = self._make_api_request(
                "POST",
                "/clinical_notes",
                access_token,
                data=payload
            )
            
            logger.info(f"Added clinical note to appointment {appointment_id}")
            
            return {
                "success": True,
                "clinical_note": result
            }
            
        except Exception as e:
            logger.error(f"Failed to add clinical note: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_patient_iframe_url(
        self,
        access_token: str,
        patient_id: int
    ) -> str:
        """
        Generate iframe URL for patient intake form in DrChrono
        
        Args:
            access_token: DrChrono access token
            patient_id: DrChrono patient ID
            
        Returns:
            iframe URL
        """
        return f"https://medrx.co/embed/patient-intake?access_token={access_token}&patient_id={patient_id}"
    
    async def get_prescribe_iframe_url(
        self,
        access_token: str,
        appointment_id: int
    ) -> str:
        """
        Generate iframe URL for e-prescribing in DrChrono
        
        Args:
            access_token: DrChrono access token
            appointment_id: DrChrono appointment ID
            
        Returns:
            iframe URL for prescribing
        """
        return f"https://medrx.co/embed/prescribe?access_token={access_token}&appointment_id={appointment_id}"
