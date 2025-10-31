// MEDVi-Style Service Structure - Direct GLP-1 Purchase

// Direct GLP-1 Purchase (No appointment needed - prescription only)
export const glp1DirectPurchase = [
  {
    id: 'glp1-sema-direct',
    title: 'Semaglutide Prescription',
    price: 179.00,
    billingPeriod: '',
    medication: 'Semaglutide',
    type: 'prescription',
    category: 'weight-loss',
    description: 'Get your semaglutide prescription after medical screening. Medication billed separately by pharmacy.',
    features: [
      'AI-powered medical screening',
      'Physician review & approval',
      'Electronic prescription (eRx)',
      'Pharmacy coordination',
      'Does NOT include medication cost'
    ],
    note: 'Medication typically $300-$400/month via pharmacy',
    color: 'accent-purple',
    requiresQuiz: true,
    requiresVoiceIntake: true,
    requiresAddress: true
  },
  {
    id: 'glp1-tirz-direct',
    title: 'Tirzepatide Prescription',
    price: 279.00,
    billingPeriod: '',
    medication: 'Tirzepatide',
    type: 'prescription',
    category: 'weight-loss',
    description: 'Get your tirzepatide prescription after medical screening. Medication billed separately by pharmacy.',
    features: [
      'AI-powered medical screening',
      'Physician review & approval',
      'Electronic prescription (eRx)',
      'Pharmacy coordination',
      'Does NOT include medication cost'
    ],
    note: 'Medication typically $400-$500/month via pharmacy',
    color: 'accent-purple',
    requiresQuiz: true,
    requiresVoiceIntake: true,
    requiresAddress: true
  }
];

// Other Services (Require appointment booking)
export const appointmentServices = [
  {
    id: 'hormone-health',
    title: 'Hormone Health Visit',
    price: 150.00,
    billingPeriod: '/visit',
    duration: '15-30 min',
    type: 'appointment',
    category: 'hormone',
    description: 'Telehealth consultation for hormone therapy. Includes screening, lab review, and treatment plan.',
    features: [
      '15-30 minute video consultation',
      'Medical screening',
      'Lab interpretation',
      'Hormone therapy prescription',
      'Follow-up care plan'
    ],
    color: 'accent-blue',
    requiresAppointment: true
  },
  {
    id: 'acute-care',
    title: 'Acute Care Visit',
    price: 85.00,
    billingPeriod: '/visit',
    duration: '15-30 min',
    type: 'appointment',
    category: 'general',
    description: 'Same-day telehealth for urgent concerns: infections, minor injuries, medication refills.',
    features: [
      '15-30 minute consultation',
      'Same or next-day availability',
      'E-prescriptions',
      'Clear follow-up plan'
    ],
    color: 'accent-blue',
    requiresAppointment: true
  },
  {
    id: 'functional-medicine',
    title: 'Functional Medicine Visit',
    price: 175.00,
    billingPeriod: '/visit',
    duration: '15-30 min',
    type: 'appointment',
    category: 'functional',
    description: 'Comprehensive metabolic health consultation with personalized treatment approach.',
    features: [
      '15-30 minute consultation',
      'Metabolic health assessment',
      'Lab coordination',
      'Personalized treatment plan'
    ],
    color: 'accent-orange-200',
    requiresAppointment: true
  }
];

