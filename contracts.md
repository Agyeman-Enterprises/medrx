# MedRx Backend Implementation Contracts

## Overview
Implement MongoDB backend for MedRx telemedicine platform supporting:
- **Pay-per-visit bookings** ($85 Acute Care, $175 Functional Medicine)
- **Monthly subscription management** (4 tiers: Basic $35, Standard $150, Functional Medicine $400, VIP $600+)
- **Appointment scheduling** with timezone-aware time slots
- **User management** for patients

## MongoDB Collections

### 1. `users` Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  phone: String,
  timezone: String, // 'Pacific/Honolulu', 'America/Los_Angeles', 'Pacific/Guam'
  subscriptionId: ObjectId | null, // Reference to active subscription
  createdAt: Date,
  updatedAt: Date
}
```

### 2. `appointments` Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users collection
  serviceId: String, // 'oneoff-1', 'oneoff-2', or subscription tier
  serviceType: String, // 'oneoff' or 'subscription'
  serviceName: String, // 'Acute Care Visit', 'Functional Medicine Visit', etc.
  appointmentDate: Date, // YYYY-MM-DD
  appointmentTime: String, // '08:00 AM', '02:00 PM', etc.
  timezone: String,
  status: String, // 'scheduled', 'completed', 'cancelled', 'no-show'
  price: Number, // Amount paid (or 0 for subscription appointments)
  patientInfo: {
    name: String,
    email: String,
    phone: String
  },
  notes: String, // Optional appointment notes
  createdAt: Date,
  updatedAt: Date
}
```

### 3. `subscriptions` Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Reference to users collection
  planId: String, // 'sub-1', 'sub-2', 'sub-3', 'sub-4'
  planName: String, // 'Basic Access', 'Standard Care', etc.
  planTier: String, // 'basic', 'standard', 'integrative', 'vip'
  monthlyPrice: Number,
  status: String, // 'active', 'cancelled', 'paused', 'expired'
  startDate: Date,
  nextBillingDate: Date,
  endDate: Date | null, // null if active, date if cancelled
  appointmentsThisMonth: Number, // Track usage for Basic tier (1-2/month limit)
  features: [String], // Array of plan features
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Appointments

#### `POST /api/appointments`
**Purpose:** Book a new appointment (pay-per-visit or subscription)

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "(808) 555-1234",
  "serviceId": "oneoff-1",
  "serviceType": "oneoff",
  "date": "2025-10-31",
  "time": "08:00 AM",
  "timezone": "Pacific/Honolulu"
}
```

**Response:**
```json
{
  "success": true,
  "appointmentId": "507f1f77bcf86cd799439011",
  "message": "Appointment booked successfully!",
  "appointment": { /* full appointment object */ }
}
```

**Logic:**
1. Check if user exists by email, create if new
2. If subscription appointment, verify user has active subscription and check limits (Basic tier: 1-2/month)
3. Create appointment record
4. Return confirmation

#### `GET /api/appointments?email={email}`
**Purpose:** Get all appointments for a user

**Response:**
```json
{
  "success": true,
  "appointments": [/* array of appointment objects */]
}
```

#### `GET /api/appointments/{appointmentId}`
**Purpose:** Get single appointment details

#### `PATCH /api/appointments/{appointmentId}`
**Purpose:** Update appointment (reschedule, cancel, etc.)

**Request Body:**
```json
{
  "status": "cancelled",
  "date": "2025-11-01",
  "time": "10:00 AM"
}
```

### Subscriptions

#### `POST /api/subscriptions`
**Purpose:** Create new subscription

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "planId": "sub-2",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "507f1f77bcf86cd799439012",
  "message": "Subscription created successfully!",
  "subscription": { /* full subscription object */ }
}
```

#### `GET /api/subscriptions/user/{userId}`
**Purpose:** Get user's active subscription

#### `PATCH /api/subscriptions/{subscriptionId}`
**Purpose:** Update subscription (upgrade, downgrade, cancel)

**Request Body:**
```json
{
  "status": "cancelled",
  "planId": "sub-3" // for upgrades/downgrades
}
```

#### `GET /api/subscriptions/{subscriptionId}/usage`
**Purpose:** Get subscription usage stats (appointments this month)

### Users

#### `POST /api/users`
**Purpose:** Create or update user profile

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john@example.com",
  "phone": "(808) 555-1234",
  "timezone": "Pacific/Honolulu"
}
```

#### `GET /api/users/{userId}`
**Purpose:** Get user profile

#### `GET /api/users/email/{email}`
**Purpose:** Get user by email

## Frontend Integration Changes

### Remove Mock Data
**Files to update:**
- `src/mock.js`: Keep service definitions but remove mock functions
- `src/components/Booking.jsx`: Replace `mockBookAppointment` with API call

### Update Booking.jsx
```javascript
// Replace mock function
const handleSubmit = async (e) => {
  e.preventDefault();
  
  const bookingData = {
    ...formData,
    serviceId: selectedService,
    serviceType: mockServices.find(s => s.id === selectedService).type,
    date: format(selectedDate, 'yyyy-MM-dd'),
    time: selectedTime,
    timezone: selectedTimezone
  };

  try {
    const response = await axios.post(`${API}/appointments`, bookingData);
    if (response.data.success) {
      toast.success('Appointment booked successfully!');
      // Reset form
    }
  } catch (error) {
    toast.error('Booking failed. Please try again.');
  }
};
```

## Business Logic Rules

### Appointment Booking Validation
1. **Timezone-aware scheduling:** Time slots must respect both Guam operating hours (8am-9pm ChST) AND local time limits (8am-10pm)
2. **Prevent double-booking:** Check if date/time slot is already taken
3. **Subscription limits:** Basic tier limited to 1-2 appointments/month
4. **Future dates only:** Cannot book appointments in the past

### Subscription Management
1. **Auto-renewal:** Track nextBillingDate
2. **Usage tracking:** Count appointments per billing cycle
3. **Upgrade/downgrade:** Prorate if mid-cycle change
4. **Cancellation:** Set endDate but keep active until current period ends

## Implementation Priority

1. **Phase 1 - Core Booking (MVP)**
   - User creation/lookup
   - One-off appointment booking
   - GET appointments by email

2. **Phase 2 - Subscriptions**
   - Subscription creation
   - Subscription-based appointment booking with limits
   - Usage tracking

3. **Phase 3 - Management**
   - Appointment rescheduling/cancellation
   - Subscription upgrades/downgrades
   - Admin dashboard (future)

## Error Handling

- Duplicate appointment times
- Invalid service IDs
- Subscription limit exceeded
- Invalid timezone
- Past date bookings
- Missing required fields

## Testing Checklist

- [ ] Book one-off Acute Care appointment
- [ ] Book one-off Functional Medicine appointment
- [ ] Create Basic subscription
- [ ] Book 2 appointments on Basic subscription (test limit)
- [ ] Attempt 3rd appointment on Basic subscription (should fail)
- [ ] Create Standard subscription (unlimited)
- [ ] Book multiple appointments on Standard subscription
- [ ] Retrieve appointments by email
- [ ] Cancel appointment
- [ ] Update subscription status
