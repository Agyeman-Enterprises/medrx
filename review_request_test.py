#!/usr/bin/env python3
"""
MedRx Booking Flow Test - Specific Review Request
Tests the exact scenarios requested in the review
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

class ReviewRequestTester:
    def __init__(self):
        self.session = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
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
    
    async def test_health_endpoint(self):
        """Test GET /api/health - verify backend is running"""
        try:
            async with self.session.get(f"{BASE_URL}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_test("GET /api/health", True, f"Backend is running: {data.get('status')}")
                    return True
                else:
                    self.log_test("GET /api/health", False, f"Health check failed with status {response.status}")
                    return False
        except Exception as e:
            self.log_test("GET /api/health", False, f"Health check error: {str(e)}")
            return False
    
    async def test_drchrono_health_endpoint(self):
        """Test GET /api/drchrono/health - verify DrChrono integration"""
        try:
            async with self.session.get(f"{BASE_URL}/drchrono/health") as response:
                if response.status == 200:
                    data = await response.json()
                    configured = data.get('drchrono_configured', False)
                    client_id_present = data.get('client_id_present', False)
                    client_secret_present = data.get('client_secret_present', False)
                    
                    self.log_test("GET /api/drchrono/health", True, 
                                f"DrChrono integration status: {data.get('status')}", 
                                f"Configured: {configured}, Client ID: {client_id_present}, Client Secret: {client_secret_present}")
                    return True
                else:
                    self.log_test("GET /api/drchrono/health", False, f"DrChrono health check failed with status {response.status}")
                    return False
        except Exception as e:
            self.log_test("GET /api/drchrono/health", False, f"DrChrono health check error: {str(e)}")
            return False
    
    async def test_glp1_weight_loss_booking_flow(self):
        """Test complete booking flow for glp1-weight-loss service"""
        test_name = "GLP-1 Weight Loss Booking Flow"
        
        # Calculate a future date to avoid conflicts
        future_date = datetime.now() + timedelta(days=7)  # Use next week
        appointment_date = future_date.strftime("%Y-%m-%d")
        # Use current time + minutes to make it unique
        unique_minutes = datetime.now().minute
        appointment_time = f"2:{unique_minutes:02d} PM"  # 14:XX (2:XX PM California time)
        
        # Generate unique test data
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        
        appointment_data = {
            "name": "Test Patient Review",
            "email": f"review.test.{timestamp}@medicaltesting.com",
            "phone": "+1-555-1234",
            "serviceId": "glp1-weight-loss",  # As specified in review request
            "serviceType": "oneoff",
            "date": appointment_date,
            "time": appointment_time,
            "timezone": "America/Los_Angeles",  # California timezone as specified
            "address": {
                "street": "123 Review Test Dr",
                "city": "Los Angeles", 
                "state": "CA",
                "zip_code": "90210",
                "country": "US"
            },
            "notes": json.dumps({
                "age": "30",
                "pregnant": "no",
                "allergies": "None",
                "medications": "None",
                "conditions": "None",
                "thyroid_cancer": "no",
                "pancreatitis": "no", 
                "kidney_disease": "no",
                "gastroparesis": "no",
                "current_weight": "175",
                "height": "5'8\"",
                "weight_loss_goal": "20 pounds"
            })
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                
                if response.status == 200:
                    data = await response.json()
                    if data.get('success') and data.get('appointmentId'):
                        appointment = data.get('appointment', {})
                        
                        # Verify appointment details
                        stored_date = appointment.get('appointmentDate')
                        stored_time = appointment.get('appointmentTime')
                        stored_timezone = appointment.get('timezone')
                        stored_price = appointment.get('price')
                        patient_info = appointment.get('patientInfo', {})
                        stored_address = patient_info.get('address')
                        
                        success_details = []
                        success_details.append(f"Appointment ID: {data['appointmentId']}")
                        success_details.append(f"Date: {stored_date}, Time: {stored_time}")
                        success_details.append(f"Timezone: {stored_timezone}")
                        success_details.append(f"Price: ${stored_price}")
                        success_details.append(f"Address: {stored_address['city']}, {stored_address['state']}" if stored_address else "No address")
                        
                        self.log_test(test_name, True, 
                                    "Complete GLP-1 weight loss booking successful",
                                    "; ".join(success_details))
                        return {'success': True, 'appointment_id': data['appointmentId'], 'email': appointment_data['email']}
                    else:
                        self.log_test(test_name, False, f"Invalid response format: {response_text}")
                        return {'success': False}
                else:
                    self.log_test(test_name, False, f"HTTP {response.status}: {response_text}")
                    return {'success': False}
                    
        except Exception as e:
            self.log_test(test_name, False, f"Request error: {str(e)}")
            return {'success': False}
    
    async def test_timezone_availability_logic(self):
        """Test timezone-aware availability logic"""
        test_name = "Timezone Availability Logic"
        
        # Test California timezone (should show slots 2 PM - 10 PM)
        california_test_passed = await self._test_timezone_booking(
            "America/Los_Angeles", "2:00 PM", "California"
        )
        
        # Test Hawaii timezone (different window)
        hawaii_test_passed = await self._test_timezone_booking(
            "Pacific/Honolulu", "11:00 AM", "Hawaii"
        )
        
        # Test New York timezone (different window)
        ny_test_passed = await self._test_timezone_booking(
            "America/New_York", "3:00 PM", "New York"
        )
        
        if california_test_passed and hawaii_test_passed and ny_test_passed:
            self.log_test(test_name, True, 
                        "Timezone availability logic working correctly",
                        "California 2 PM, Hawaii 11 AM, and NY 3 PM slots all accepted")
            return {'success': True}
        else:
            self.log_test(test_name, False, 
                        f"Timezone logic issues - CA: {california_test_passed}, HI: {hawaii_test_passed}, NY: {ny_test_passed}")
            return {'success': False}
    
    async def _test_timezone_booking(self, timezone, time_slot, location_name):
        """Helper method to test booking in specific timezone"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        
        appointment_data = {
            "name": f"{location_name} Test Patient",
            "email": f"{location_name.lower()}.timezone.test.{timestamp}@medicaltesting.com",
            "phone": f"+1-555-{hash(timezone) % 9000 + 1000}",
            "serviceId": "glp1-weight-loss",
            "serviceType": "oneoff",
            "date": (datetime.now() + timedelta(days=10 + hash(timezone) % 5)).strftime("%Y-%m-%d"),
            "time": time_slot,
            "timezone": timezone,
            "address": {
                "street": f"456 {location_name} St",
                "city": location_name,
                "state": "CA" if location_name == "California" else ("HI" if location_name == "Hawaii" else "NY"),
                "zip_code": "90210" if location_name == "California" else ("96815" if location_name == "Hawaii" else "10001"),
                "country": "US"
            },
            "notes": json.dumps({"test": f"{location_name.lower()}_timezone"})
        }
        
        try:
            async with self.session.post(
                f"{BASE_URL}/appointments/",
                json=appointment_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                return response.status == 200
                
        except Exception as e:
            print(f"   Error testing {location_name} timezone: {str(e)}")
            return False
    
    def print_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        print(f"\n{'='*60}")
        print(f"REVIEW REQUEST TEST SUMMARY")
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

async def run_review_request_tests():
    """Run the specific tests requested in the review"""
    print("Starting MedRx Booking Flow Tests - Review Request")
    print(f"Testing against: {BASE_URL}")
    print("="*80)
    
    async with ReviewRequestTester() as tester:
        # 1. Test booking API endpoints
        print("\n🔍 Testing Booking API Endpoints...")
        
        # GET /api/health - verify backend is running
        health_ok = await tester.test_health_endpoint()
        if not health_ok:
            print("❌ Backend is not healthy, stopping tests")
            return
        
        # GET /api/drchrono/health - verify DrChrono integration
        await tester.test_drchrono_health_endpoint()
        
        # 2. Test booking flow (simulate complete booking)
        print("\n📋 Testing Complete Booking Flow...")
        booking_result = await tester.test_glp1_weight_loss_booking_flow()
        
        # 3. Verify timezone availability logic works correctly
        print("\n🌍 Testing Timezone Availability Logic...")
        await tester.test_timezone_availability_logic()
        
        # Print summary
        passed, failed = tester.print_summary()
        
        return passed, failed

if __name__ == "__main__":
    asyncio.run(run_review_request_tests())