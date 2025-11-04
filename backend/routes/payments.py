from fastapi import APIRouter, HTTPException, status, Request
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from typing import Optional
import os
import json

from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from models import PaymentTransaction
from services_data import ONE_OFF_SERVICES
from services.sms_service import SMSService

router = APIRouter(prefix="/api/payments", tags=["payments"])

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')
sms_service = SMSService()

# Service pricing - Updated for current services
SERVICE_PACKAGES = {
    'glp-semaglutide': 175.00,
    'glp-tirzepatide': 249.00,
    'hormone-health': 175.00,
    'hair-loss': 175.00
}

@router.post("/checkout/session")
async def create_checkout_session(request: Request):
    try:
        body = await request.json()
        service_id = body.get('serviceId')
        origin_url = body.get('originUrl')
        email = body.get('email')
        appointment_data = body.get('appointmentData', {})
        
        if not service_id or not origin_url or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required fields"
            )
        
        amount = SERVICE_PACKAGES.get(service_id)
        if amount is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid service ID"
            )
        
        service = ONE_OFF_SERVICES.get(service_id)
        if not service:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Service not found"
            )
        
        success_url = f"{origin_url}/booking-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}/#booking"
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        metadata = {
            'service_id': service_id,
            'service_name': service['title'],
            'email': email
            # Questionnaire data removed from metadata - too large for Stripe 500 char limit
            # Will be stored in appointment notes field instead
        }
        
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency='usd',
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
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
            detail=f"Checkout error: {str(e)}"
        )

@router.get("/checkout/status/{session_id}")
@router.options("/checkout/status/{session_id}")  # Handle CORS preflight
async def get_checkout_status(session_id: str, request: Request):
    try:
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        payment = await db.payment_transactions.find_one({'sessionId': session_id})
        
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment not found"
            )
        
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
            
            if checkout_status.payment_status == 'paid' and payment.get('appointmentId'):
                # Update appointment status
                await db.appointments.update_one(
                    {'_id': payment['appointmentId']},
                    {'$set': {
                        'paymentStatus': 'paid',
                        'status': 'scheduled',
                        'updatedAt': datetime.utcnow()
                    }}
                )
                
                # Send SMS notification
                appointment = await db.appointments.find_one({'_id': payment['appointmentId']})
                if appointment:
                    try:
                        await sms_service.send_booking_alert({
                            'patientInfo': appointment.get('patientInfo', {}),
                            'serviceName': appointment.get('serviceName', 'Unknown Service'),
                            'date': appointment.get('appointmentDate', 'N/A'),
                            'time': appointment.get('appointmentTime', 'N/A'),
                            'timezone': appointment.get('timezone', 'N/A')
                        })
                    except Exception as sms_error:
                        # Log but don't fail the payment
                        print(f"SMS notification failed: {sms_error}")
        
        return {
            'success': True,
            'status': checkout_status.status,
            'paymentStatus': checkout_status.payment_status,
            'amount': checkout_status.amount_total / 100,
            'currency': checkout_status.currency,
            'metadata': checkout_status.metadata
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Status check error: {str(e)}"
        )

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        if not signature:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing signature"
            )
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
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
            detail=f"Webhook error: {str(e)}"
        )
