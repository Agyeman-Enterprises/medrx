import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar } from '../components/ui/calendar';
import { mockTimezones, getAvailableTimeSlots, mockServices, mockBookAppointment } from '../mock';
import '../styles/Booking.css';
import { Calendar as CalendarIcon, Clock, MapPin, User, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';

const Booking = () => {
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTimezone, setSelectedTimezone] = useState(mockTimezones[0].value);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get available time slots based on selected timezone
  const availableTimeSlots = useMemo(() => {
    return getAvailableTimeSlots(selectedTimezone);
  }, [selectedTimezone]);

  // Reset selected time if it's no longer available after timezone change
  useEffect(() => {
    if (selectedTime && !availableTimeSlots.includes(selectedTime)) {
      setSelectedTime('');
    }
  }, [availableTimeSlots, selectedTime]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedService || !selectedDate || !selectedTime) {
      toast.error('Please complete all booking fields');
      return;
    }

    setIsSubmitting(true);
    
    const bookingData = {
      ...formData,
      service: selectedService,
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      timezone: selectedTimezone
    };

    try {
      const result = await mockBookAppointment(bookingData);
      if (result.success) {
        toast.success('Appointment booked successfully! Check your email for confirmation.');
        // Reset form
        setSelectedService('');
        setSelectedDate(null);
        setSelectedTime('');
        setFormData({ name: '', email: '', phone: '' });
      }
    } catch (error) {
      toast.error('Booking failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <section id="booking" className="booking-section">
      <div className="container">
        <div className="section-header">
          <h2 className="heading-1">Book Your Visit</h2>
          <p className="body-large">
            Select your service, choose a convenient time, and we'll take care of the rest
          </p>
        </div>

        <form onSubmit={handleSubmit} className="booking-form">
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
            </div>

            {/* Service Selection */}
            <div className="booking-card">
              <h3 className="heading-2">Select Service</h3>
              <div className="service-options">
                {mockServices.map((service) => (
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
                        <span className="body-medium">{service.title}</span>
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
                  {mockTimezones.map((tz) => (
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
              <div className="time-slots">
                {mockTimeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="booking-summary">
            {selectedService && selectedDate && selectedTime && (
              <div className="summary-details">
                <p className="body-medium">
                  <strong>Selected:</strong> {mockServices.find(s => s.id === selectedService)?.title} 
                  {' '}- {format(selectedDate, 'MMMM d, yyyy')} at {selectedTime}
                  {' '}({mockTimezones.find(tz => tz.value === selectedTimezone)?.label})
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