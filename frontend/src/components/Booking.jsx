import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar } from '../components/ui/calendar';
import { MEDRX_SERVICES } from '../mock';
import { TIMEZONES, getAvailableSlotsForTimezone, getTimezoneLabel } from '../utils/timezoneAvailability';
import MedicalQuestionnaire from './MedicalQuestionnaire';
import '../styles/Booking.css';
import { Calendar as CalendarIcon, Clock, MapPin, User, Mail, Phone, Home, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Booking = () => {
  // Step flow: 'service' → 'questionnaire' → 'booking' → 'confirming' → 'payment'
  const [bookingStep, setBookingStep] = useState('service');
  const [selectedService, setSelectedService] = useState('');
  
  // Handle service selection - move to questionnaire or booking
  const handleServiceSelect = useCallback((serviceId) => {
    setSelectedService(serviceId);
    const service = MEDRX_SERVICES.find(s => s.id === serviceId);
    
    // If service requires questionnaire, show it next
    if (service && service.requiresQuestionnaire) {
      setBookingStep('questionnaire');
    } else {
      // Otherwise go straight to booking
      setBookingStep('booking');
    }
  }, []);
  
  // Check for service from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('selectedService');
      if (stored) {
        sessionStorage.removeItem('selectedService');
        handleServiceSelect(stored);
      }
    } catch (e) {
      // Ignore sessionStorage errors
      console.warn('sessionStorage not available:', e);
    }
  }, [handleServiceSelect]);
  
  // Listen for service selection from Services component
  useEffect(() => {
    const handleServiceSelected = (event) => {
      const { serviceId } = event.detail;
      if (serviceId) {
        handleServiceSelect(serviceId);
      }
    };
    
    window.addEventListener('serviceSelected', handleServiceSelected);
    return () => window.removeEventListener('serviceSelected', handleServiceSelected);
  }, [handleServiceSelect]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState(TIMEZONES.CALIFORNIA);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip_code: '',
      country: 'US'
    }
  });
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];
    return getAvailableSlotsForTimezone(selectedDate, selectedTimezone);
  }, [selectedDate, selectedTimezone]);

  const timezoneOptions = [
    { value: TIMEZONES.CALIFORNIA, label: getTimezoneLabel(TIMEZONES.CALIFORNIA) },
    { value: TIMEZONES.HAWAII, label: getTimezoneLabel(TIMEZONES.HAWAII) },
    { value: TIMEZONES.GUAM, label: getTimezoneLabel(TIMEZONES.GUAM) }
  ];

  useEffect(() => {
    // Clear selected time if it's not in the new available slots
    if (selectedTime && !availableTimeSlots.find(slot => slot.time === selectedTime)) {
      setSelectedTime('');
    }
  }, [availableTimeSlots, selectedTime]);

  const selectedServiceData = MEDRX_SERVICES.find(s => s.id === selectedService);
  const requiresAddress = selectedService && selectedServiceData?.requiresAddress || false;

  // Handle questionnaire completion
  const handleQuestionnaireComplete = (answers) => {
    setQuestionnaireAnswers(answers);
    // After questionnaire, show booking form
    setBookingStep('booking');
  };

  const handleQuestionnaireCancel = () => {
    // Go back to service selection
    setSelectedService('');
    setBookingStep('service');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        address: {
          ...formData.address,
          [addressField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Create appointment in DrChrono and proceed to payment
  const handleConfirmBooking = async () => {
    // Validation
    if (!selectedDate) {
      toast.error('Please select a date');
      return;
    }
    
    if (!selectedTime) {
      toast.error('Please select a time');
      return;
    }
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error('Please fill in your name, email, and phone number');
      return;
    }

    if (requiresAddress) {
      if (!formData.address.street || !formData.address.city || !formData.address.state || !formData.address.zip_code) {
        toast.error('Address is required for prescription delivery');
        return;
      }
    }

    setIsConfirming(true);
    
    try {
      // First, create appointment in our system
      const appointmentData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        serviceId: selectedService,
        serviceType: 'oneoff',
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        timezone: selectedTimezone,
        address: requiresAddress ? formData.address : null,
        notes: questionnaireAnswers ? JSON.stringify(questionnaireAnswers) : ''
      };

      const appointmentResponse = await axios.post(`${API}/appointments/`, appointmentData);
      
      if (!appointmentResponse.data.success) {
        throw new Error('Failed to create appointment');
      }

      const appointmentId = appointmentResponse.data.appointmentId;
      
      // Create appointment in DrChrono (if configured)
      try {
        // Convert appointment time to ISO format for DrChrono
        const appointmentDateTime = new Date(`${appointmentData.date}T${appointmentData.time}`);
        const drChronoData = {
          patient_data: {
            first_name: formData.name.split(' ')[0] || formData.name,
            last_name: formData.name.split(' ').slice(1).join(' ') || '',
            email: formData.email,
            cell_phone: formData.phone,
            address: requiresAddress ? `${formData.address.street}, ${formData.address.city}, ${formData.address.state} ${formData.address.zip_code}` : '',
            city: formData.address.city || '',
            state: formData.address.state || '',
            zip_code: formData.address.zip_code || ''
          },
          appointment_data: {
            scheduled_time: appointmentDateTime.toISOString(),
            duration: 15,
            reason: `${selectedServiceData?.name || 'Telemedicine Consultation'}`,
            status: 'Scheduled'
          }
        };

        // Call DrChrono API (if access token is available)
        // This would require the provider to be authenticated with DrChrono
        // For now, we'll store the appointment and proceed to payment
        // The appointment can be synced to DrChrono later
        
        console.log('Appointment created, proceeding to payment');
      } catch (drChronoError) {
        console.warn('DrChrono sync failed (may not be configured):', drChronoError);
        // Continue to payment even if DrChrono sync fails
      }

      // Store appointment data for payment
      sessionStorage.setItem('pendingAppointment', JSON.stringify({
        appointmentId,
        ...appointmentData,
        serviceId: selectedService
      }));

      // Proceed to payment
      initiatePayment(appointmentId);
      
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to confirm booking';
      toast.error(errorMessage);
      console.error('Booking confirmation error:', error);
      setIsConfirming(false);
    }
  };

  const initiatePayment = async (appointmentId) => {
    const service = MEDRX_SERVICES.find(s => s.id === selectedService);
    
    try {
      // Create checkout session
      const paymentData = {
        serviceId: selectedService,
        originUrl: window.location.origin,
        email: formData.email,
        appointmentData: {
          appointmentId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: requiresAddress ? formData.address : null,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          timezone: selectedTimezone,
          notes: questionnaireAnswers ? JSON.stringify(questionnaireAnswers) : ''
        }
      };

      const response = await axios.post(`${API}/payments/checkout/session`, paymentData);
      
      if (response.data.success && response.data.url) {
        // Update sessionStorage with session ID
        const pendingData = JSON.parse(sessionStorage.getItem('pendingAppointment') || '{}');
        pendingData.sessionId = response.data.sessionId;
        sessionStorage.setItem('pendingAppointment', JSON.stringify(pendingData));
        
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        throw new Error('Invalid payment response - missing URL');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Payment initialization failed';
      toast.error(errorMessage);
      console.error('Payment error:', error);
      setIsConfirming(false);
    }
  };

  // Show service selection step
  if (bookingStep === 'service') {
    return (
      <section id="booking" className="booking-section">
        <div className="container">
          <div className="section-header">
            <h2 className="heading-1">Book Your Visit</h2>
            <p className="body-large">
              Select your service to begin
            </p>
          </div>

          <div className="booking-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h3 className="heading-2">Select Service</h3>
            <div className="service-options">
              {MEDRX_SERVICES.map((service) => (
                <label 
                  key={service.id} 
                  className="service-option"
                  style={{ cursor: 'pointer' }}
                >
                  <input
                    type="radio"
                    name="service"
                    value={service.id}
                    checked={selectedService === service.id}
                    onChange={(e) => handleServiceSelect(e.target.value)}
                  />
                  <div className="service-option-content">
                    <div className="service-option-header">
                      <span className="body-medium">{service.name}</span>
                      <span className="price-badge">${service.price}</span>
                    </div>
                    <p className="caption">{service.description}</p>
                    <p className="caption" style={{ marginTop: '0.5rem', color: 'var(--accent-purple)' }}>
                      {service.duration} consultation • {service.note}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show questionnaire step
  if (bookingStep === 'questionnaire') {
    const service = MEDRX_SERVICES.find(s => s.id === selectedService);
    return (
      <section id="booking" className="booking-section">
        <MedicalQuestionnaire 
          serviceCategory={service.category}
          onComplete={handleQuestionnaireComplete}
          onCancel={handleQuestionnaireCancel}
        />
      </section>
    );
  }

  // Show booking form (2-card layout)
  const service = MEDRX_SERVICES.find(s => s.id === selectedService);
  const isBookingValid = selectedDate && selectedTime && formData.name && formData.email && formData.phone && 
    (!requiresAddress || (formData.address.street && formData.address.city && formData.address.state && formData.address.zip_code));
  
  return (
    <section id="booking" className="booking-section">
      <div className="container" style={{ maxWidth: '1200px' }}>
        <div className="section-header">
          <h2 className="heading-1">Complete Your Booking</h2>
          <p className="body-large">
            {service?.name} - ${service?.price} consultation
          </p>
        </div>

        <div className="booking-form-two-cards">
          {/* Card 1: Demographics */}
          <div className="booking-card demographics-card">
            <h3 className="heading-2">Your Information</h3>
            <div className="form-grid-demographics">
              <div className="form-group">
                <label className="form-label">
                  <User size={16} />
                  Full Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Mail size={16} />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  <Phone size={16} />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="(808) 123-4567"
                  required
                />
              </div>

              {/* Address fields for services that require it */}
              {requiresAddress && (
                <>
                  <div className="form-group full-width">
                    <label className="form-label">
                      <Home size={16} />
                      Street Address *
                    </label>
                    <input
                      type="text"
                      name="address.street"
                      value={formData.address.street}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="123 Main Street"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">City *</label>
                    <input
                      type="text"
                      name="address.city"
                      value={formData.address.city}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="Honolulu"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">State *</label>
                    <select
                      name="address.state"
                      value={formData.address.state}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                    >
                      <option value="">Select State</option>
                      <option value="HI">Hawaii</option>
                      <option value="CA">California</option>
                      <option value="GU">Guam</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">ZIP Code *</label>
                    <input
                      type="text"
                      name="address.zip_code"
                      value={formData.address.zip_code}
                      onChange={handleInputChange}
                      className="form-input"
                      placeholder="96815"
                      required
                    />
                  </div>
                  <p className="caption" style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    * Address required for prescription delivery
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Card 2: Timezone, Date, Time */}
          <div className="booking-card appointment-card">
            {/* Timezone across top */}
            <div className="timezone-selector">
              <label className="form-label">
                <MapPin size={16} />
                Your Timezone *
              </label>
              <select
                value={selectedTimezone}
                onChange={(e) => setSelectedTimezone(e.target.value)}
                className="form-input timezone-select"
                required
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time side-by-side */}
            <div className="date-time-grid">
              {/* Date Selection */}
              <div className="date-selection">
                <h3 className="heading-3">
                  <CalendarIcon size={18} />
                  Select Date
                </h3>
                <div className="calendar-wrapper">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    className="booking-calendar"
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div className="time-selection">
                <h3 className="heading-3">
                  <Clock size={18} />
                  Select Time
                </h3>
                {!selectedDate && (
                  <p className="caption" style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>
                    Please select a date first
                  </p>
                )}
                {selectedDate && availableTimeSlots.length === 0 && (
                  <p className="caption" style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>
                    No available slots on this day
                  </p>
                )}
                <div className="time-slots-grid">
                  {availableTimeSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setSelectedTime(slot.time)}
                      className={`time-slot ${selectedTime === slot.time ? 'selected' : ''}`}
                    >
                      {slot.display}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Banner */}
        <div className="booking-banner">
          <div className="banner-content">
            {selectedDate && selectedTime ? (
              <div className="banner-selection">
                <Check size={20} color="#10b981" />
                <div className="selection-text">
                  <strong>{service?.name}</strong> - {format(selectedDate, 'MMMM d, yyyy')} at {selectedTime}
                  <span className="timezone-label"> ({timezoneOptions.find(tz => tz.value === selectedTimezone)?.label})</span>
                </div>
              </div>
            ) : (
              <div className="banner-selection">
                <p className="body-medium">Please complete your booking information above</p>
              </div>
            )}
          </div>
          <div className="banner-actions">
            <button
              type="button"
              onClick={() => {
                setSelectedService('');
                setQuestionnaireAnswers(null);
                setSelectedDate(null);
                setSelectedTime('');
                setBookingStep('service');
              }}
              className="btn-banner-exit"
            >
              <X size={18} />
              Exit
            </button>
            <button
              type="button"
              onClick={handleConfirmBooking}
              className="btn-banner-confirm"
              disabled={!isBookingValid || isConfirming}
            >
              {isConfirming ? 'Confirming...' : 'Confirm & Pay'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Booking;
