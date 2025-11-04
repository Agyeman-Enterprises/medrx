from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

# User Models with Address
class Address(BaseModel):
    street: str
    city: str
    state: str
    zip_code: str
    country: str = 'US'

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    timezone: str = 'Pacific/Honolulu'
    address: Optional[Address] = None

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    timezone: str
    address: Optional[Address] = None
    subscriptionId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Appointment Models with Address
class PatientInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: Optional[Address] = None

class AppointmentCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    serviceId: str
    serviceType: str  # 'oneoff' - all MedRx appointments are one-off consultations
    date: str  # YYYY-MM-DD
    time: str  # '08:00 AM'
    timezone: str
    address: Optional[Address] = None
    notes: Optional[str] = None  # JSON string of questionnaire answers
    paymentSessionId: Optional[str] = None  # Stripe session ID after payment

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    serviceId: str
    serviceType: str  # 'oneoff' - all MedRx appointments are one-off consultations
    serviceName: str
    appointmentDate: str
    appointmentTime: str
    timezone: str
    status: str = 'pending_payment'  # 'pending_payment', 'scheduled', 'completed', 'cancelled', 'no-show'
    price: float
    patientInfo: PatientInfo
    notes: Optional[str] = None
    paymentSessionId: Optional[str] = None
    paymentStatus: Optional[str] = 'pending'  # 'pending', 'paid', 'failed'
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    notes: Optional[str] = None
    paymentStatus: Optional[str] = None
    paymentSessionId: Optional[str] = None

class ConfirmationEmailRequest(BaseModel):
    appointmentId: str
    sessionId: str
    email: str

class CheckoutSessionCreate(BaseModel):
    serviceId: str
    originUrl: str
    email: str
    appointmentData: Optional[dict] = None

# Payment Models
class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sessionId: str
    userId: Optional[str] = None
    email: EmailStr
    serviceId: str
    serviceName: str
    amount: float
    currency: str = 'usd'
    status: str = 'initiated'  # 'initiated', 'pending', 'paid', 'failed', 'expired'
    paymentStatus: str = 'pending'  # 'unpaid', 'paid', 'failed'
    appointmentId: Optional[str] = None
    metadata: Optional[dict] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Subscription Models
class SubscriptionCreate(BaseModel):
    userId: Optional[str] = None
    email: EmailStr
    planId: str

class Subscription(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    planId: str
    planName: str
    planTier: str
    monthlyPrice: float
    status: str = 'active'  # 'active', 'cancelled', 'paused', 'expired'
    startDate: datetime = Field(default_factory=datetime.utcnow)
    nextBillingDate: datetime
    endDate: Optional[datetime] = None
    appointmentsThisMonth: int = 0
    features: List[str]
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class SubscriptionUpdate(BaseModel):
    status: Optional[str] = None
    planId: Optional[str] = None