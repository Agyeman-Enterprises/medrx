import os
from twilio.rest import Client
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VideoGrant
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)

class TwilioVideoService:
    """Service for managing Twilio Video rooms for telehealth consultations"""
    
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.api_key_sid = os.getenv("TWILIO_API_KEY_SID")
        self.api_key_secret = os.getenv("TWILIO_API_KEY_SECRET")
        
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
            self.enabled = True
        else:
            logger.warning("Twilio credentials not configured. Video services disabled.")
            self.enabled = False
    
    async def create_video_room(self, appointment_id: str, appointment_data: dict) -> dict:
        """
        Create a Twilio Video room for an appointment
        
        Args:
            appointment_id: Unique appointment identifier
            appointment_data: Appointment details
            
        Returns:
            Dictionary with room details
        """
        if not self.enabled:
            return {
                "success": False,
                "message": "Twilio Video not configured"
            }
        
        try:
            room_name = f"medrx-{appointment_id}"
            
            # Create video room
            room = self.client.video.v1.rooms.create(
                unique_name=room_name,
                type="go",  # Small group room for up to 4 participants
                status_callback=os.getenv("TWILIO_STATUS_CALLBACK_URL", ""),
                status_callback_method="POST",
                max_participants=4,
                record_participants_on_connect=False  # HIPAA: no recording without consent
            )
            
            logger.info(f"Created Twilio Video room: {room.sid}")
            
            return {
                "success": True,
                "room_sid": room.sid,
                "room_name": room_name,
                "room_status": room.status,
                "created_at": room.date_created.isoformat() if room.date_created else None
            }
            
        except Exception as e:
            logger.error(f"Failed to create video room: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def generate_access_token(
        self, 
        room_name: str, 
        identity: str,
        role: str = "participant"
    ) -> dict:
        """
        Generate access token for participant to join video room
        
        Args:
            room_name: Name of the video room
            identity: Participant identity (patient name, provider name, etc.)
            role: Participant role (patient, provider, admin)
            
        Returns:
            Access token for joining the room
        """
        if not self.enabled or not self.api_key_sid or not self.api_key_secret:
            return {
                "success": False,
                "message": "Twilio API keys not configured"
            }
        
        try:
            # Create access token
            token = AccessToken(
                self.account_sid,
                self.api_key_sid,
                self.api_key_secret,
                identity=identity,
                ttl=3600  # 1 hour validity
            )
            
            # Create video grant
            video_grant = VideoGrant(room=room_name)
            token.add_grant(video_grant)
            
            jwt_token = token.to_jwt()
            
            logger.info(f"Generated access token for {identity} in room {room_name}")
            
            return {
                "success": True,
                "token": jwt_token,
                "identity": identity,
                "room_name": room_name,
                "role": role
            }
            
        except Exception as e:
            logger.error(f"Failed to generate access token: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_room_status(self, room_sid: str) -> dict:
        """Get current status of a video room"""
        if not self.enabled:
            return {
                "success": False,
                "message": "Twilio Video not configured"
            }
        
        try:
            room = self.client.video.v1.rooms(room_sid).fetch()
            
            # Get participants
            participants = self.client.video.v1.rooms(room_sid).participants.list()
            
            return {
                "success": True,
                "room_sid": room.sid,
                "status": room.status,
                "duration": room.duration,
                "participant_count": len(participants),
                "participants": [
                    {
                        "identity": p.identity,
                        "status": p.status,
                        "duration": p.duration
                    }
                    for p in participants
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to get room status: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def end_room(self, room_sid: str) -> dict:
        """End a video room and disconnect all participants"""
        if not self.enabled:
            return {
                "success": False,
                "message": "Twilio Video not configured"
            }
        
        try:
            room = self.client.video.v1.rooms(room_sid).update(status="completed")
            
            logger.info(f"Ended video room: {room_sid}")
            
            return {
                "success": True,
                "room_sid": room.sid,
                "status": room.status
            }
            
        except Exception as e:
            logger.error(f"Failed to end room: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def get_room_recordings(self, room_sid: str) -> dict:
        """Get recordings for a room (if recording was enabled)"""
        if not self.enabled:
            return {
                "success": False,
                "message": "Twilio Video not configured"
            }
        
        try:
            recordings = self.client.video.v1.recordings.list(room_sid=room_sid)
            
            return {
                "success": True,
                "recordings": [
                    {
                        "sid": r.sid,
                        "status": r.status,
                        "duration": r.duration,
                        "size": r.size,
                        "url": r.url
                    }
                    for r in recordings
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to get recordings: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
