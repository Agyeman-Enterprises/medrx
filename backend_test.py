#!/usr/bin/env python3
"""
MedRx GLP-1 Platform Backend API Test Suite
Tests all GLP-1 appointment, payment, and subscription endpoints comprehensively
"""

import asyncio
import aiohttp
import json
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')

# Get backend URL from environment
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://medrx-ai.preview.emergentagent.com')
BASE_URL = f"{BACKEND_URL}/api"

class MedRxGLP1Tester:
    def __init__(self):
        self.session = None
        self.test_results = []
        self.time_counter = 0  # To avoid time slot conflicts
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def get_unique_time_slot(self):
        """Get a unique time slot to avoid conflicts"""
        self.time_counter += 1
        # Use microseconds and counter for maximum uniqueness
        now = datetime.now()
        microsecond_part = now.microsecond
        
        # Use different days based on counter and microseconds
        days_offset = 15 + (self.time_counter % 30) + (microsecond_part % 10)
        base_date = now + timedelta(days=days_offset)
        
        # Use counter and microseconds for time calculation
        time_seed = self.time_counter + (microsecond_part // 1000)
        time_hour = 8 + (time_seed % 10)  # 8 AM to 5 PM
        time_minute = (time_seed * 7) % 60  # Various minutes
        
        if time_hour > 12:
            time_str = f"{time_hour - 12}:{time_minute:02d} PM"
        else:
            time_str = f"{time_hour}:{time_minute:02d} AM"
            
        return base_date.strftime("%Y-%m-%d"), time_str
    
    def log_test(self, test_name, success, message, details=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
        
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message,
            'details': details
        })
    
    async def test_health_check(self):
        """Test API health endpoint"""
        try:
            async with self.session.get(f"{BASE_URL}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("Health Check", True, f"API is healthy: {data.get('status')}")
                    return True
                else:
                    self.log_test("Health Check", False, f"Health check failed with status {response.status}")
                    return False
        except Exception as e:
            self.log_test("Health Check", False, f"Health check error: {str(e)}")
            return False
    
    async def create_glp1_appointment(self, service_id, service_name, price, requires_address=True):
        """Test creating a GLP-1 appointment with address data"""
        test_name = f"Create GLP-1 Appointment ({service_name})"
        
        # Generate unique test data with realistic names
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        
        # Use realistic patient names for GLP-1 testing
        patient_names = [
            "Sarah Johnson", "Michael Chen", "Jennifer Rodriguez", 
            "David Kim", "Lisa Thompson", "Robert Martinez"
        ]
        patient_name = patient_names[self.time_counter % len(patient_names)]
        email = f"glp1.patient.{service_id.replace('-', '.')}.{timestamp}@medicaltesting.com"
        
        # Get unique time slot to avoid conflicts
        appointment_date, appointment_time = self.get_unique_time_slot()
        
        appointment_data = {
            "name": patient_name,
            "email": email,
            "phone": f"+1-555-{1000 + self.time_counter:04d}",
            "serviceId": service_id,
            "serviceType": "oneoff",
            "date": appointment_date,
            "time": appointment_time,
            "timezone": "America/Los_Angeles",
            "notes": json.dumps({
                "age": "35",
                "pregnant": "no",
                "allergies": "None",
                "medications": "Metformin",
                "conditions": "Type 2 Diabetes",
                "thyroid_cancer": "no",
                "pancreatitis": "no",
                "kidney_disease": "no",
                "gastroparesis": "no",
                "current_weight": "185",
                "height": "5'6\"",
                "weight_loss_goal": "30 pounds"
            })
        }
        
        # Add address for GLP-1 services (required for medication delivery)
        if requires_address:
            appointment_data["address"] = {
                "street": f"{100 + self.time_counter} Medical Plaza Dr",
                "city": "Los Angeles",
                "state": "CA",
                "zip_code": "90210",
                "country": "US"
            }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get('success') and data.get('appointmentId'):
                        appointment = data.get('appointment', {})
                        actual_price = appointment.get('price', 0)
                        
                        # Verify address is stored for GLP-1 services
                        patient_info = appointment.get('patientInfo', {})
                        stored_address = patient_info.get('address')
                        
                        if actual_price == price:
                            if requires_address and stored_address:
                                self.log_test(test_name, True, 
                                            f"GLP-1 appointment created with address - ${price}",
                                            f"ID: {data['appointmentId']}, Address: {stored_address['city']}, {stored_address['state']}")
                            elif not requires_address:
                                self.log_test(test_name, True, 
                                            f"Appointment created successfully - ${price}",
                                            f"ID: {data['appointmentId']}")
                            else:
                                self.log_test(test_name, False, 
                                            "Address required for GLP-1 service but not stored")
                                return {'success': False}
                            
                            return {'success': True, 'email': email, 'appointment_id': data['appointmentId']}
                        else:
                            self.log_test(test_name, False, 
                                        f"Price mismatch: expected ${price}, got ${actual_price}")
                            return {'success': False}
                    else:
                        self.log_test(test_name, False, "Invalid response format")
                        return {'success': False}
                else:
                    error_text = await response.text()
                    self.log_test(test_name, False, 
                                f"HTTP {response.status}: {error_text}")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def get_appointments_by_email(self, email):
        """Test getting appointments by email"""
        test_name = "Get Appointments by Email"
        
        try:
            async with self.session.get(f"{BASE_URL}/appointments/?email={email}") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('success'):
                        appointments = data.get('appointments', [])
                        self.log_test(test_name, True, 
                                    f"Retrieved {len(appointments)} appointments for {email}")
                        return {'success': True, 'appointments': appointments}
                    else:
                        self.log_test(test_name, False, "Invalid response format")
                        return {'success': False}
                else:
                    error_text = await response.text()
                    self.log_test(test_name, False, f"HTTP {response.status}: {error_text}")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def create_glp1_subscription(self, plan_id, plan_name, price):
        """Test creating a GLP-1 subscription"""
        test_name = f"Create GLP-1 Subscription ({plan_name})"
        
        # Generate unique test data
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        email = f"glp1.subscriber.{plan_id.replace('-', '.')}.{timestamp}@medicaltesting.com"
        
        # First create a user by booking a GLP-1 appointment (this creates the user)
        user_date, user_time = self.get_unique_time_slot()
        
        user_creation_data = {
            "name": "Dr. Amanda Wilson",
            "email": email,
            "phone": f"+1-555-{2000 + self.time_counter:04d}",
            "serviceId": "glp1-sema-initial",
            "serviceType": "oneoff",
            "date": user_date,
            "time": user_time,
            "timezone": "America/New_York",
            "address": {
                "street": f"{200 + self.time_counter} Wellness Center Blvd",
                "city": "New York",
                "state": "NY",
                "zip_code": "10001",
                "country": "US"
            },
            "notes": "Creating user for GLP-1 subscription test"
        }
        
        # Create user first
        try:
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=user_creation_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                if response.status != 200:
                    self.log_test(test_name, False, "Failed to create user for subscription test")
                    return {'success': False}
        except Exception as e:
            self.log_test(test_name, False, f"Failed to create user: {str(e)}")
            return {'success': False}
        
        subscription_data = {
            "email": email,
            "planId": plan_id
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/subscriptions/",
                json=subscription_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get('success') and data.get('subscriptionId'):
                        subscription = data.get('subscription', {})
                        actual_price = subscription.get('monthlyPrice', 0)
                        
                        if actual_price == price:
                            self.log_test(test_name, True, 
                                        f"GLP-1 subscription created successfully - ${price}/month",
                                        f"ID: {data['subscriptionId']}, Plan: {plan_name}")
                            return {'success': True, 'email': email, 'subscription_id': data['subscriptionId']}
                        else:
                            self.log_test(test_name, False, 
                                        f"Price mismatch: expected ${price}, got ${actual_price}")
                            return {'success': False}
                    else:
                        self.log_test(test_name, False, "Invalid response format")
                        return {'success': False}
                else:
                    error_text = await response.text()
                    self.log_test(test_name, False, f"HTTP {response.status}: {error_text}")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def test_payment_checkout_session(self, service_id, expected_amount):
        """Test creating Stripe checkout session"""
        test_name = f"Payment Checkout Session ({service_id})"
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        email = f"payment.test.{service_id.replace('-', '.')}.{timestamp}@medicaltesting.com"
        
        checkout_data = {
            "serviceId": service_id,
            "originUrl": BACKEND_URL,
            "email": email,
            "appointmentData": {
                "name": "Payment Test Patient",
                "date": "2024-12-20",
                "time": "10:00 AM",
                "timezone": "America/Los_Angeles"
            }
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/payments/checkout/session",
                json=checkout_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get('success') and data.get('url') and data.get('sessionId'):
                        self.log_test(test_name, True, 
                                    f"Checkout session created for ${expected_amount}",
                                    f"Session ID: {data['sessionId']}")
                        return {'success': True, 'session_id': data['sessionId'], 'url': data['url']}
                    else:
                        self.log_test(test_name, False, "Invalid checkout response format")
                        return {'success': False}
                else:
                    error_text = await response.text()
                    self.log_test(test_name, False, f"HTTP {response.status}: {error_text}")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def test_payment_status_check(self, session_id):
        """Test checking payment status"""
        test_name = "Payment Status Check"
        
        try:
            async with self.session.get(f"{BASE_URL}/payments/checkout/status/{session_id}") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('success'):
                        status = data.get('status')
                        payment_status = data.get('paymentStatus')
                        amount = data.get('amount')
                        
                        self.log_test(test_name, True, 
                                    f"Payment status retrieved: {status}/{payment_status}",
                                    f"Amount: ${amount}")
                        return {'success': True, 'status': status, 'payment_status': payment_status}
                    else:
                        self.log_test(test_name, False, "Invalid status response format")
                        return {'success': False}
                else:
                    error_text = await response.text()
                    self.log_test(test_name, False, f"HTTP {response.status}: {error_text}")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def get_subscription_by_email(self, email):
        """Test getting subscription by email"""
        test_name = "Get Subscription by Email"
        
        try:
            async with self.session.get(f"{BASE_URL}/subscriptions/email/{email}") as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get('success'):
                        subscription = data.get('subscription')
                        if subscription:
                            self.log_test(test_name, True, 
                                        f"Retrieved subscription for {email}",
                                        f"Plan: {subscription.get('planName')}")
                            return {'success': True, 'subscription': subscription}
                        else:
                            self.log_test(test_name, True, f"No subscription found for {email}")
                            return {'success': True, 'subscription': None}
                    else:
                        self.log_test(test_name, False, "Invalid response format")
                        return {'success': False}
                else:
                    error_text = await response.text()
                    self.log_test(test_name, False, f"HTTP {response.status}: {error_text}")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def create_subscription_appointment(self, email, service_type="subscription"):
        """Test creating an appointment with subscription"""
        test_name = "Create Subscription Appointment"
        
        # Get unique time slot for subscription appointment
        appointment_date, appointment_time = self.get_unique_time_slot()
        
        appointment_data = {
            "name": "Jane Subscriber",
            "email": email,
            "phone": "+1-555-0456",
            "serviceId": "sub-1",  # Will be overridden by subscription logic
            "serviceType": service_type,
            "date": appointment_date,
            "time": appointment_time,
            "timezone": "Pacific/Honolulu",
            "notes": "Subscription-based appointment"
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 200:
                    data = await response.json()
                    if data.get('success') and data.get('appointmentId'):
                        appointment = data.get('appointment', {})
                        price = appointment.get('price', -1)
                        
                        if price == 0:  # Subscription appointments should be free
                            self.log_test(test_name, True, 
                                        "Subscription appointment created successfully (free)",
                                        f"ID: {data['appointmentId']}")
                            return {'success': True, 'appointment_id': data['appointmentId']}
                        else:
                            self.log_test(test_name, False, 
                                        f"Expected free appointment, got price ${price}")
                            return {'success': False}
                    else:
                        self.log_test(test_name, False, "Invalid response format")
                        return {'success': False}
                else:
                    error_text = await response.text()
                    self.log_test(test_name, False, f"HTTP {response.status}: {error_text}")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def test_visit_limits(self, email, plan_name):
        """Test subscription visit limits"""
        test_name = f"Test Visit Limits ({plan_name})"
        
        if "Basic" in plan_name:
            # Basic plan has 2 visit limit, try to book 3rd appointment
            appointment_date, appointment_time = self.get_unique_time_slot()
            
            appointment_data = {
                "name": "Jane Subscriber",
                "email": email,
                "phone": "+1-555-0456",
                "serviceId": "sub-1",
                "serviceType": "subscription",
                "date": appointment_date,
                "time": appointment_time,
                "timezone": "Pacific/Honolulu",
                "notes": "Third appointment - should fail"
            }
            
            try:
                async with self.session.post(
                    f"{BASE_URL}/appointments/",
                    json=appointment_data,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    
                    if response.status == 400:
                        error_data = await response.json()
                        if "limit" in error_data.get('detail', '').lower():
                            self.log_test(test_name, True, 
                                        "Visit limit correctly enforced for Basic plan")
                            return {'success': True}
                        else:
                            self.log_test(test_name, False, 
                                        f"Wrong error message: {error_data.get('detail')}")
                            return {'success': False}
                    else:
                        self.log_test(test_name, False, 
                                    "Expected 400 error for exceeding visit limit")
                        return {'success': False}
                        
            except Exception as e:
                self.log_test(test_name, False, f"Request error: {str(e)}")
                return {'success': False}
        
        elif "Standard" in plan_name:
            # Standard plan has unlimited visits, should succeed
            for i in range(3, 6):  # Try booking 3 more appointments
                appointment_date, appointment_time = self.get_unique_time_slot()
                
                appointment_data = {
                    "name": "Jane Subscriber",
                    "email": email,
                    "phone": "+1-555-0456",
                    "serviceId": "sub-2",
                    "serviceType": "subscription",
                    "date": appointment_date,
                    "time": appointment_time,
                    "timezone": "Pacific/Honolulu",
                    "notes": f"Unlimited appointment #{i}"
                }
                
                try:
                    async with self.session.post(
                        f"{BASE_URL}/appointments/",
                        json=appointment_data,
                        headers={"Content-Type": "application/json"}
                    ) as response:
                        
                        if response.status != 200:
                            error_text = await response.text()
                            self.log_test(test_name, False, 
                                        f"Standard plan appointment #{i} failed: {error_text}")
                            return {'success': False}
                            
                except Exception as e:
                    self.log_test(test_name, False, f"Request error on appointment #{i}: {str(e)}")
                    return {'success': False}
            
            self.log_test(test_name, True, 
                        "Standard plan unlimited appointments working correctly")
            return {'success': True}
        
        return {'success': True}
    
    async def test_duplicate_booking_prevention(self):
        """Test duplicate booking prevention for GLP-1 services"""
        test_name = "GLP-1 Duplicate Booking Prevention"
        
        # Generate unique test data
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        email = f"duplicate.glp1.test.{timestamp}@medicaltesting.com"
        
        # Get unique time slot for duplicate test
        appointment_date, appointment_time = self.get_unique_time_slot()
        
        appointment_data = {
            "name": "Dr. Patricia Williams",
            "email": email,
            "phone": "+1-555-3000",
            "serviceId": "glp1-sema-initial",
            "serviceType": "oneoff",
            "date": appointment_date,
            "time": appointment_time,
            "timezone": "America/Chicago",
            "address": {
                "street": "300 Medical Center Dr",
                "city": "Chicago",
                "state": "IL",
                "zip_code": "60601",
                "country": "US"
            },
            "notes": json.dumps({"test": "first_appointment"})
        }
        
        try:
            # Book first GLP-1 appointment
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status != 200:
                    self.log_test(test_name, False, "Failed to create first GLP-1 appointment")
                    return {'success': False}
            
            # Try to book duplicate appointment (same date/time)
            appointment_data["name"] = "Dr. Different Patient"
            appointment_data["email"] = f"different.glp1.{timestamp}@medicaltesting.com"
            appointment_data["serviceId"] = "glp1-tirz-initial"  # Different service, same time
            appointment_data["notes"] = json.dumps({"test": "duplicate_time_slot"})
            
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 400:
                    error_data = await response.json()
                    if "already booked" in error_data.get('detail', '').lower():
                        self.log_test(test_name, True, 
                                    "GLP-1 duplicate booking correctly prevented")
                        return {'success': True}
                    else:
                        self.log_test(test_name, False, 
                                    f"Wrong error message: {error_data.get('detail')}")
                        return {'success': False}
                else:
                    self.log_test(test_name, False, 
                                "Expected 400 error for duplicate GLP-1 booking")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def test_validation_errors(self):
        """Test API validation for missing/invalid fields"""
        test_name = "GLP-1 API Validation"
        
        # Test missing required fields for GLP-1 appointment
        invalid_data = {
            "email": "invalid.glp1@medicaltesting.com",
            "serviceId": "glp1-sema-initial",
            # Missing name, phone, date, time, etc.
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=invalid_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 422:  # FastAPI validation error
                    self.log_test(test_name, True, 
                                "GLP-1 validation correctly rejects missing fields")
                    return {'success': True}
                else:
                    self.log_test(test_name, False, 
                                f"Expected 422 validation error, got {response.status}")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def test_invalid_service_ids(self):
        """Test invalid service ID handling"""
        test_name = "Invalid Service ID Validation"
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        appointment_date, appointment_time = self.get_unique_time_slot()
        
        invalid_appointment_data = {
            "name": "Test Patient",
            "email": f"invalid.service.{timestamp}@medicaltesting.com",
            "phone": "+1-555-4000",
            "serviceId": "invalid-service-id",
            "serviceType": "oneoff",
            "date": appointment_date,
            "time": appointment_time,
            "timezone": "America/Los_Angeles"
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=invalid_appointment_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 400:
                    error_data = await response.json()
                    if "invalid service" in error_data.get('detail', '').lower():
                        self.log_test(test_name, True, 
                                    "Invalid service ID correctly rejected")
                        return {'success': True}
                    else:
                        self.log_test(test_name, False, 
                                    f"Wrong error message: {error_data.get('detail')}")
                        return {'success': False}
                else:
                    self.log_test(test_name, False, 
                                f"Expected 400 error for invalid service ID, got {response.status}")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"\n{'='*60}")
        print(f"TEST SUMMARY")
        print(f"{'='*60}")
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\nFAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"❌ {result['test']}: {result['message']}")
        
        return passed_tests, failed_tests

async def run_comprehensive_glp1_tests():
    """Run comprehensive GLP-1 platform backend API tests"""
    print("Starting MedRx GLP-1 Platform Backend API Comprehensive Tests")
    print(f"Testing against: {BASE_URL}")
    print("="*80)
    
    async with MedRxGLP1Tester() as tester:
        # 1. Health check
        health_ok = await tester.test_health_check()
        if not health_ok:
            print("❌ API is not healthy, stopping tests")
            return
        
        # 2. Test GLP-1 Appointments with Address Requirements
        print("\n💉 Testing GLP-1 Appointments with Address Data...")
        sema_result = await tester.create_glp1_appointment(
            "glp1-sema-initial", "GLP-1 Semaglutide Initial", 150.00, requires_address=True)
        
        tirz_result = await tester.create_glp1_appointment(
            "glp1-tirz-initial", "GLP-1 Tirzepatide Initial", 279.00, requires_address=True)
        
        hormone_result = await tester.create_glp1_appointment(
            "hormone-health", "Hormone Health & Rx", 150.00, requires_address=True)
        
        # 3. Test appointment retrieval
        print("\n📋 Testing Appointment Retrieval...")
        if sema_result['success']:
            await tester.get_appointments_by_email(sema_result['email'])
        
        # 4. Test Payment API
        print("\n💳 Testing Payment Checkout Sessions...")
        sema_payment = await tester.test_payment_checkout_session("glp1-sema-initial", 150.00)
        tirz_payment = await tester.test_payment_checkout_session("glp1-tirz-initial", 279.00)
        hormone_payment = await tester.test_payment_checkout_session("hormone-health", 150.00)
        
        # 5. Test payment status checks
        if sema_payment['success']:
            await tester.test_payment_status_check(sema_payment['session_id'])
        
        # 6. Test GLP-1 Subscriptions
        print("\n🔄 Testing GLP-1 Monthly Management Subscriptions...")
        sema_sub = await tester.create_glp1_subscription(
            "glp1-sema-monthly", "GLP-1 Semaglutide Monthly Management", 249.00)
        
        tirz_sub = await tester.create_glp1_subscription(
            "glp1-tirz-monthly", "GLP-1 Tirzepatide Monthly Management", 329.00)
        
        coaching_sub = await tester.create_glp1_subscription(
            "metabolic-coaching", "Metabolic Coaching Add-On", 99.00)
        
        # 7. Test subscription retrieval
        if sema_sub['success']:
            await tester.get_subscription_by_email(sema_sub['email'])
        
        # 8. Test Standard Subscriptions (Basic & Standard)
        print("\n📊 Testing Standard Subscription Plans...")
        basic_sub = await tester.create_glp1_subscription("sub-basic", "Basic Access", 35.00)
        standard_sub = await tester.create_glp1_subscription("sub-standard", "Standard Care", 150.00)
        
        # 9. Test validation and edge cases
        print("\n🔍 Testing Validation & Edge Cases...")
        await tester.test_duplicate_booking_prevention()
        await tester.test_validation_errors()
        await tester.test_invalid_service_ids()
        
        # 10. Print summary
        passed, failed = tester.print_summary()
        
        return passed, failed

if __name__ == "__main__":
    asyncio.run(run_comprehensive_glp1_tests())