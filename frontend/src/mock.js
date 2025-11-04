// MedRx Services - Weight Loss, Hormones, Hair Loss ONLY
// All consultations are $175 (labs and medications paid separately)

export const MEDRX_SERVICES = [
  {
    id: 'glp-semaglutide',
    name: 'GLP-1 Semaglutide',
    title: 'GLP-1 Semaglutide',
    category: 'weight-loss',
    description: 'Semaglutide (Wegovy/Ozempic) weight loss program with personalized dosing, smart monitoring, and results-driven follow-up.',
    price: 175,
    billingPeriod: '/consultation',
    duration: '15 min',
    type: 'consultation',
    medication: 'Semaglutide',
    includes: [
      'Initial medical evaluation',
      'GLP-1 eligibility screening',
      'Personalized treatment plan',
      'Semaglutide prescription (if medically appropriate)',
      'Follow-up care coordination'
    ],
    features: [
      '15-minute video consultation',
      'Comprehensive medical screening',
      'Weight loss goal planning',
      'Semaglutide prescription',
      'Medication titration protocol',
      'Ongoing monitoring guidance'
    ],
    note: 'Medications and lab work billed separately',
    icon: '💊',
    color: 'accent-purple',
    requiresQuestionnaire: true,
    requiresPayment: true,
    requiresAddress: true
  },
  {
    id: 'glp-tirzepatide',
    name: 'GLP-1 Tirzepatide',
    title: 'GLP-1 Tirzepatide',
    category: 'weight-loss',
    description: 'Tirzepatide (Mounjaro/Zepbound) weight loss program with personalized dosing, smart monitoring, and results-driven follow-up.',
    price: 249,
    billingPeriod: '/consultation',
    duration: '15 min',
    type: 'consultation',
    medication: 'Tirzepatide',
    includes: [
      'Initial medical evaluation',
      'GLP-1 eligibility screening',
      'Personalized treatment plan',
      'Tirzepatide prescription (if medically appropriate)',
      'Follow-up care coordination'
    ],
    features: [
      '15-minute video consultation',
      'Comprehensive medical screening',
      'Weight loss goal planning',
      'Tirzepatide prescription',
      'Medication titration protocol',
      'Ongoing monitoring guidance'
    ],
    note: 'Medications and lab work billed separately',
    icon: '💊',
    color: 'accent-purple',
    requiresQuestionnaire: true,
    requiresPayment: true,
    requiresAddress: true
  },
  {
    id: 'hormone-health',
    name: 'Hormone Health',
    title: 'Hormone Optimization',
    category: 'hormones',
    description: "Women's health, men's testosterone, thyroid optimization — root-cause treatment, not just symptom suppression.",
    price: 175,
    billingPeriod: '/consultation',
    duration: '15 min',
    type: 'consultation',
    includes: [
      'Comprehensive hormone assessment',
      'Symptom evaluation',
      'Lab review & interpretation',
      'Prescription (if medically appropriate)',
      'Ongoing monitoring protocol'
    ],
    features: [
      '15-minute video consultation',
      'Hormone symptom assessment',
      'Lab test recommendations',
      'Bioidentical hormone therapy options',
      'Personalized treatment protocol',
      'Follow-up monitoring plan'
    ],
    note: 'Lab work and medications billed separately',
    icon: '🔬',
    color: 'accent-pink',
    requiresQuestionnaire: false,
    requiresPayment: true,
    requiresAddress: true
  },
  {
    id: 'hair-loss',
    name: 'Hair Loss Solutions',
    title: 'Medical Hair Restoration',
    category: 'hair-loss',
    description: 'Medical-grade topical and oral therapies for natural-looking hair restoration and growth.',
    price: 175,
    billingPeriod: '/consultation',
    duration: '15 min',
    type: 'consultation',
    includes: [
      'Scalp and hair assessment',
      'Treatment options review',
      'Customized protocol design',
      'Prescription (if medically appropriate)',
      'Progress tracking plan'
    ],
    features: [
      '15-minute video consultation',
      'Hair loss pattern assessment',
      'Medical-grade treatment options',
      'Prescription therapies (Finasteride, Minoxidil, compounds)',
      'Topical and oral protocols',
      '3-6 month progress evaluation'
    ],
    note: 'Treatments and medications billed separately',
    icon: '💆',
    color: 'accent-green',
    requiresQuestionnaire: false,
    requiresPayment: true,
    requiresAddress: true
  }
];

// For backward compatibility
export const ONE_OFF_SERVICES = MEDRX_SERVICES;

export const CONSULTATION_FEE = 175;

export const PAYMENT_NOTES = {
  consultation: '$175 consultation fee (paid at booking)',
  medications: 'Prescriptions filled at your pharmacy or through our partner pharmacy (billed separately)',
  labs: 'Lab work ordered as needed (billed separately through lab provider)'
};

