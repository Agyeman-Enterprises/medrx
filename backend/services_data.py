# MedRx Services - Weight Loss, Hormones, Hair Loss ONLY
# All consultations: $175 (labs and meds billed separately)
# GLP-Tirzepatide: $249

ONE_OFF_SERVICES = {
    'glp-semaglutide': {
        'id': 'glp-semaglutide',
        'title': 'GLP-1 Semaglutide',
        'price': 175.00,
        'type': 'consultation',
        'category': 'weight-loss',
        'description': 'Semaglutide (Wegovy/Ozempic) weight loss program',
        'medication': 'Semaglutide',
        'requiresQuestionnaire': True
    },
    'glp-tirzepatide': {
        'id': 'glp-tirzepatide',
        'title': 'GLP-1 Tirzepatide',
        'price': 249.00,
        'type': 'consultation',
        'category': 'weight-loss',
        'description': 'Tirzepatide (Mounjaro/Zepbound) weight loss program',
        'medication': 'Tirzepatide',
        'requiresQuestionnaire': True
    },
    'hormone-health': {
        'id': 'hormone-health',
        'title': 'Hormone Optimization',
        'price': 175.00,
        'type': 'consultation',
        'category': 'hormones',
        'description': 'Comprehensive hormone health consultation',
        'requiresQuestionnaire': False
    },
    'hair-loss': {
        'id': 'hair-loss',
        'title': 'Medical Hair Restoration',
        'price': 175.00,
        'type': 'consultation',
        'category': 'hair-loss',
        'description': 'Hair loss treatment consultation',
        'requiresQuestionnaire': False
    }
}

# No subscription plans - consultations only
SUBSCRIPTION_PLANS = {}

def get_service_info(service_id):
    """Get service information by ID"""
    if service_id in ONE_OFF_SERVICES:
        return ONE_OFF_SERVICES[service_id]
    return None
