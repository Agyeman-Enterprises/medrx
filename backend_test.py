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
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://tele-clinical.preview.emergentagent.com')
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
        base_date = datetime.now() + timedelta(days=7 + self.time_counter)
        time_hour = 9 + (self.time_counter % 8)  # 9 AM to 4 PM
        return base_date.strftime("%Y-%m-%d"), f"{time_hour}:00 AM"
    
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
    
    async def create_subscription(self, plan_id, plan_name, price):
        """Test creating a subscription"""
        test_name = f"Create Subscription ({plan_name})"
        
        # Generate unique test data
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        email = f"subscriber_{plan_id}_{timestamp}@example.com"
        
        # First create a user by booking an appointment (this creates the user)
        user_date, user_time = self.get_unique_time_slot()
        
        user_creation_data = {
            "name": f"Subscriber User {timestamp}",
            "email": email,
            "phone": "+1-555-0999",
            "serviceId": "oneoff-1",
            "serviceType": "oneoff",
            "date": user_date,
            "time": user_time,
            "timezone": "Pacific/Honolulu",
            "notes": "Creating user for subscription test"
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
                                        f"Subscription created successfully with correct price ${price}",
                                        f"ID: {data['subscriptionId']}, Email: {email}")
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
        """Test duplicate booking prevention"""
        test_name = "Duplicate Booking Prevention"
        
        # Generate unique test data
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        email = f"duplicate_test_{timestamp}@example.com"
        
        # Get unique time slot for duplicate test
        appointment_date, appointment_time = self.get_unique_time_slot()
        
        appointment_data = {
            "name": f"Duplicate Test {timestamp}",
            "email": email,
            "phone": "+1-555-0789",
            "serviceId": "oneoff-1",
            "serviceType": "oneoff",
            "date": appointment_date,
            "time": appointment_time,
            "timezone": "Pacific/Honolulu",
            "notes": "First appointment"
        }
        
        try:
            # Book first appointment
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status != 200:
                    self.log_test(test_name, False, "Failed to create first appointment")
                    return {'success': False}
            
            # Try to book duplicate appointment (same date/time)
            appointment_data["name"] = "Different Person"
            appointment_data["email"] = f"different_{timestamp}@example.com"
            appointment_data["notes"] = "Duplicate time slot"
            
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 400:
                    error_data = await response.json()
                    if "already booked" in error_data.get('detail', '').lower():
                        self.log_test(test_name, True, 
                                    "Duplicate booking correctly prevented")
                        return {'success': True}
                    else:
                        self.log_test(test_name, False, 
                                    f"Wrong error message: {error_data.get('detail')}")
                        return {'success': False}
                else:
                    self.log_test(test_name, False, 
                                "Expected 400 error for duplicate booking")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def test_validation_errors(self):
        """Test API validation for missing/invalid fields"""
        test_name = "API Validation"
        
        # Test missing required fields
        invalid_data = {
            "email": "invalid@example.com",
            # Missing name, phone, serviceId, etc.
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=invalid_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                if response.status == 422:  # FastAPI validation error
                    self.log_test(test_name, True, 
                                "Validation correctly rejects missing fields")
                    return {'success': True}
                else:
                    self.log_test(test_name, False, 
                                f"Expected 422 validation error, got {response.status}")
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

async def run_comprehensive_tests():
    """Run all backend API tests"""
    print("Starting MedRx Backend API Comprehensive Tests")
    print(f"Testing against: {BASE_URL}")
    print("="*60)
    
    async with MedRxAPITester() as tester:
        # 1. Health check
        health_ok = await tester.test_health_check()
        if not health_ok:
            print("❌ API is not healthy, stopping tests")
            return
        
        # 2. Test one-off appointments
        print("\n📋 Testing One-off Appointments...")
        acute_result = await tester.create_oneoff_appointment("oneoff-1", "Acute Care", 85)
        functional_result = await tester.create_oneoff_appointment("oneoff-2", "Functional Medicine", 175)
        
        # 3. Test appointment retrieval
        if acute_result['success']:
            await tester.get_appointments_by_email(acute_result['email'])
        
        # 4. Test subscriptions
        print("\n💳 Testing Subscriptions...")
        basic_sub = await tester.create_subscription("sub-1", "Basic Access", 35)
        standard_sub = await tester.create_subscription("sub-2", "Standard Care", 150)
        
        # 5. Test subscription retrieval
        if basic_sub['success']:
            await tester.get_subscription_by_email(basic_sub['email'])
        
        # 6. Test subscription appointments
        print("\n🏥 Testing Subscription Appointments...")
        if basic_sub['success']:
            # First appointment with Basic subscription
            await tester.create_subscription_appointment(basic_sub['email'])
            # Second appointment with Basic subscription
            await tester.create_subscription_appointment(basic_sub['email'])
            # Test visit limits (3rd appointment should fail)
            await tester.test_visit_limits(basic_sub['email'], "Basic Access")
        
        if standard_sub['success']:
            # Test unlimited appointments with Standard subscription
            await tester.create_subscription_appointment(standard_sub['email'])
            await tester.test_visit_limits(standard_sub['email'], "Standard Care")
        
        # 7. Test edge cases
        print("\n🔍 Testing Edge Cases...")
        await tester.test_duplicate_booking_prevention()
        await tester.test_validation_errors()
        
        # 8. Print summary
        passed, failed = tester.print_summary()
        
        return passed, failed

if __name__ == "__main__":
    asyncio.run(run_comprehensive_tests())