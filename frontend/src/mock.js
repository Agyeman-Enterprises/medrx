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
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)' },
  { value: 'America/Los_Angeles', label: 'California (PST/PDT)' },
  { value: 'Pacific/Guam', label: 'Guam (ChST)' }
];

export const mockTimeSlots = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'
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