from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

# User Models
class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    timezone: str = 'Pacific/Honolulu'

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: str
    timezone: str
    subscriptionId: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

# Appointment Models
class PatientInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str

class AppointmentCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    serviceId: str
    serviceType: str  # 'oneoff' or 'subscription'
    date: str  # YYYY-MM-DD
    time: str  # '08:00 AM'
    timezone: str
    notes: Optional[str] = None

class Appointment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    userId: str
    serviceId: str
    serviceType: str
    serviceName: str
    appointmentDate: str
    appointmentTime: str
    timezone: str
    status: str = 'scheduled'  # 'scheduled', 'completed', 'cancelled', 'no-show'
    price: float
    patientInfo: PatientInfo
    notes: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    date: Optional[str] = None
    time: Optional[str] = None
    notes: Optional[str] = None

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