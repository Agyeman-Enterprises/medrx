from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
import os
import json
import asyncio
from deepgram import DeepgramClient, LiveTranscriptionEvents, LiveOptions
from services.voice_intake import VoiceIntakeService
from database import get_database
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/voice-intake", tags=["voice-intake"])

voice_service = VoiceIntakeService()

class ProcessTranscriptRequest(BaseModel):
    transcript: str
    appointment_id: str

@router.websocket("/ws/transcribe")
async def websocket_transcription_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time voice transcription using Deepgram
    """
    await websocket.accept()
    
    deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")
    if not deepgram_api_key or deepgram_api_key == "placeholder_deepgram_key":
        await websocket.send_json({
            'type': 'error',
            'message': 'Deepgram API key not configured'
        })
        await websocket.close()
        return
    
    try:
        # Initialize Deepgram client
        deepgram = DeepgramClient(deepgram_api_key)
        
        # Configure transcription options
        options = LiveOptions(
            model="nova-2-medical",
            language="en-US",
            smart_format=True,
            punctuate=True,
            interim_results=True,
            endpointing=300,  # 300ms of silence to detect end of speech
        )
        
        # Store transcription chunks
        transcript_chunks = []
        
        # Create Deepgram live connection
        dg_connection = deepgram.listen.live.v("1")
        
        # Event handler for transcript received
        def on_message(self, result, **kwargs):
            try:
                sentence = result.channel.alternatives[0].transcript
                if len(sentence) > 0:
                    is_final = result.is_final
                    
                    # Store final transcripts
                    if is_final:
                        transcript_chunks.append(sentence)
                    
                    # Send to frontend
                    asyncio.create_task(
                        websocket.send_json({
                            'type': 'transcript',
                            'text': sentence,
                            'is_final': is_final
                        })
                    )
            except Exception as e:
                logger.error(f"Error in transcript handler: {e}")
        
        def on_error(self, error, **kwargs):
            logger.error(f"Deepgram error: {error}")
            asyncio.create_task(
                websocket.send_json({
                    'type': 'error',
                    'message': f"Transcription error: {str(error)}"
                })
            )
        
        def on_close(self, close_msg, **kwargs):
            logger.info("Deepgram connection closed")
        
        # Register event handlers
        dg_connection.on(LiveTranscriptionEvents.Transcript, on_message)
        dg_connection.on(LiveTranscriptionEvents.Error, on_error)
        dg_connection.on(LiveTranscriptionEvents.Close, on_close)
        
        # Start Deepgram connection
        if dg_connection.start(options) is False:
            raise Exception("Failed to start Deepgram connection")
        
        # Send ready signal to frontend
        await websocket.send_json({
            'type': 'ready',
            'message': 'Connected to transcription service'
        })
        
        # Listen for audio from browser
        while True:
            try:
                message = await websocket.receive()
                
                if "bytes" in message:
                    # Audio data received - send to Deepgram
                    audio_data = message["bytes"]
                    dg_connection.send(audio_data)
                    
                elif "text" in message:
                    # Text command received
                    data = json.loads(message["text"])
                    
                    if data.get("type") == "stop":
                        # Stop recording - return full transcript
                        full_transcript = " ".join(transcript_chunks)
                        await websocket.send_json({
                            'type': 'complete',
                            'full_transcript': full_transcript
                        })
                        break
                        
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
        # Cleanup
        try:
            if 'dg_connection' in locals():
                dg_connection.finish()
        except:
            pass
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
                raise HTTPException(status_code=404, detail="Appointment not found")
        
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