// Monthly Management (Subscription)
export const glp1Management = [
  {
    id: 'glp1-sema-monthly',
    title: 'Semaglutide Management',
    price: 249.00,
    billingPeriod: '/month',
    type: 'subscription',
    category: 'weight-loss-management',
    medication: 'Semaglutide',
    description: 'Ongoing physician supervision, dose adjustments, secure messaging, monthly follow-ups.',
    features: [
      'Monthly physician check-ins',
      'Dose adjustments',
      'Secure messaging',
      'Side-effect management',
      'Lab monitoring'
    ],
    note: 'Medication billed separately',
    color: 'accent-purple',
    tier: 'glp1-management'
  },
  {
    id: 'glp1-tirz-monthly',
    title: 'Tirzepatide Management',
    price: 329.00,
    billingPeriod: '/month',
    type: 'subscription',
    category: 'weight-loss-management',
    medication: 'Tirzepatide',
    description: 'Ongoing physician supervision, dose adjustments, secure messaging, monthly follow-ups.',
    features: [
      'Monthly physician check-ins',
      'Dose adjustments',
      'Secure messaging',
      'Side-effect management',
      'Lab monitoring'
    ],
    note: 'Medication billed separately',
    color: 'accent-purple',
    tier: 'glp1-management'
  }
];

// GLP-1 Eligibility Quiz Questions
export const glp1EligibilityQuiz = [
  {
    id: 'age',
    question: 'Are you 18 years or older?',
    type: 'yesno',
    disqualifyIf: 'no',
    reason: 'GLP-1 medications are only approved for adults 18+'
  },
  {
    id: 'bmi',
    question: 'Is your BMI 27 or higher, or do you have weight-related health conditions?',
    type: 'yesno',
    disqualifyIf: 'no',
    reason: 'GLP-1 therapy is indicated for BMI ≥27 with comorbidities or BMI ≥30'
  },
  {
    id: 'thyroid',
    question: 'Do you or family members have history of medullary thyroid cancer (MTC) or MEN 2?',
    type: 'yesno',
    disqualifyIf: 'yes',
    reason: 'Personal or family history of MTC/MEN 2 is a contraindication'
  },
  {
    id: 'pancreatitis',
    question: 'Have you ever had pancreatitis?',
    type: 'yesno',
    disqualifyIf: 'yes',
    reason: 'History of pancreatitis is a contraindication for GLP-1 therapy'
  },
  {
    id: 'pregnant',
    question: 'Are you currently pregnant, planning pregnancy, or breastfeeding?',
    type: 'yesno',
    disqualifyIf: 'yes',
    reason: 'GLP-1 medications are not recommended during pregnancy or breastfeeding'
  }
];

// Voice Intake Prompts
export const voiceIntakePrompts = [
  "Tell me about your current medications and allergies",
  "Describe your weight loss goals and previous attempts",
  "Share your medical history, including any chronic conditions",
  "Do you have any concerns or questions about GLP-1 therapy?"
];

// Timezone Configuration
export const supportedTimezones = [
  { value: 'Pacific/Honolulu', label: 'Hawaii (HST)', offset: -10 },
  { value: 'America/Los_Angeles', label: 'California (PST/PDT)', offset: -8 },
  { value: 'Pacific/Guam', label: 'Guam (ChST)', offset: 10 }
];

// Generate Guam-based availability (8am-10pm Guam time, ending by 10pm local)
export const getAvailableSlots = (patientTimezone) => {
  const guamSlots = [];
  
  // Generate 8am-10pm Guam time slots
  for (let hour = 8; hour <= 22; hour++) {
    const period = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour <= 12 ? hour : hour - 12;
    guamSlots.push({
      guamHour: hour,
      time: `${String(displayHour).padStart(2, '0')}:00 ${period}`
    });
  }
  
  const tz = supportedTimezones.find(t => t.value === patientTimezone);
  if (!tz) return guamSlots.map(s => s.time);
  
  const timeDiff = tz.offset - 10; // Difference from Guam
  
  return guamSlots.filter(slot => {
    const localHour = slot.guamHour + timeDiff;
    const adjustedHour = localHour < 0 ? localHour + 24 : localHour >= 24 ? localHour - 24 : localHour;
    // Must end by 10pm local (22:00)
    return adjustedHour >= 8 && adjustedHour <= 22;
  }).map(s => s.time);
};

export const mockServices = [...glp1DirectPurchase, ...appointmentServices, ...glp1Management];
export const mockOneOffServices = glp1DirectPurchase;
export const mockSubscriptions = glp1Management;