# 🔐 API Keys Configuration Guide

## How to Update Your API Keys Securely

### Method 1: Direct File Edit (Easiest)
1. In Emergent workspace, click on **Files** tab
2. Navigate to `/app/backend/.env`
3. Click **Edit**
4. Replace placeholder values with your real API keys
5. Click **Save**
6. Restart backend: Run command `sudo supervisorctl restart backend`

---

## 📋 Required API Keys Checklist

### ✅ Already Configured (Working)
- `EMERGENT_LLM_KEY` - For AI medical data extraction
- `STRIPE_API_KEY` - For payment processing
- `MONGO_URL` - Database connection
- `SMS_ALERT_NUMBER` - Your SMS alert number

### ⚠️ Need Your Real Values

#### **1. Deepgram (Voice Transcription)**
```
DEEPGRAM_API_KEY=your_deepgram_api_key_here
```
**Where to get it:** https://console.deepgram.com/signup
- Sign up/login
- Go to API Keys section
- Create new key
- Copy and paste above

#### **2. Twilio (SMS + Video)**
```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```
**Where to get it:** https://console.twilio.com
- Your Account SID and Auth Token are on the dashboard
- Phone Number: Get from Phone Numbers → Manage → Active numbers

#### **3. Twilio Video API Keys**
```
TWILIO_API_KEY_SID=your_api_key_sid_here
TWILIO_API_KEY_SECRET=your_api_key_secret_here
```
**Where to get it:** https://console.twilio.com/project/api-keys
- Click "Create API Key"
- Name it "MedRx Video"
- Copy both SID and Secret

---

## 🧪 How to Test After Configuration

### Test 1: Voice Intake Service
```bash
curl http://localhost:8001/api/voice-intake/health
```
**Expected:** `"deepgram_configured": true, "llm_configured": true`

### Test 2: SMS Service (after Twilio configured)
```bash
# Will happen automatically on appointment booking
# Check logs: tail -f /var/log/supervisor/backend.out.log
```

### Test 3: Video Room Creation
```bash
curl -X POST http://localhost:8001/api/video/create-room \
  -H "Content-Type: application/json" \
  -d '{"appointment_id": "test123"}'
```

---

## 📝 Backend .env File Structure

Your `/app/backend/.env` should look like this:

```bash
# Database
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"

# API Configuration
CORS_ORIGINS="*"

# Payment
STRIPE_API_KEY=sk_test_XXXXX  # Your Stripe test key

# AI Services
EMERGENT_LLM_KEY=sk-emergent-8Ab6aD311E8DdA7B88  # Already configured ✅

# Voice Transcription
DEEPGRAM_API_KEY=xxxxxxxxxxxxx  # ⚠️ UPDATE THIS

# SMS & Video
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx  # ⚠️ UPDATE THIS
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx  # ⚠️ UPDATE THIS
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx  # ⚠️ UPDATE THIS
TWILIO_API_KEY_SID=SKxxxxxxxxxx  # ⚠️ UPDATE THIS
TWILIO_API_KEY_SECRET=xxxxxxxxxx  # ⚠️ UPDATE THIS
TWILIO_STATUS_CALLBACK_URL=https://medrx-ai.preview.emergentagent.com/api/video/callback
SMS_ALERT_NUMBER=+16716892993

# Calendar
DRCHRONO_CALENDAR_LINK=https://calendar.drchrono.com/your-link
```

---

## 🔄 After Updating Keys

Run these commands to apply changes:

```bash
# Restart backend to load new environment variables
sudo supervisorctl restart backend

# Check backend is running
curl http://localhost:8001/api/health

# Check service configurations
curl http://localhost:8001/api/voice-intake/health
```

---

## ⚡ Quick Update Script

If you want to update keys via command line without showing values in chat, use this pattern:

```bash
# Navigate to backend directory
cd /app/backend

# Update a key (example)
# Replace YOUR_ACTUAL_KEY with your real key
sed -i 's/DEEPGRAM_API_KEY=placeholder_deepgram_key/DEEPGRAM_API_KEY=YOUR_ACTUAL_KEY/' .env

# Restart backend
sudo supervisorctl restart backend
```

---

## 🆘 Troubleshooting

### Backend won't start after updating keys
```bash
# Check error logs
tail -n 50 /var/log/supervisor/backend.err.log

# Common issues:
# - Extra spaces around = sign (should be KEY=value, not KEY = value)
# - Missing quotes for values with special characters
# - Typo in key names
```

### Keys not being read
```bash
# Test if environment variable is loaded
cd /app/backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('DEEPGRAM_API_KEY'))"

# Should print your key (not 'placeholder_deepgram_key')
```

---

## 🎯 Priority Order

If you want to test features incrementally:

1. **First:** Update Deepgram key → Test voice transcription
2. **Second:** Update Twilio SMS → Test booking alerts
3. **Third:** Update Twilio Video → Test video room creation
4. **Last:** Fine-tune other settings

---

**Need Help?** Just let me know which service you want to test first, and I'll guide you through it!
