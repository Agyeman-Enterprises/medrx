// GLP-1 Weight Loss Services - Initial Evaluations (One-time)
export const glp1InitialServices = [
  {
    id: 'glp1-sema-initial',
    title: 'GLP-1 Semaglutide - Initial Evaluation',
    price: 150.00,
    billingPeriod: '/visit',
    duration: '15-30 min',
    type: 'oneoff',
    category: 'weight-loss',
    medication: 'Semaglutide',
    description: '15-30 minute telemedicine visit, medical screening, eligibility review, prescription if appropriate, home-delivery coordination.',
    features: [
      '15-30 minute telemedicine visit',
      'Medical screening questionnaire',
      'Eligibility review',
      'Semaglutide prescription (if appropriate)',
      'Home-delivery coordination'
    ],
    note: 'Medication billed separately by pharmacy',
    color: 'accent-purple',
    requiresQuestionnaire: true,
    requiresPayment: true,
    requiresAddress: true
  },
  {
    id: 'glp1-tirz-initial',
    title: 'GLP-1 Tirzepatide - Initial Evaluation',
    price: 279.00,
    billingPeriod: '/visit',
    duration: '15-30 min',
    type: 'oneoff',
    category: 'weight-loss',
    medication: 'Tirzepatide',
    description: '15-30 minute telemedicine visit, medical screening, eligibility review, prescription if appropriate, home-delivery coordination.',
    features: [
      '15-30 minute telemedicine visit',
      'Medical screening questionnaire',
      'Eligibility review',
      'Tirzepatide prescription (if appropriate)',
      'Home-delivery coordination'
    ],
    note: 'Medication billed separately by pharmacy',
    color: 'accent-purple',
    requiresQuestionnaire: true,
    requiresPayment: true,
    requiresAddress: true
  }
];

// GLP-1 Monthly Management Subscriptions
export const glp1Subscriptions = [
  {
    id: 'glp1-sema-monthly',
    title: 'GLP-1 Semaglutide - Monthly Management',
    price: 249.00,
    billingPeriod: '/month',
    type: 'subscription',
    category: 'weight-loss-management',
    medication: 'Semaglutide',
    description: 'Ongoing physician supervision, dose adjustments, secure messaging, side-effect support, monthly follow-up, lab monitoring.',
    features: [
      'Ongoing physician supervision',
      'Dose adjustments',
      'Secure messaging with care team',
      'Side-effect support',
      'Monthly follow-up visits',
      'Lab monitoring coordination'
    ],
    note: 'Medication typically $349-$499/mo via pharmacy',
    color: 'accent-purple',
    tier: 'glp1-management'
  },
  {
    id: 'glp1-tirz-monthly',
    title: 'GLP-1 Tirzepatide - Monthly Management',
    price: 329.00,
    billingPeriod: '/month',
    type: 'subscription',
    category: 'weight-loss-management',
    medication: 'Tirzepatide',
    description: 'Ongoing physician supervision, dose adjustments, secure messaging, side-effect support, monthly follow-up, lab monitoring.',
    features: [
      'Ongoing physician supervision',
      'Dose adjustments',
      'Secure messaging with care team',
      'Side-effect support',
      'Monthly follow-up visits',
      'Lab monitoring coordination'
    ],
    note: 'Medication typically $349-$499/mo via pharmacy',
    color: 'accent-purple',
    tier: 'glp1-management'
  },
  {
    id: 'metabolic-coaching',
    title: 'Metabolic Coaching Add-On',
    price: 99.00,
    billingPeriod: '/month',
    type: 'subscription',
    category: 'coaching',
    description: '2x/month health coach check-ins for diet, exercise, motivation.',
    features: [
      '2 health coach sessions per month',
      'Diet guidance',
      'Exercise planning',
      'Motivation support'
    ],
    color: 'accent-green-200',
    tier: 'coaching',
    addon: true
  }
];

