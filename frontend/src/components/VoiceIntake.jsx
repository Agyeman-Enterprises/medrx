import React, { useState, useRef, useEffect } from 'react';
import { voiceIntakePrompts } from '../mockMedVi';
import '../styles/VoiceIntake.css';
import { Mic, MicOff, Loader, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const wsProtocol = BACKEND_URL.startsWith('https') ? 'wss' : 'ws';
const wsBaseUrl = BACKEND_URL.replace(/^https?:\/\//, '');

const VoiceIntake = ({ patientEmail, appointmentId, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000
        }
      });

      streamRef.current = stream;

      // Connect to voice intake WebSocket
      const wsUrl = `${wsProtocol}://${wsBaseUrl}/api/voice-intake/ws/transcribe`;
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Voice intake WebSocket connected');
        toast.success('Connected - start speaking');
      };

      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'transcript') {
          if (data.is_final) {
            setFinalTranscript(prev => prev + ' ' + data.text);
            setTranscript('');
          } else {
            setTranscript(data.text);
          }
        } else if (data.type === 'error') {
          toast.error(data.message);
        } else if (data.type === 'ready') {
          console.log('Transcription ready');
        } else if (data.type === 'complete') {
          setFinalTranscript(data.full_transcript);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error. Please try again.');
      };

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(event.data);
        }
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      toast.success('Recording started - speak naturally');
    } catch (error) {
      console.error('Microphone error:', error);
      toast.error('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'stop' }));
    }
    setIsRecording(false);
    toast.info('Recording stopped');
  };

  const completeIntake = async () => {
    if (!finalTranscript.trim()) {
      toast.error('Please record your medical history first');
      return;
    }

    setIsProcessing(true);

    try {
      // Send transcript to backend for AI extraction
      const response = await fetch(`${BACKEND_URL}/api/voice-intake/process-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: finalTranscript,
          appointment_id: appointmentId || null
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setExtractedData(data.medical_data);
        toast.success('Medical history captured successfully!');
        setTimeout(() => onComplete({
          transcript: finalTranscript,
          medicalData: data.medical_data,
          formattedNotes: data.formatted_notes
        }), 2000);
      } else {
        throw new Error(data.detail || 'Failed to process transcript');
      }
    } catch (error) {
      console.error('Error processing voice intake:', error);
      toast.error('Failed to process medical history');
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return (
      <div className="voice-intake-container">
        <div className="voice-intake-card processing">
          <Loader size={64} className="spinner" />
          <h2 className="heading-1">Processing Your Medical History...</h2>
          <p className="body-large">Our AI is extracting key medical information for physician review.</p>
        </div>
      </div>
    );
  }

  if (extractedData) {
    return (
      <div className="voice-intake-container">
        <div className="voice-intake-card success">
          <CheckCircle size={64} color="#10b981" />
          <h2 className="heading-1">Medical History Complete!</h2>
          <p className="body-large">Your information has been captured and will be reviewed by our physicians.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="voice-intake-container">
      <div className="voice-intake-card">
        <h2 className="heading-2">Share Your Medical History</h2>
        <p className="body-large">Please speak naturally and answer these topics:</p>
        
        <div className="prompts-list">
          {voiceIntakePrompts.map((prompt, idx) => (
            <div key={idx} className="prompt-item">
              <span className="prompt-number">{idx + 1}</span>
              <span>{prompt}</span>
            </div>
          ))}
        </div>

        <div className="recording-controls">
          {!isRecording && !finalTranscript ? (
            <button
              onClick={startRecording}
              className="mic-button"
            >
              <Mic size={48} />
              <span>Start Recording</span>
            </button>
          ) : isRecording ? (
            <>
              <div className="recording-indicator">
                <div className="pulse-dot"></div>
                <span>Recording...</span>
              </div>
              <button
                onClick={stopRecording}
                className="mic-button recording"
              >
                <MicOff size={48} />
                <span>Stop Recording</span>
              </button>
            </>
          ) : null}
        </div>

        {(transcript || finalTranscript) && (
          <div className="transcript-display">
            <h3>Transcript:</h3>
            <p className="final-text">{finalTranscript}</p>
            {transcript && <p className="interim-text"><em>{transcript}</em></p>}
          </div>
        )}

        {finalTranscript && !isRecording && (
          <div className="action-buttons">
            <button
              onClick={() => {
                setFinalTranscript('');
                setTranscript('');
              }}
              className="btn-secondary"
            >
              Clear & Re-record
            </button>
            <button
              onClick={completeIntake}
              className="btn-primary"
            >
              Complete & Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceIntake;