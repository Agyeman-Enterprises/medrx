# MedRx Services - Weight Loss, Hormones, Hair Loss ONLY
# All consultations: $175 (labs and meds billed separately)

ONE_OFF_SERVICES = {
    'glp1-weight-loss': {
        'id': 'glp1-weight-loss',
        'title': 'GLP-1 Weight Loss Program',
        'price': 175.00,
        'type': 'consultation',
        'category': 'weight-loss',
        'description': 'Semaglutide and Tirzepatide programs'
    },
    'hormone-health': {
        'id': 'hormone-health',
        'title': 'Hormone Optimization',
        'price': 175.00,
        'type': 'consultation',
        'category': 'hormones',
        'description': 'Comprehensive hormone health consultation'
    },
    'hair-loss': {
        'id': 'hair-loss',
        'title': 'Medical Hair Restoration',
        'price': 175.00,
        'type': 'consultation',
        'category': 'hair-loss',
        'description': 'Hair loss treatment consultation'
    }
}

# No subscription plans - consultations only
SUBSCRIPTION_PLANS = {}

def get_service_info(service_id):
    """Get service information by ID"""
    if service_id in ONE_OFF_SERVICES:
        return ONE_OFF_SERVICES[service_id]
    return None