// Other Pay-Per-Visit Services
export const otherServices = [
  {
    id: 'hormone-health',
    title: 'Hormone Health & Rx',
    price: 150.00,
    billingPeriod: '/visit',
    duration: '15-30 min',
    type: 'oneoff',
    category: 'hormone',
    description: 'Brief consultation for hormone therapy prescriptions. Includes screening, lab review, and Rx for hormone optimization.',
    features: [
      '15-30 minute consultation',
      'Medical screening questionnaire',
      'Hormone therapy prescription',
      'Lab interpretation',
      'Treatment plan'
    ],
    color: 'accent-blue',
    requiresQuestionnaire: true,
    requiresPayment: true
  },
  {
    id: 'acute-care',
    title: 'Acute Care Visit',
    price: 85.00,
    billingPeriod: '/visit',
    duration: '15-30 min',
    type: 'oneoff',
    category: 'general',
    description: 'Same-day virtual visits for urgent concerns: infections, minor injuries, medication refills, and symptom evaluation.',
    features: [
      '15-30 minute consultation',
      'Medical screening questionnaire',
      'Video or phone consultation',
      'E-prescriptions sent directly',
      'Clear follow-up plan'
    ],
    color: 'accent-blue',
    requiresQuestionnaire: true,
    requiresPayment: true
  },
  {
    id: 'functional-medicine',
    title: 'Functional Medicine Visit',
    price: 175.00,
    billingPeriod: '/visit',
    duration: '15-30 min',
    type: 'oneoff',
    category: 'functional',
    description: 'Comprehensive metabolic health and preventive care consultation with personalized treatment approach.',
    features: [
      '15-30 minute consultation',
      'Medical screening questionnaire',
      'Metabolic health assessment',
      'Lab coordination & interpretation',
      'Personalized treatment plans'
    ],
    color: 'accent-orange-200',
    requiresQuestionnaire: true,
    requiresPayment: true
  }
];

// Standard subscription plans
export const standardSubscriptions = [
  {
    id: 'sub-basic',
    title: 'Basic Access',
    price: 35.00,
    priceRange: '$25–$50',
    billingPeriod: '/month',
    type: 'subscription',
    description: 'Essential telemedicine access for occasional healthcare needs with cost-effective virtual care.',
    features: [
      'Limited urgent visits (1–2/month)',
      'Chat messaging with RN/MA',
      'Discounted labs & prescriptions',
      'Standard appointment booking'
    ],
    color: 'accent-grey-200',
    tier: 'basic'
  },
  {
    id: 'sub-standard',
    title: 'Standard Care',
    price: 150.00,
    priceRange: '$100–$200',
    billingPeriod: '/month',
    type: 'subscription',
    description: 'Comprehensive primary care coverage with unlimited consultations and priority access to your care team.',
    features: [
      'Unlimited general medicine consults',
      'Priority appointment booking',
      'Care coordination & follow-ups',
      'Physician messaging access',
      'Preventive care planning'
    ],
    color: 'accent-blue',
    tier: 'standard'
  }
];

// Combined for display
export const mockOneOffServices = [...glp1InitialServices, ...otherServices];
export const mockSubscriptions = [...glp1Subscriptions, ...standardSubscriptions];
export const mockServices = [...mockOneOffServices, ...mockSubscriptions];

export const mockTimezones = [
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)', offset: -10 },
  { value: 'America/Los_Angeles', label: 'California (PST/PDT)', offset: -8 },
  { value: 'Pacific/Guam', label: 'Guam (ChST)', offset: 10 }
];

// Guam operating hours: 8am-9pm ChST
export const getAvailableTimeSlots = (selectedTimezone) => {
  const allSlots = [];
  
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
  
  if (!selectedTimezone) return allSlots.map(s => s.value);
  
  const tz = mockTimezones.find(t => t.value === selectedTimezone);
  if (!tz) return allSlots.map(s => s.value);
  
  const guamOffset = 10;
  const timeDiff = tz.offset - guamOffset;
  
  return allSlots.filter(slot => {
    const localHour = slot.guamTime + timeDiff;
    const adjustedHour = localHour < 0 ? localHour + 24 : localHour >= 24 ? localHour - 24 : localHour;
    return adjustedHour >= 8 && adjustedHour <= 22;
  }).map(s => s.value);
};

export const mockTimeSlots = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
  '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'
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
    title: 'Complete Medical Screening',
    description: 'Answer our comprehensive questionnaire to ensure the treatment is safe and appropriate for you.',
    icon: 'FileText'
  },
  {
    step: '03',
    title: 'Secure Payment',
    description: 'Complete payment securely via Stripe before your appointment is confirmed.',
    icon: 'CreditCard'
  },
  {
    step: '04',
    title: 'Meet Your Physician',
    description: 'Video or phone visit focused on your health goals, with prescription sent to your pharmacy if appropriate.',
    icon: 'Video'
  }
];

export const mockTestimonials = [
  {
    id: '1',
    name: 'Sarah M.',
    location: 'Honolulu, HI',
    text: 'The GLP-1 program changed my life. Lost 35 lbs in 4 months with Dr. Chen\'s guidance.',
    rating: 5
  },
  {
    id: '2',
    name: 'James K.',
    location: 'San Diego, CA',
    text: 'Transparent pricing, easy scheduling, and genuine care. Best telemedicine experience.',
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