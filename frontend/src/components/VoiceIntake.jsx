import React, { useState, useRef, useEffect } from 'react';
import { voiceIntakePrompts } from '../mockMedVi';
import '../styles/VoiceIntake.css';
import { Mic, MicOff, Loader, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8001';

const VoiceIntake = ({ patientEmail, onComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [allTranscripts, setAllTranscripts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const wsRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    // Initialize WebSocket connection to Deepgram
    wsRef.current = new WebSocket(`${WS_URL}/ws/voice-intake`);
    
    wsRef.current.onopen = () => {
      console.log('Voice intake WebSocket connected');
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'transcript') {
        setTranscript(data.text);
        if (data.is_final) {
          setAllTranscripts(prev => [...prev, data.text]);
        }
      }
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      toast.error('Connection error. Please refresh.');
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
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
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
        audioBitsPerSecond: 128000
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
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
  };

  const nextPrompt = () => {
    if (currentPrompt < voiceIntakePrompts.length - 1) {
      setCurrentPrompt(currentPrompt + 1);
      setTranscript('');
    } else {
      completeIntake();
    }
  };

  const completeIntake = async () => {
    setIsProcessing(true);
    stopRecording();

    try {
      // Send all transcripts to backend for AI extraction
      const response = await axios.post(`${API}/voice/extract-medical-data`, {
        email: patientEmail,
        transcripts: allTranscripts,
        full_transcript: allTranscripts.join(' ')
      });

      if (response.data.success) {
        setExtractedData(response.data.extracted_data);
        toast.success('Medical history captured successfully!');
        setTimeout(() => onComplete(response.data.extracted_data), 2000);
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
        <div className="prompt-progress">
          <span className="caption">
            Question {currentPrompt + 1} of {voiceIntakePrompts.length}
          </span>
        </div>

        <h2 className="heading-2 voice-prompt">
          {voiceIntakePrompts[currentPrompt]}
        </h2>

        <div className="recording-controls">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="mic-button"
            >
              <Mic size={48} />
              <span>Tap to Speak</span>
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="mic-button recording"
            >
              <MicOff size={48} />
              <span>Stop Recording</span>
            </button>
          )}
        </div>

        {transcript && (
          <div className="transcript-display">
            <p className="body-medium">{transcript}</p>
          </div>
        )}

        {allTranscripts[currentPrompt] && !isRecording && (
          <button
            onClick={nextPrompt}
            className="btn-primary"
          >
            {currentPrompt < voiceIntakePrompts.length - 1 ? 'Next Question' : 'Complete Intake'}
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceIntake;