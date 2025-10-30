# Service definitions matching frontend
ONE_OFF_SERVICES = {
    'oneoff-glp1': {
        'id': 'oneoff-glp1',
        'title': 'GLP-1 Weight Loss - Semaglutide',
        'price': 150,
        'type': 'oneoff',
        'category': 'weight-loss'
    },
    'oneoff-glp2': {
        'id': 'oneoff-glp2',
        'title': 'GLP-1 Weight Loss - Tirzepatide',
        'price': 279,
        'type': 'oneoff',
        'category': 'weight-loss'
    },
    'oneoff-hormone': {
        'id': 'oneoff-hormone',
        'title': 'Hormone Health & Rx',
        'price': 150,
        'type': 'oneoff',
        'category': 'hormone'
    },
    'oneoff-acute': {
        'id': 'oneoff-acute',
        'title': 'Acute Care Visit',
        'price': 85,
        'type': 'oneoff',
        'category': 'general'
    },
    'oneoff-functional': {
        'id': 'oneoff-functional',
        'title': 'Functional Medicine Visit',
        'price': 175,
        'type': 'oneoff',
        'category': 'functional'
    }
}

SUBSCRIPTION_PLANS = {
    'sub-1': {
        'id': 'sub-1',
        'title': 'Basic Access',
        'tier': 'basic',
        'price': 35,
        'visitLimit': 2,  # Max visits per month
        'features': [
            'Limited urgent visits (1–2/month)',
            'Chat messaging with RN/MA',
            'Discounted labs & prescriptions',
            'Standard appointment booking'
        ]
    },
    'sub-2': {
        'id': 'sub-2',
        'title': 'Standard Care',
        'tier': 'standard',
        'price': 150,
        'visitLimit': None,  # Unlimited
        'features': [
            'Unlimited general medicine consults',
            'Priority appointment booking',
            'Care coordination & follow-ups',
            'Physician messaging access',
            'Preventive care planning'
        ]
    },
    'sub-3': {
        'id': 'sub-3',
        'title': 'Functional Medicine',
        'tier': 'integrative',
        'price': 400,
        'visitLimit': None,  # Unlimited
        'features': [
            'Extended 45-minute consultations',
            'Personalized labs & interpretation',
            'GLP-1 therapy management',
            'Hormone health optimization',
            'Supplement recommendations',
            'Health coaching sessions'
        ]
    },
    'sub-4': {
        'id': 'sub-4',
        'title': 'VIP Concierge',
        'tier': 'vip',
        'price': 600,
        'visitLimit': None,  # Unlimited
        'features': [
            'Dedicated physician partnership',
            '24/7 physician messaging',
            'Same-day appointment availability',
            'Annual in-person wellness check',
            'Specialist referral coordination',
            'Advanced diagnostics & testing',
            'Concierge care management'
        ]
    }
}

def get_service_info(service_id):
    """Get service information by ID"""
    if service_id in ONE_OFF_SERVICES:
        return ONE_OFF_SERVICES[service_id]
    elif service_id in SUBSCRIPTION_PLANS:
        return SUBSCRIPTION_PLANS[service_id]
    return None