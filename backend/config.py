# MedRx Platform Configuration

# Supported Regions & Timezones
SUPPORTED_REGIONS = {
    "GU": {
        "name": "Guam",
        "timezone": "Pacific/Guam",
        "abbr": "ChST",
        "offset": 10
    },
    "HI": {
        "name": "Hawaii", 
        "timezone": "Pacific/Honolulu",
        "abbr": "HST",
        "offset": -10
    },
    "CA": {
        "name": "California",
        "timezone": "America/Los_Angeles",
        "abbr": "PST/PDT",
        "offset": -8
    }
}

# Service Lines (MedRx Focus: Weight Loss & Hormones)
SERVICE_LINES = {
    "weight-loss": {
        "name": "Weight Loss & GLP-1 Therapy",
        "description": "Semaglutide and Tirzepatide programs with smart monitoring, personalized dosing, and results-driven follow-up.",
        "duration_minutes": 30,
        "color": "accent-purple",
        "icon": "scale",
        "services": ["glp1-sema", "glp1-tirz"]
    },
    "hormone-health": {
        "name": "Hormone Health",
        "description": "Women's health, men's testosterone, thyroid optimization — root-cause, not just symptom suppression.",
        "duration_minutes": 30,
        "color": "accent-pink",
        "icon": "heart-pulse",
        "services": ["womens-hormone", "mens-testosterone", "thyroid"]
    }
}

# External Service Redirects (handled by bookadoc2u.com)
EXTERNAL_SERVICES = {
    "acute-care": os.getenv("EXTERNAL_SERVICE_URL_ACUTE_CARE", "https://bookadoc2u.com/acute-care"),
    "functional-medicine": os.getenv("EXTERNAL_SERVICE_URL_FUNCTIONAL", "https://bookadoc2u.com/functional-medicine"),
    "basic-access": os.getenv("EXTERNAL_SERVICE_URL_BASIC", "https://bookadoc2u.com/subscriptions/basic"),
    "standard-care": os.getenv("EXTERNAL_SERVICE_URL_STANDARD", "https://bookadoc2u.com/subscriptions/standard"),
    "mens-health": os.getenv("EXTERNAL_SERVICE_URL_MENS", "https://bookadoc2u.com/mens-health"),
    "hair-loss": os.getenv("EXTERNAL_SERVICE_URL_HAIR", "https://bookadoc2u.com/hair-loss")
}

# GLP-1 Medications
GLP1_SERVICES = ["Semaglutide", "Tirzepatide"]

# Guam Service Hours (ChST)
GUAM_SERVICE_HOURS_CHST = {
    "start": 8,  # 8:00 AM
    "end": 22,   # 10:00 PM
    "timezone": "Pacific/Guam"
}

# Visit Durations (minutes)
VISIT_DURATIONS = {
    "Weight Loss": 30,
    "Hormone Health": 30,
    "Men's Health": 30,
    "Hair Loss": 30,
    "Acute Care": 15,
    "Functional Medicine": 45
}

# Intake Schema Structure
INTAKE_SCHEMA = {
    "demographics": {
        "fields": ["name", "dob", "sex", "gender_identity", "preferred_pronouns", 
                   "address", "city", "state", "zip", "phone", "email", "emergency_contact"]
    },
    "pmh": {
        "label": "Past Medical History",
        "fields": ["chronic_conditions", "surgeries", "hospitalizations", "mental_health"]
    },
    "psh": {
        "label": "Past Surgical History", 
        "fields": ["procedures", "dates", "complications"]
    },
    "medications": {
        "fields": ["name", "dosage", "frequency", "prescriber", "indication"],
        "supports_photo": True,
        "photo_types": ["medication_bottle", "medication_label"]
    },
    "insurance": {
        "fields": ["carrier", "policy_number", "group_number", "subscriber_name", "subscriber_dob"],
        "supports_photo": True,
        "photo_types": ["insurance_front", "insurance_back"],
        "required": True
    },
    "identification": {
        "fields": ["id_type", "id_number", "id_state", "id_expiration"],
        "supports_photo": True,
        "photo_types": ["id_front", "id_back"],
        "required": True
    },
    "allergies": {
        "fields": ["allergen", "reaction", "severity"]
    },
    "fhx": {
        "label": "Family History",
        "fields": ["condition", "relation", "age_at_diagnosis"]
    },
    "shx": {
        "label": "Social History",
        "fields": ["smoking", "alcohol", "recreational_drugs", "occupation", "exercise"]
    },
    "ros": {
        "label": "Review of Systems",
        "systems": ["constitutional", "cardiovascular", "respiratory", "gi", "gu", 
                   "musculoskeletal", "neurological", "psychiatric", "endocrine", "skin"]
    },
    "goals": {
        "fields": ["primary_concern", "treatment_goals", "timeline_expectations"]
    },
    "glp1_screening": {
        "required_for": GLP1_SERVICES,
        "fields": ["bmi", "weight_loss_history", "thyroid_cancer_history", 
                   "pancreatitis_history", "pregnancy_status", "kidney_disease"]
    },
    "contraindications": {
        "glp1": ["personal_mtc", "family_mtc", "men2_syndrome", "pregnant", 
                 "breastfeeding", "type1_diabetes", "severe_gi_disease"],
        "testosterone": ["prostate_cancer", "breast_cancer", "high_hematocrit"],
        "estrogen": ["breast_cancer", "blood_clots", "liver_disease"]
    },
    "consent_flags": {
        "required": ["hipaa_privacy", "telehealth_consent", "financial_responsibility"],
        "service_specific": {
            "glp1": ["glp1_risks", "medication_side_effects"],
            "testosterone": ["testosterone_risks", "fertility_effects"],
            "estrogen": ["hormone_risks", "cancer_screening"]
        }
    }
}

