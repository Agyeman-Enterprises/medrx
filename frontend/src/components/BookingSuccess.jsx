import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/BookingSuccess.css';
import { CheckCircle, Loader, XCircle } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const BookingSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState('checking'); // 'checking', 'success', 'failed'
  const [appointmentData, setAppointmentData] = useState(null);
  const [pollAttempts, setPollAttempts] = useState(0);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    // Get pending appointment data from sessionStorage
    const pendingData = sessionStorage.getItem('pendingAppointment');
    if (pendingData) {
      setAppointmentData(JSON.parse(pendingData));
    }

    // Start polling for payment status
    pollPaymentStatus();
  }, [sessionId]);

  const pollPaymentStatus = async (attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000; // 2 seconds

    if (attempts >= maxAttempts) {
      setPaymentStatus('timeout');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/checkout/status/${sessionId}`);
      
      if (response.data.paymentStatus === 'paid') {
        // Payment successful - create appointment
        await createAppointment();
        setPaymentStatus('success');
        sessionStorage.removeItem('pendingAppointment');
        return;
      } else if (response.data.status === 'expired') {
        setPaymentStatus('failed');
        return;
      }

      // Continue polling
      setPollAttempts(attempts + 1);
      setTimeout(() => pollPaymentStatus(attempts + 1), pollInterval);
    } catch (error) {
      console.error('Payment status check error:', error);
      setPaymentStatus('error');
    }
  };

  const createAppointment = async () => {
    try {
      const data = JSON.parse(sessionStorage.getItem('pendingAppointment'));
      
      const bookingData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address,
        serviceId: data.serviceId,
        serviceType: data.serviceType,
        date: data.date,
        time: data.time,
        timezone: data.timezone,
        notes: data.notes,
        paymentSessionId: sessionId
      };

      await axios.post(`${API}/appointments/`, bookingData);
    } catch (error) {
      console.error('Appointment creation error:', error);
    }
  };

  if (paymentStatus === 'checking') {
    return (
      <div className="booking-success-container">
        <div className="booking-success-card">
          <div className="status-icon">
            <Loader size={64} className="spinner" />
          </div>
          <h1 className="heading-1">Processing Payment...</h1>
          <p className="body-large">
            Please wait while we confirm your payment. Do not close this window.
          </p>
          <p className="caption">Attempt {pollAttempts + 1} of 5</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="booking-success-container">
        <div className="booking-success-card success">
          <div className="status-icon">
            <CheckCircle size={64} color="#10b981" />
          </div>
          <h1 className="heading-1">Payment Successful!</h1>
          <p className="body-large">
            Your appointment has been confirmed. Check your email for confirmation details.
          </p>
          
          {appointmentData && (
            <>
              <div className="appointment-summary">
                <h3 className="heading-2">Appointment Details</h3>
                <div className="summary-item">
                  <span className="label">Service:</span>
                  <span className="value">{appointmentData.serviceId}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Date:</span>
                  <span className="value">{appointmentData.date}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Time:</span>
                  <span className="value">{appointmentData.time}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Timezone:</span>
                  <span className="value">{appointmentData.timezone}</span>
                </div>
              </div>

              <div className="forms-section">
                <h3 className="heading-2">Complete Your Forms</h3>
                <p className="body-medium">
                  Please complete your medical intake form and consent forms before your appointment. 
                  You can complete them now or later using the links below.
                </p>
                <div className="form-links">
                  <a 
                    href={`/intake?patient_id=${appointmentData.email}&appointment_id=${sessionId}`}
                    className="btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-block', marginRight: '1rem' }}
                  >
                    Complete Intake Form
                  </a>
                  <a 
                    href={`/consents?patient_id=${appointmentData.email}&appointment_id=${sessionId}`}
                    className="btn-secondary"
                    style={{ textDecoration: 'none', display: 'inline-block' }}
                  >
                    Sign Consent Forms
                  </a>
                </div>
                <p className="caption" style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
                  Links will also be sent to your email: {appointmentData.email}
                </p>
              </div>
            </>
          )}

          <div className="action-buttons">
            <button onClick={() => navigate('/')} className="btn-primary">
              Return to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Failed or timeout
  return (
    <div className="booking-success-container">
      <div className="booking-success-card error">
        <div className="status-icon">
          <XCircle size={64} color="#ef4444" />
        </div>
        <h1 className="heading-1">Payment Issue</h1>
        <p className="body-large">
          {paymentStatus === 'timeout' 
            ? 'Payment verification timed out. Please check your email for confirmation or contact support.'
            : 'There was an issue processing your payment. Please try again or contact support.'}
        </p>
        <button onClick={() => navigate('/#booking')} className="btn-primary">
          Try Again
        </button>
      </div>
    </div>
  );
};

export default BookingSuccess;
