# MedRx GLP-1 Platform - Deployment Guide

## Pre-Deployment Checklist ✅

### Application Status
- ✅ Backend API: Healthy and tested (15/15 tests passed)
- ✅ Frontend: Working correctly (12/12 tests passed)
- ✅ MongoDB: Connected and operational
- ✅ Stripe Integration: Configured with emergentintegrations
- ✅ Payment Flow: End-to-end tested
- ✅ Medical Questionnaire: GLP-1 screening working
- ✅ No hardcoded URLs or secrets

## Deployment Steps (Emergent Platform)

### Step 1: Save to GitHub
1. Click the **"Save to GitHub"** button in the Emergent chat interface
2. Choose your repository or create a new one
3. Select branch (main/master) or create new branch
4. Click **"PUSH TO GITHUB"** to save all code

### Step 2: Preview (Optional but Recommended)
1. Click the **"Preview"** button to test your deployment
2. Verify all functionality works in preview environment
3. Test GLP-1 booking flow
4. Test payment integration

### Step 3: Deploy to Production
1. Click the **"Deploy"** button in Emergent UI
2. Click **"Deploy Now"** to start deployment
3. Wait approximately 10 minutes for deployment to complete
4. You'll receive a live production URL

### Step 4: Configure Environment Variables
After deployment, set these in Emergent's deployment settings:

**Required Environment Variables:**
```
MONGO_URL=<your-mongodb-connection-string>
STRIPE_API_KEY=<your-stripe-secret-key>
DB_NAME=medrx_production
CORS_ORIGINS=https://your-domain.com
```

**How to Get These Values:**

1. **MONGO_URL**: 
   - Use Emergent's managed MongoDB (recommended)
   - Or use MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/
   
2. **STRIPE_API_KEY**:
   - Get from Stripe Dashboard: https://dashboard.stripe.com/apikeys
   - Use your Secret Key (starts with sk_live_ for production or sk_test_ for testing)
   
3. **DB_NAME**: 
   - Use "medrx_production" or your preferred database name

### Step 5: Configure Custom Domain (Optional)
1. Go to **Deployments → Custom Domain** in Emergent
2. Enter your domain (e.g., medrx.com)
3. Configure DNS A record as instructed
4. Wait 5-15 minutes for verification

## Post-Deployment Verification

Test these critical flows after deployment:

1. **Homepage Load**: Verify hero section displays "GLP-1 Weight Loss Program"
2. **Service Order**: Confirm Semaglutide ($150) and Tirzepatide ($279) at top
3. **Booking Flow**: Test complete GLP-1 booking with questionnaire
4. **Payment**: Verify Stripe checkout redirects correctly
5. **Address Collection**: Ensure address fields appear for GLP-1 services
6. **MongoDB**: Check appointments are saving to database

## Environment-Specific URLs

**Development (Current):**
- Frontend: http://localhost:3000
- Backend: http://localhost:8001

**Production (After Deployment):**
- Frontend: https://your-app-name.emergent.app
- Backend: https://your-app-name.emergent.app/api

## Troubleshooting

### If deployment fails:
1. Check environment variables are set correctly
2. Verify MONGO_URL connection string is valid
3. Ensure STRIPE_API_KEY has proper permissions
4. Check deployment logs in Emergent UI

### If payment fails:
1. Verify STRIPE_API_KEY is production key (sk_live_) not test key
2. Check Stripe webhook is configured: https://your-app-name.emergent.app/api/webhook/stripe
3. Verify Stripe account is activated

## Cost Information
- Emergent Deployment: 50 credits/month per app
- Includes: 24/7 uptime, managed infrastructure, automatic scaling
- MongoDB: Included with Emergent or use external MongoDB Atlas

## Support
- Emergent Support: support@emergent.sh
- Documentation: https://emergent.sh/docs

---

## Technical Details

### Architecture
- Frontend: React 19 (port 3000)
- Backend: FastAPI (Python 3.11, port 8001)
- Database: MongoDB (AsyncIOMotorClient)
- Payments: Stripe (emergentintegrations)

### API Endpoints
- Health Check: GET /api/health
- Appointments: POST /api/appointments/, GET /api/appointments?email={email}
- Payments: POST /api/payments/checkout/session, GET /api/payments/checkout/status/{session_id}
- Subscriptions: POST /api/subscriptions/, GET /api/subscriptions/email/{email}

### Services & Pricing
- GLP-1 Semaglutide Initial: $150
- GLP-1 Tirzepatide Initial: $279
- Hormone Health: $150
- Acute Care: $85
- Functional Medicine: $175
- Monthly Subscriptions: $35-$329/month

---
**Deployment Date:** $(date)
**Version:** 1.0.0
**Status:** Production Ready ✅
