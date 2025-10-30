# Service definitions matching frontend
ONE_OFF_SERVICES = {
    # GLP-1 Initial Evaluations
    'glp1-sema-initial': {
        'id': 'glp1-sema-initial',
        'title': 'GLP-1 Semaglutide - Initial Evaluation',
        'price': 150.00,
        'type': 'oneoff',
        'category': 'weight-loss'
    },
    'glp1-tirz-initial': {
        'id': 'glp1-tirz-initial',
        'title': 'GLP-1 Tirzepatide - Initial Evaluation',
        'price': 279.00,
        'type': 'oneoff',
        'category': 'weight-loss'
    },
    # Other Services
    'hormone-health': {
        'id': 'hormone-health',
        'title': 'Hormone Health & Rx',
        'price': 150.00,
        'type': 'oneoff',
        'category': 'hormone'
    },
    'acute-care': {
        'id': 'acute-care',
        'title': 'Acute Care Visit',
        'price': 85.00,
        'type': 'oneoff',
        'category': 'general'
    },
    'functional-medicine': {
        'id': 'functional-medicine',
        'title': 'Functional Medicine Visit',
        'price': 175.00,
        'type': 'oneoff',
        'category': 'functional'
    }
}

SUBSCRIPTION_PLANS = {
    # GLP-1 Management Plans
    'glp1-sema-monthly': {
        'id': 'glp1-sema-monthly',
        'title': 'GLP-1 Semaglutide - Monthly Management',
        'tier': 'glp1-management',
        'price': 249.00,
        'visitLimit': None,  # Unlimited
        'features': [
            'Monthly GLP-1 Semaglutide medication',
            'Unlimited provider consultations',
            'Weight loss monitoring & support',
            'Medication adjustment & titration',
            'Side effect management'
        ]
    },
    'glp1-tirz-monthly': {
        'id': 'glp1-tirz-monthly',
        'title': 'GLP-1 Tirzepatide - Monthly Management',
        'tier': 'glp1-management',
        'price': 329.00,
        'visitLimit': None,  # Unlimited
        'features': [
            'Monthly GLP-1 Tirzepatide medication',
            'Unlimited provider consultations',
            'Advanced weight loss monitoring',
            'Medication adjustment & titration',
            'Side effect management',
            'Enhanced metabolic support'
        ]
    },
    'metabolic-coaching': {
        'id': 'metabolic-coaching',
        'title': 'Metabolic Coaching Add-On',
        'tier': 'coaching',
        'price': 99.00,
        'visitLimit': 2,  # 2 sessions per month
        'features': [
            'Bi-monthly coaching sessions',
            'Personalized nutrition guidance',
            'Exercise planning & support',
            'Lifestyle modification strategies',
            'Progress tracking & accountability'
        ]
    },
    # Standard Plans
    'sub-basic': {
        'id': 'sub-basic',
        'title': 'Basic Access',
        'tier': 'basic',
        'price': 35.00,
        'visitLimit': 2,  # Max visits per month
        'features': [
            'Limited urgent visits (1–2/month)',
            'Chat messaging with RN/MA',
            'Discounted labs & prescriptions',
            'Standard appointment booking'
        ]
    },
    'sub-standard': {
        'id': 'sub-standard',
        'title': 'Standard Care',
        'tier': 'standard',
        'price': 150.00,
        'visitLimit': None,  # Unlimited
        'features': [
            'Unlimited general medicine consults',
            'Priority appointment booking',
            'Care coordination & follow-ups',
            'Physician messaging access',
            'Preventive care planning'
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