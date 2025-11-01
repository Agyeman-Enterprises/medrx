import os
from twilio.rest import Client
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class SMSService:
    """Service for sending SMS notifications via Twilio"""
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.alert_number = os.getenv("SMS_ALERT_NUMBER", "+16716892993")
        
        if self.account_sid and self.auth_token and self.from_number:
            self.client = Client(self.account_sid, self.auth_token)
            self.enabled = True
        else:
            logger.warning("Twilio credentials not configured. SMS notifications disabled.")
            self.enabled = False
    
    async def send_booking_alert(self, appointment_data: dict) -> dict:
        """
        Send SMS alert for new booking
        
        Args:
            appointment_data: Dictionary containing appointment details
            
        Returns:
            Result dictionary with success status
        """
        if not self.enabled:
            return {
                "success": False,
                "message": "SMS service not configured"
            }
        
        try:
            # Format message
            message_body = self._format_booking_message(appointment_data)
            
            # Send SMS
            message = self.client.messages.create(
                body=message_body,
                from_=self.from_number,
                to=self.alert_number
            )
            
            logger.info(f"SMS sent successfully. SID: {message.sid}")
            
            return {
                "success": True,
                "message_sid": message.sid,
                "status": message.status
            }
            
        except Exception as e:
            logger.error(f"Failed to send SMS: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def _format_booking_message(self, appointment_data: dict) -> str:
        """Format appointment data into SMS message"""
        
        patient_name = appointment_data.get("patientInfo", {}).get("name", "Unknown")
        patient_email = appointment_data.get("patientInfo", {}).get("email", "N/A")
        patient_phone = appointment_data.get("patientInfo", {}).get("phone", "N/A")
        service_name = appointment_data.get("serviceName", "Unknown Service")
        appointment_date = appointment_data.get("date", "N/A")
        appointment_time = appointment_data.get("time", "N/A")
        timezone = appointment_data.get("timezone", "N/A")
        
        message = f"""🏥 NEW BOOKING ALERT

Patient: {patient_name}
Email: {patient_email}
Phone: {patient_phone}

Service: {service_name}
Date: {appointment_date}
Time: {appointment_time} {timezone}

MedRx Telemedicine"""
        
        return message
    
    async def send_custom_sms(self, to_number: str, message: str) -> dict:
        """
        Send custom SMS message
        
        Args:
            to_number: Recipient phone number (E.164 format)
            message: Message text
            
        Returns:
            Result dictionary with success status
        """
        if not self.enabled:
            return {
                "success": False,
                "message": "SMS service not configured"
            }
        
        try:
            msg = self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_number
            )
            
            return {
                "success": True,
                "message_sid": msg.sid,
                "status": msg.status
            }
            
        except Exception as e:
            logger.error(f"Failed to send custom SMS: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
