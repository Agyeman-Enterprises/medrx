// Mock data for MedRx website

export const mockServices = [
  {
    id: '1',
    title: 'Acute Care',
    price: 85,
    description: 'Same-day virtual visits for urgent concerns: infections, minor injuries, medication refills, and symptom evaluation.',
    features: [
      'Video or phone consultation',
      'Same or next-day availability',
      'E-prescriptions sent directly',
      'Clear follow-up plan'
    ],
    color: 'accent-blue'
  },
  {
    id: '2',
    title: 'Wellness & Functional Medicine',
    price: 175,
    description: 'Comprehensive metabolic health, hormone optimization, GLP-1 therapy, and preventive care with extended consultation time.',
    features: [
      'Extended 45-minute consultation',
      'Hormone health & optimization',
      'GLP-1 therapy management',
      'Lab coordination & interpretation',
      'Personalized treatment plans'
    ],
    color: 'accent-purple'
  }
];

export const mockTimezones = [
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)', offset: -10 }, // UTC-10
  { value: 'America/Los_Angeles', label: 'California (PST/PDT)', offset: -8 }, // UTC-8 (PST) / UTC-7 (PDT)
  { value: 'Pacific/Guam', label: 'Guam (ChST)', offset: 10 } // UTC+10
];

// Guam operating hours: 8am-9pm ChST
// Generate time slots that respect both Guam hours AND local time limits
export const getAvailableTimeSlots = (selectedTimezone) => {
  const allSlots = [];
  
  // Generate hourly slots from 8am to 9pm
  for (let hour = 8; hour <= 21; hour++) {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour <= 12 ? hour : hour - 12;
    const timeString = `${displayHour.toString().padStart(2, '0')}:00 ${period}`;
    allSlots.push({
      guamTime: hour,
      display: timeString,
      value: timeString
    });
  }
  
  // Filter based on timezone to ensure socially acceptable hours
  if (!selectedTimezone) return allSlots.map(s => s.value);
  
  const tz = mockTimezones.find(t => t.value === selectedTimezone);
  if (!tz) return allSlots.map(s => s.value);
  
  // Calculate time difference from Guam
  const guamOffset = 10; // UTC+10
  const timeDiff = tz.offset - guamOffset;
  
  return allSlots.filter(slot => {
    const localHour = slot.guamTime + timeDiff;
    const adjustedHour = localHour < 0 ? localHour + 24 : localHour >= 24 ? localHour - 24 : localHour;
    
    // Must be between 8am and 10pm local time
    return adjustedHour >= 8 && adjustedHour <= 22;
  }).map(s => s.value);
};

// Default time slots (for Guam timezone)
export const mockTimeSlots = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'
];

export const mockTestimonials = [
  {
    id: '1',
    name: 'Sarah M.',
    location: 'Honolulu, HI',
    text: 'Finally, a doctor who takes time to listen. The intake was thorough, and my GLP-1 therapy has been life-changing.',
    rating: 5
  },
  {
    id: '2',
    name: 'James K.',
    location: 'San Diego, CA',
    text: 'Transparent pricing, easy scheduling, and genuine care. MedRx feels like medicine should be.',
    rating: 5
  },
  {
    id: '3',
    name: 'Linda T.',
    location: 'Guam',
    text: 'The hormone therapy consultation was incredibly detailed. I left with a clear plan and real answers.',
    rating: 5
  }
];

export const mockHowItWorks = [
  {
    step: '01',
    title: 'Book Your Visit',
    description: 'Choose your service and select a time that works for your timezone—Hawaii, California, or Guam.',
    icon: 'Calendar'
  },
  {
    step: '02',
    title: 'Complete Your Intake',
    description: 'Detailed health history and voice-dictation notes ensure your clinician arrives prepared.',
    icon: 'FileText'
  },
  {
    step: '03',
    title: 'Meet Your Clinician',
    description: 'Video or phone visit focused on listening, understanding, and building your personalized care plan.',
    icon: 'Video'
  },
  {
    step: '04',
    title: 'Seamless Follow-Up',
    description: 'Prescriptions, lab orders, and next steps—all coordinated and clearly communicated.',
    icon: 'CheckCircle'
  }
];

// Mock booking function
export const mockBookAppointment = (bookingData) => {
  console.log('Mock booking created:', bookingData);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        bookingId: 'MOCK-' + Date.now(),
        message: 'Appointment booked successfully!'
      });
    }, 1000);
  });
};

// Mock contact submission
export const mockContactSubmit = (contactData) => {
  console.log('Mock contact submission:', contactData);
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        message: 'Thank you! We\'ll be in touch within 24 hours.'
      });
    }, 1000);
  });
};