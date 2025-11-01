import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar } from '../components/ui/calendar';
import { MEDRX_SERVICES } from '../mock';
import { TIMEZONES, getAvailableSlotsForTimezone, getTimezoneLabel } from '../utils/timezoneAvailability';
import MedicalQuestionnaire from './MedicalQuestionnaire';
import '../styles/Booking.css';
import '../styles/BookingExtensions.css';
import { Calendar as CalendarIcon, Clock, MapPin, User, Mail, Phone, Home } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Booking = () => {
  const [bookingStep, setBookingStep] = useState('form'); // 'form', 'questionnaire', 'payment', 'processing'
  const [selectedService, setSelectedService] = useState('');
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
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleFormSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!selectedService) {
      toast.error('Please select a service');
      return;
    }
    
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

    // Validate address for services that require it
    if (requiresAddress) {
      if (!formData.address.street || !formData.address.city || !formData.address.state || !formData.address.zip_code) {
        toast.error('Address is required for prescription delivery');
        return;
      }
    }

    const service = MEDRX_SERVICES.find(s => s.id === selectedService);
    
    if (service && service.requiresQuestionnaire) {
      setBookingStep('questionnaire');
    } else {
      submitBooking();
    }
  };

  const handleQuestionnaireComplete = (answers) => {
    setQuestionnaireAnswers(answers);
    // After questionnaire, proceed to payment
    initiatePayment(answers);
  };

  const handleQuestionnaireCancel = () => {
    setBookingStep('form');
  };

  const initiatePayment = async (questionnaire = questionnaireAnswers) => {
    setIsSubmitting(true);
    setBookingStep('processing');
    
    const service = MEDRX_SERVICES.find(s => s.id === selectedService);
    
    try {
      // Create checkout session
      const paymentData = {
        serviceId: selectedService,
        originUrl: window.location.origin,
        email: formData.email,
        appointmentData: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: requiresAddress ? formData.address : null,
          date: format(selectedDate, 'yyyy-MM-dd'),
          time: selectedTime,
          timezone: selectedTimezone,
          notes: questionnaire ? JSON.stringify(questionnaire) : ''
        }
      };

      console.log('Initiating payment with data:', paymentData);
      
      const response = await axios.post(`${API}/payments/checkout/session`, paymentData);
      
      console.log('Payment response:', response.data);
      
      if (response.data.success && response.data.url) {
        // Store session ID and appointment data in sessionStorage
        sessionStorage.setItem('pendingAppointment', JSON.stringify({
          sessionId: response.data.sessionId,
          ...paymentData.appointmentData,
          serviceId: selectedService,
          serviceType: service.type
        }));
        
        console.log('Redirecting to Stripe:', response.data.url);
        
        // Redirect to Stripe checkout
        window.location.href = response.data.url;
      } else {
        throw new Error('Invalid payment response - missing URL');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Payment initialization failed';
      toast.error(errorMessage);
      console.error('Payment error:', error);
      setBookingStep('form');
    } finally {
      setIsSubmitting(false);
    }
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

  // Show processing step
  if (bookingStep === 'processing') {
    return (
      <section id="booking" className="booking-section">
        <div className="container">
          <div className="processing-message">
            <h2 className="heading-1">Redirecting to Payment...</h2>
            <p className="body-large">Please wait while we prepare your secure checkout.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="booking" className="booking-section">
      <div className="container">
        <div className="section-header">
          <h2 className="heading-1">Book Your Visit</h2>
          <p className="body-large">
            Select your service, choose a convenient time, and complete the medical screening
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="booking-form">
          <div className="booking-grid">
            {/* Personal Information */}
            <div className="booking-card">
              <h3 className="heading-2">Your Information</h3>
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

              {/* Address fields for GLP-1 services (eRx requirement) */}
              {requiresAddress && (
                <>
                  <div className="form-group">
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
                      required={requiresAddress}
                    />
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input
                        type="text"
                        name="address.city"
                        value={formData.address.city}
                        onChange={handleInputChange}
                        className="form-input"
                        placeholder="Honolulu"
                        required={requiresAddress}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <select
                        name="address.state"
                        value={formData.address.state}
                        onChange={handleInputChange}
                        className="form-input"
                        required={requiresAddress}
                      >
                        <option value="">Select State</option>
                        <option value="HI">Hawaii</option>
                        <option value="CA">California</option>
                        <option value="GU">Guam</option>
                      </select>
                    </div>
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
                      required={requiresAddress}
                    />
                  </div>
                  <p className="caption" style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                    * Address required for eRx prescription delivery
                  </p>
                </>
              )}
            </div>

            {/* Service Selection */}
            <div className="booking-card">
              <h3 className="heading-2">Select Service</h3>
              <div className="service-options">
                {MEDRX_SERVICES.map((service) => (
                  <label key={service.id} className="service-option">
                    <input
                      type="radio"
                      name="service"
                      value={service.id}
                      checked={selectedService === service.id}
                      onChange={(e) => setSelectedService(e.target.value)}
                      required
                    />
                    <div className="service-option-content">
                      <div className="service-option-header">
                        <span className="body-medium">{service.name}</span>
                        <span className="price-badge">${service.price}</span>
                      </div>
                      <p className="caption">{service.description}</p>
                    </div>
                  </label>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MapPin size={16} />
                  Your Timezone *
                </label>
                <select
                  value={selectedTimezone}
                  onChange={(e) => setSelectedTimezone(e.target.value)}
                  className="form-input"
                  required
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="caption" style={{ marginTop: '0.5rem', color: 'var(--text-muted)' }}>
                  Available times shown are within 8am-10pm your local time
                </p>
              </div>
            </div>

            {/* Date Selection */}
            <div className="booking-card calendar-card">
              <h3 className="heading-2">
                <CalendarIcon size={20} />
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
            <div className="booking-card">
              <h3 className="heading-2">
                <Clock size={20} />
                Select Time
              </h3>
              {!selectedDate && (
                <p className="caption" style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>
                  Please select a date first
                </p>
              )}
              {selectedDate && availableTimeSlots.length === 0 && (
                <p className="caption" style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>
                  No available slots on this day (Provider closed Mondays)
                </p>
              )}
              <div className="time-slots">
                {availableTimeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedTime(slot.time)}
                    className={`time-slot ${selectedTime === slot.time ? 'selected' : ''}`}
                    title={`Corresponds to ${slot.guamTime} in Guam`}
                  >
                    {slot.display}
                  </button>
                ))}
              </div>
              {availableTimeSlots.length === 0 && (
                <p className="body-medium" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                  No available times for selected timezone
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="booking-summary">
            {selectedService && selectedDate && selectedTime && (
              <div className="summary-details">
                <p className="body-medium">
                  <strong>Selected:</strong> {MEDRX_SERVICES.find(s => s.id === selectedService)?.name} 
                  {' '}- {format(selectedDate, 'MMMM d, yyyy')} at {selectedTime}
                  {' '}({timezoneOptions.find(tz => tz.value === selectedTimezone)?.label})
                </p>
              </div>
            )}
            <button type="submit" className="btn-primary submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Booking;