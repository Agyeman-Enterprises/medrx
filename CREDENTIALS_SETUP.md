# MedRx Credentials Setup Guide

## IMPORTANT: Never Share Credentials in Chat!

This guide shows you where to add your API credentials **securely** after the code is deployed.

## Where to Add Credentials

### Option 1: Emergent Deployment (Recommended)
After deploying to Emergent:
1. Go to **Deployments → Your App → Environment Variables**
2. Add each variable listed below
3. Click **Save** and **Redeploy**

### Option 2: Local Development
1. Copy `.env.example` to `.env` in both `/app/backend` and `/app/frontend`
2. Replace placeholder values with your real credentials
3. **NEVER commit .env files to git**

---

## Required Credentials

### 1. Deepgram (Voice Transcription)
**Where to get it:**
- Sign up at https://deepgram.com
- Go to Console → API Keys
- Create a new API key

**Add to backend `.env`:**
```
DEEPGRAM_API_KEY=your_actual_key_here
```

### 2. Emergent LLM Key (Medical Data Extraction)
**Where to get it:**
- Use the `emergent_integrations_manager` tool (I'll call it for you)
- Or use your Anthropic Claude API key

**Add to backend `.env`:**
```
EMERGENT_LLM_KEY=your_key_here
```

### 3. Twilio (Video Conferencing)
**Where to get it:**
- Sign up at https://www.twilio.com/console
- Go to Account → API Keys & Credentials
- Copy Account SID, Auth Token, and API Key

**Add to backend `.env`:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY_SID=SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=your_api_secret_here
```

### 4. DrChrono Calendar Link
**Where to get it:**
- Log into DrChrono
- Go to Settings → Online Scheduling
- Copy your public scheduling link

**Add to both backend AND frontend `.env`:**
```
DRCHRONO_CALENDAR_LINK=https://drchrono.com/scheduling/your_actual_link
REACT_APP_DRCHRONO_CALENDAR_LINK=https://drchrono.com/scheduling/your_actual_link
```

### 5. Stripe (Payments)
**Already configured, but if you need to update:**
- Go to https://dashboard.stripe.com/apikeys
- Copy your Secret Key (sk_live_xxx for production)

**Add to backend `.env`:**
```
STRIPE_API_KEY=sk_live_your_production_key
```

### 6. MongoDB
**For production deployment:**
- Use Emergent's managed MongoDB (recommended)
- Or MongoDB Atlas: https://cloud.mongodb.com

**Add to backend `.env`:**
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/
DB_NAME=medrx_production
```

---

## After Adding Credentials

### For Local Development:
```bash
# Restart services
sudo supervisorctl restart backend
sudo supervisorctl restart frontend
```

### For Emergent Deployment:
1. Click **Redeploy** after adding environment variables
2. Wait ~10 minutes for deployment
3. Test all integrations

---

## Security Checklist

✅ All credentials stored in `.env` files (not in code)
✅ `.env` files added to `.gitignore` 
✅ Never shared credentials in chat or public forums
✅ Used production keys for production deployment
✅ Used test keys for development
✅ Enabled 2FA on all accounts (Stripe, Twilio, Deepgram)

---

## Testing Credentials

After adding credentials, test each integration:

```bash
# Test Deepgram
curl -X POST http://localhost:8001/api/voice/test-deepgram

# Test Twilio
curl -X POST http://localhost:8001/api/video/test-twilio

# Test Stripe
curl -X POST http://localhost:8001/api/payments/checkout/session \
  -H "Content-Type: application/json" \
  -d '{"serviceId":"glp1-sema-direct","originUrl":"http://localhost:3000","email":"test@test.com","appointmentData":{}}'
```

---

## Need Help?

If any integration fails:
1. Check credentials are correct
2. Verify environment variables are loaded (restart services)
3. Check API key permissions in respective dashboards
4. Review error logs: `tail -f /var/log/supervisor/backend.err.log`