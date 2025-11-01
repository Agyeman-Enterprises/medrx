from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# ==================== DEMOGRAPHICS ====================
class Demographics(BaseModel):
    name: str
    dob: str  # Format: YYYY-MM-DD
    sex: str  # Male, Female, Other
    gender_identity: Optional[str] = None
    preferred_pronouns: Optional[str] = None
    address: str
    city: str
    state: str
    zip: str
    phone: str
    email: str
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None

# ==================== MEDICAL HISTORY ====================
class MedicalCondition(BaseModel):
    condition: str
    diagnosed_date: Optional[str] = None
    current_status: Optional[str] = None  # active, resolved, managed

class Surgery(BaseModel):
    procedure: str
    date: str
    complications: Optional[str] = None

class Medication(BaseModel):
    name: str
    dosage: str
    frequency: str
    prescriber: Optional[str] = None
    indication: Optional[str] = None
    photo_url: Optional[str] = None  # S3 or storage URL for medication photo

class Allergy(BaseModel):
    allergen: str
    reaction: str
    severity: str  # mild, moderate, severe

class FamilyHistory(BaseModel):
    condition: str
    relation: str  # mother, father, sibling, etc.
    age_at_diagnosis: Optional[int] = None

class SocialHistory(BaseModel):
    smoking: str  # never, former, current
    alcohol: str  # none, occasional, moderate, heavy
    recreational_drugs: Optional[str] = None
    occupation: Optional[str] = None
    exercise: Optional[str] = None

# ==================== REVIEW OF SYSTEMS ====================
class ReviewOfSystems(BaseModel):
    constitutional: Optional[str] = None  # fever, fatigue, weight changes
    cardiovascular: Optional[str] = None  # chest pain, palpitations
    respiratory: Optional[str] = None  # shortness of breath, cough
    gastrointestinal: Optional[str] = None  # nausea, diarrhea, constipation
    genitourinary: Optional[str] = None  # urinary symptoms
    musculoskeletal: Optional[str] = None  # joint pain, muscle aches
    neurological: Optional[str] = None  # headaches, dizziness
    psychiatric: Optional[str] = None  # mood, anxiety, sleep
    endocrine: Optional[str] = None  # thyroid symptoms
    skin: Optional[str] = None  # rashes, lesions

# ==================== SERVICE-SPECIFIC SCREENING ====================
class GLP1Screening(BaseModel):
    current_weight: float  # lbs
    current_height: float  # inches
    bmi: float
    weight_loss_goal: float  # lbs
    previous_weight_loss_attempts: Optional[List[str]] = []
    thyroid_cancer_personal: bool = False
    thyroid_cancer_family: bool = False
    men2_syndrome: bool = False
    pancreatitis_history: bool = False
    pregnancy_status: bool = False
    breastfeeding: bool = False
    kidney_disease: bool = False
    type1_diabetes: bool = False

class HormoneScreening(BaseModel):
    symptoms: List[str]
    symptom_duration: Optional[str] = None
    previous_hormone_therapy: bool = False
    menstrual_history: Optional[str] = None  # For women
    hot_flashes: Optional[bool] = None
    mood_changes: Optional[bool] = None
    libido_changes: Optional[bool] = None
    energy_level: Optional[str] = None

class MensHealthScreening(BaseModel):
    primary_concern: str  # vitality, ED, hair loss, metabolic
    symptom_duration: Optional[str] = None
    previous_treatments: Optional[List[str]] = []
    cardiovascular_history: bool = False
    prostate_issues: bool = False

# ==================== GOALS & EXPECTATIONS ====================
class PatientGoals(BaseModel):
    primary_concern: str
    treatment_goals: List[str]
    timeline_expectations: Optional[str] = None
    success_metrics: Optional[List[str]] = []

# ==================== CONSENTS ====================
class Consent(BaseModel):
    consent_type: str  # HIPAA, TELEHEALTH, FINANCIAL, GLP1_RISKS, etc.
    version: str
    agreed: bool
    agreed_at: datetime
    ip_address: Optional[str] = None
    signature: Optional[str] = None  # Electronic signature

# ==================== COMPREHENSIVE INTAKE MODEL ====================
class ComprehensiveIntake(BaseModel):
    patient_id: Optional[str] = None
    appointment_id: Optional[str] = None
    service_line: str  # weight-loss, hormone-health, mens-health, hair-loss
    service_type: str  # specific service within line
    
    # Core intake sections
    demographics: Demographics
    pmh: List[MedicalCondition] = []
    psh: List[Surgery] = []
    medications: List[Medication] = []
    allergies: List[Allergy] = []
    family_history: List[FamilyHistory] = []
    social_history: Optional[SocialHistory] = None
    ros: Optional[ReviewOfSystems] = None
    goals: PatientGoals
    
    # Service-specific screening
    glp1_screening: Optional[GLP1Screening] = None
    hormone_screening: Optional[HormoneScreening] = None
    mens_health_screening: Optional[MensHealthScreening] = None
    
    # Voice transcription
    voice_transcript: Optional[str] = None
    voice_transcript_structured: Optional[Dict[str, Any]] = None
    
    # Consents
    consents: List[Consent] = []
    
    # Contraindications identified
    contraindications: List[str] = []
    safety_flags: List[str] = []
    
    # Metadata
    completed_at: Optional[datetime] = None
    reviewed_by_provider: bool = False
    provider_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# ==================== REQUEST MODELS ====================
class IntakeCreateRequest(BaseModel):
    service_line: str
    service_type: str
    demographics: Demographics
    goals: PatientGoals

class IntakeUpdateRequest(BaseModel):
    pmh: Optional[List[MedicalCondition]] = None
    medications: Optional[List[Medication]] = None
    allergies: Optional[List[Allergy]] = None
    social_history: Optional[SocialHistory] = None
    glp1_screening: Optional[GLP1Screening] = None
    hormone_screening: Optional[HormoneScreening] = None
    voice_transcript: Optional[str] = None
    consents: Optional[List[Consent]] = None

class MedicationPhotoUploadRequest(BaseModel):
    intake_id: str
    medication_name: str
    photo_base64: str  # Base64 encoded image

# ==================== RESPONSE MODELS ====================
class ContraindicationCheck(BaseModel):
    is_eligible: bool
    contraindications: List[str]
    safety_flags: List[str]
    recommended_action: str  # proceed, specialist_referral, alternative_service
