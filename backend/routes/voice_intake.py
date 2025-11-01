from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
import os
import json
import asyncio
from services.voice_intake import VoiceIntakeService
from database import get_database
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice-intake", tags=["voice-intake"])

voice_service = VoiceIntakeService()

class ProcessTranscriptRequest(BaseModel):
    transcript: str
    appointment_id: str = None

@router.websocket("/ws/transcribe")
async def websocket_transcription_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time voice transcription using Deepgram
    NOTE: Deepgram WebSocket integration requires proper API key configuration.
    For now, this endpoint returns a placeholder error message.
    """
    await websocket.accept()
    
    deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")
    if not deepgram_api_key or deepgram_api_key == "placeholder_deepgram_key":
        await websocket.send_json({
            'type': 'error',
            'message': 'Deepgram API key not configured. Please configure DEEPGRAM_API_KEY in backend .env file.'
        })
        await websocket.close()
        return
    
    try:
        # For now, send placeholder message
        # Full Deepgram WebSocket integration requires additional setup
        await websocket.send_json({
            'type': 'ready',
            'message': 'Transcription service ready (placeholder mode)'
        })
        
        # Keep connection open and echo back any text messages
        while True:
            try:
                message = await websocket.receive()
                
                if "text" in message:
                    data = json.loads(message["text"])
                    
                    if data.get("type") == "stop":
                        await websocket.send_json({
                            'type': 'complete',
                            'full_transcript': 'Placeholder transcript - configure Deepgram for real transcription'
                        })
                        break
                elif "bytes" in message:
                    # Audio data received - in real implementation, send to Deepgram
                    # For now, just acknowledge
                    pass
                        
            except WebSocketDisconnect:
                logger.info("Client disconnected")
                break
            except Exception as e:
                logger.error(f"Error processing message: {e}")
                await websocket.send_json({
                    'type': 'error',
                    'message': str(e)
                })
    
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.send_json({
            'type': 'error',
            'message': str(e)
        })
    
    finally:
        await websocket.close()


@router.post("/process-transcript")
async def process_transcript(request: ProcessTranscriptRequest):
    """
    Process voice transcript and extract medical data using AI
    """
    try:
        # Extract medical data using Claude Sonnet-4
        medical_data = await voice_service.extract_medical_data(request.transcript)
        
        if not medical_data.get("success"):
            raise HTTPException(status_code=500, detail=medical_data.get("error"))
        
        # Format for storage
        formatted_notes = voice_service.format_for_storage(medical_data)
        
        # Store in database if appointment_id provided
        if request.appointment_id:
            db = await get_database()
            
            # Update appointment with medical history
            result = await db.appointments.update_one(
                {"id": request.appointment_id},
                {
                    "$set": {
                        "medicalHistory": medical_data.get("data"),
                        "medicalHistoryText": formatted_notes,
                        "voiceTranscript": request.transcript,
                        "updatedAt": datetime.now().isoformat()
                    }
                }
            )
            
            if result.modified_count == 0:
                logger.warning(f"Appointment {request.appointment_id} not found or not updated")
        
        return {
            "success": True,
            "medical_data": medical_data.get("data"),
            "formatted_notes": formatted_notes
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing transcript: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/health")
async def health_check():
    """Check if voice intake service is properly configured"""
    deepgram_key = os.getenv("DEEPGRAM_API_KEY")
    llm_key = os.getenv("EMERGENT_LLM_KEY")
    
    return {
        "status": "ok",
        "deepgram_configured": bool(deepgram_key and deepgram_key != "placeholder_deepgram_key"),
        "llm_configured": bool(llm_key)
    }