// Service details for each category
export const SERVICE_DETAILS = {
  'glp-semaglutide': {
    medications: ['Semaglutide'],
    typical_medication_cost: '$200-400/month',
    lab_requirements: 'Baseline labs, periodic monitoring',
    prescription_only: true,
    subspecialties: [
      { name: 'Semaglutide', starting_dose: '0.25mg weekly', max_dose: '2.4mg weekly' }
    ]
  },
  'glp-tirzepatide': {
    medications: ['Tirzepatide'],
    typical_medication_cost: '$200-400/month',
    lab_requirements: 'Baseline labs, periodic monitoring',
    prescription_only: true,
    subspecialties: [
      { name: 'Tirzepatide', starting_dose: '2.5mg weekly', max_dose: '15mg weekly' }
    ]
  },
  'hormone-health': {
    medications: ['Bioidentical hormones', 'Testosterone', 'Thyroid medications', 'Estrogen/Progesterone'],
    typical_medication_cost: '$100-300/month',
    lab_requirements: 'Comprehensive hormone panel, follow-up labs every 3-6 months',
    prescription_only: true,
    subspecialties: [
      { name: "Women's Hormone Therapy", includes: ['Estrogen', 'Progesterone', 'Thyroid'] },
      { name: "Men's Testosterone Therapy", includes: ['Testosterone injections', 'Testosterone cream'] },
      { name: 'Thyroid Optimization', includes: ['Levothyroxine', 'Liothyronine', 'NDT'] }
    ]
  },
  'hair-loss': {
    medications: ['Finasteride', 'Minoxidil', 'Topical compounds', 'Dutasteride'],
    typical_medication_cost: '$50-200/month',
    lab_requirements: 'Baseline labs as indicated (hormones, iron studies)',
    prescription_only: true,
    subspecialties: [
      { name: 'Oral Therapy', medications: ['Finasteride 1mg daily', 'Dutasteride'] },
      { name: 'Topical Therapy', medications: ['Minoxidil 5%', 'Compound formulas'] },
      { name: 'Combination Protocol', medications: ['Oral + Topical'] }
    ]
  }
};

// Testimonials
export const TESTIMONIALS = [
  {
    id: 1,
    initials: 'S.K.',
    service: 'GLP-1 Weight Loss',
    text: "Lost 35 pounds in 4 months with Tirzepatide. The virtual visits made it so easy to stay on track, and my provider was incredibly supportive throughout the journey.",
    rating: 5,
    location: 'Guam'
  },
  {
    id: 2,
    initials: 'M.T.',
    service: 'Hormone Health',
    text: "After years of feeling exhausted and foggy, hormone optimization changed my life. My provider really listened and found the right balance for me.",
    rating: 5,
    location: 'Hawaii'
  },
  {
    id: 3,
    initials: 'J.R.',
    service: 'Hair Loss',
    text: "Six months on the hair restoration protocol and I'm seeing real results. Convenient telemedicine appointments and prescriptions delivered to my door.",
    rating: 5,
    location: 'California'
  },
  {
    id: 4,
    initials: 'L.M.',
    service: 'GLP-1 Weight Loss',
    text: "The medical screening was thorough, and I felt confident starting Semaglutide. Down 28 pounds and feeling better than I have in years!",
    rating: 5,
    location: 'Guam'
  },
  {
    id: 5,
    initials: 'D.W.',
    service: 'Hormone Health',
    text: "Testosterone therapy has been a game-changer. Energy is back, workouts are productive, and the whole process was seamless through MedRx.",
    rating: 5,
    location: 'Hawaii'
  }
];

// FAQ
export const FAQ_ITEMS = [
  {
    question: 'How much does a consultation cost?',
    answer: 'All consultations are $175. This includes your video visit with a licensed provider, medical evaluation, and prescription (if medically appropriate). Medications and lab work are billed separately.'
  },
  {
    question: 'Are medications included in the consultation fee?',
    answer: 'No, medications are billed separately. Your prescription will be sent to your preferred pharmacy or our partner pharmacy. Typical medication costs: GLP-1 $200-400/month, Hormones $100-300/month, Hair Loss $50-200/month.'
  },
  {
    question: 'Do I need lab work?',
    answer: 'Lab work requirements vary by service. Your provider will recommend appropriate labs during your consultation. Labs are billed separately through the lab provider.'
  },
  {
    question: 'What areas do you serve?',
    answer: 'We serve patients in Guam, Hawaii, and California with timezone-appropriate scheduling.'
  },
  {
    question: 'How quickly can I get an appointment?',
    answer: 'Most appointments are available within 1-3 days. After booking, you\'ll receive confirmation and a link to join your video consultation.'
  },
  {
    question: 'Will I get a prescription?',
    answer: 'If medically appropriate after your evaluation, your provider will send a prescription to your pharmacy. Not all consultations result in prescriptions - this is determined by your provider based on medical necessity.'
  }
];

// How It Works Steps
export const HOW_IT_WORKS = [
  {
    step: '01',
    icon: 'Calendar',
    title: 'Book Online',
    description: 'Choose your service and select a convenient time slot. All consultations are $175.'
  },
  {
    step: '02',
    icon: 'FileText',
    title: 'Medical Screening',
    description: 'Complete a brief health questionnaire. For GLP-1, we assess eligibility criteria.'
  },
  {
    step: '03',
    icon: 'CreditCard',
    title: 'Secure Payment',
    description: 'Pay the $175 consultation fee. Medications and labs billed separately.'
  },
  {
    step: '04',
    icon: 'Video',
    title: 'Video Consultation',
    description: 'Meet with your licensed provider via secure video. Get your prescription if appropriate.'
  },
  {
    step: '05',
    icon: 'CheckCircle',
    title: 'Prescription Delivery',
    description: 'Your prescription is sent to your pharmacy or our partner pharmacy for home delivery.'
  }
];

export default MEDRX_SERVICES;