# User Roles
ROLES = {
    "PATIENT": {
        "permissions": ["view_own_appointments", "book_appointments", "upload_documents", 
                       "message_provider", "view_own_records"]
    },
    "PROVIDER": {
        "permissions": ["view_all_appointments", "access_patient_records", "prescribe", 
                       "document_visits", "order_labs", "message_patients"]
    },
    "ADMIN": {
        "permissions": ["manage_users", "view_analytics", "system_configuration", 
                       "billing_management", "provider_scheduling"]
    }
}

# Consent Types
CONSENT_TYPES = {
    "HIPAA": {
        "title": "HIPAA Privacy Notice & Consent",
        "required": True,
        "version": "2025-01",
        "summary": "Authorization to use and disclose protected health information"
    },
    "TELEHEALTH": {
        "title": "Telehealth Consent",
        "required": True,
        "version": "2025-01",
        "summary": "Consent for virtual healthcare services via telemedicine"
    },
    "FINANCIAL": {
        "title": "Financial Responsibility Agreement",
        "required": True,
        "version": "2025-01",
        "summary": "Agreement to pay for services and understanding of billing"
    },
    "GLP1_RISKS": {
        "title": "GLP-1 Medication Informed Consent",
        "required_for": GLP1_SERVICES,
        "version": "2025-01",
        "summary": "Understanding of GLP-1 risks, benefits, and alternatives"
    }
}

# Twilio Video Configuration
TWILIO_VIDEO_CONFIG = {
    "room_type": "go",  # Small group rooms (up to 4 participants)
    "max_participants": 4,
    "enable_recording": False,  # HIPAA: requires BAA and patient consent
    "video_codecs": ["VP8", "H264"],
    "max_duration_minutes": 60,
    "room_name_prefix": "medrx"
}

# Follow-up Schedules by Service
FOLLOWUP_SCHEDULES = {
    "weight-loss": {
        "initial_checkin": "1 week",
        "ongoing_checkins": ["2 weeks", "1 month", "3 months"],
        "pro_collection": ["weight", "blood_pressure", "side_effects", "adherence"],
        "auto_refill_trigger": "21 days before end"
    },
    "hormone-health": {
        "initial_checkin": "2 weeks",
        "ongoing_checkins": ["1 month", "3 months", "6 months"],
        "pro_collection": ["symptoms", "mood", "energy", "side_effects"],
        "lab_orders": ["baseline", "3 months", "6 months"]
    },
    "mens-health": {
        "initial_checkin": "2 weeks",
        "ongoing_checkins": ["1 month", "3 months"],
        "pro_collection": ["symptoms", "energy", "performance", "side_effects"]
    },
    "hair-loss": {
        "initial_checkin": "1 month",
        "ongoing_checkins": ["3 months", "6 months", "12 months"],
        "pro_collection": ["hair_growth", "density", "satisfaction", "photos"]
    }
}

# SMS Alert Number
SMS_ALERT_NUMBER = "+16716892993"

# DrChrono Calendar Link
DRCHRONO_CALENDAR_LINK = "https://calendar.drchrono.com/medrx"
