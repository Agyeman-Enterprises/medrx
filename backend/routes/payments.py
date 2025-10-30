from fastapi import APIRouter, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import Optional
import os
import json

from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from models import PaymentTransaction
from services_data import ONE_OFF_SERVICES, SUBSCRIPTION_PLANS

router = APIRouter(prefix="/api/payments", tags=["payments"])

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe API key
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Fixed service packages - NEVER accept amounts from frontend
SERVICE_PACKAGES = {
    # GLP-1 Initial Evaluations
    'glp1-sema-initial': 150.00,
    'glp1-tirz-initial': 279.00,
    # Other Services
    'hormone-health': 150.00,
    'acute-care': 85.00,
    'functional-medicine': 175.00,
    # Monthly Subscriptions
    'glp1-sema-monthly': 249.00,
    'glp1-tirz-monthly': 329.00,
    'metabolic-coaching': 99.00,
    'sub-basic': 35.00,
    'sub-standard': 150.00
}

@router.post("/checkout/session")
async def create_checkout_session(request: Request):
    \"\"\"Create Stripe checkout session for appointment payment\"\"\"
    
    try:
        body = await request.json()
        service_id = body.get('serviceId')
        origin_url = body.get('originUrl')
        email = body.get('email')
        appointment_data = body.get('appointmentData', {})
        
        if not service_id or not origin_url or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=\"Missing required fields: serviceId, originUrl, email\"
            )
        
        # Get amount from server-side definition (NEVER from frontend)
        amount = SERVICE_PACKAGES.get(service_id)
        if amount is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f\"Invalid service ID: {service_id}\"
            )
        
        # Get service info
        service = ONE_OFF_SERVICES.get(service_id) or SUBSCRIPTION_PLANS.get(service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=\"Service not found\"
            )
        
        # Build success and cancel URLs using frontend origin
        success_url = f\"{origin_url}/booking-success?session_id={{CHECKOUT_SESSION_ID}}\"
        cancel_url = f\"{origin_url}/#booking\"
        
        # Initialize Stripe checkout
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f\"{host_url}/api/webhook/stripe\"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Create checkout session
        metadata = {
            'service_id': service_id,
            'service_name': service['title'],
            'email': email,
            'appointment_data': json.dumps(appointment_data)
        }
        
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency='usd',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Create payment transaction record in database (BEFORE redirect)
        payment_transaction = {
            'sessionId': session.session_id,
            'email': email,
            'serviceId': service_id,
            'serviceName': service['title'],
            'amount': amount,
            'currency': 'usd',
            'status': 'initiated',
            'paymentStatus': 'unpaid',
            'appointmentId': None,
            'metadata': metadata,
            'createdAt': datetime.utcnow(),
            'updatedAt': datetime.utcnow()
        }
        
        await db.payment_transactions.insert_one(payment_transaction)
        
        return {
            'success': True,
            'url': session.url,
            'sessionId': session.session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f\"Failed to create checkout session: {str(e)}\"
        )

@router.get(\"/checkout/status/{session_id}\")
async def get_checkout_status(session_id: str, request: Request):
    \"\"\"Get payment status and update database (called by frontend polling)\"\"\"
    
    try:
        # Initialize Stripe checkout
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f\"{host_url}/api/webhook/stripe\"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Get status from Stripe
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Find payment transaction in database
        payment = await db.payment_transactions.find_one({'sessionId': session_id})
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=\"Payment transaction not found\"
            )
        
        # Only update if status changed (prevent duplicate processing)
        if payment['paymentStatus'] != checkout_status.payment_status:
            update_data = {
                'status': checkout_status.status,
                'paymentStatus': checkout_status.payment_status,
                'updatedAt': datetime.utcnow()
            }
            
            await db.payment_transactions.update_one(
                {'sessionId': session_id},
                {'$set': update_data}
            )
            
            # If payment successful, update associated appointment
            if checkout_status.payment_status == 'paid' and payment.get('appointmentId'):
                await db.appointments.update_one(
                    {'_id': payment['appointmentId']},
                    {'$set': {
                        'paymentStatus': 'paid',
                        'status': 'scheduled',
                        'updatedAt': datetime.utcnow()
                    }}
                )
        
        return {
            'success': True,
            'status': checkout_status.status,
            'paymentStatus': checkout_status.payment_status,
            'amount': checkout_status.amount_total / 100,  # Convert from cents
            'currency': checkout_status.currency,
            'metadata': checkout_status.metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f\"Failed to get checkout status: {str(e)}\"
        )

@router.post(\"/webhook/stripe\")
async def stripe_webhook(request: Request):
    \"\"\"Handle Stripe webhook events\"\"\"
    
    try:
        # Get raw body and signature
        body = await request.body()
        signature = request.headers.get(\"Stripe-Signature\")
        
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=\"Missing Stripe signature\"
            )
        
        # Initialize Stripe checkout
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f\"{host_url}/api/webhook/stripe\"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update payment transaction based on webhook event
        if webhook_response.session_id:
            update_data = {
                'status': webhook_response.event_type,
                'paymentStatus': webhook_response.payment_status,
                'updatedAt': datetime.utcnow()
            }
            
            await db.payment_transactions.update_one(
                {'sessionId': webhook_response.session_id},
                {'$set': update_data}
            )
        
        return {'success': True, 'received': True}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f\"Webhook error: {str(e)}\"
        )
