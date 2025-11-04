import React, { useState, useRef } from 'react';
import { FileText, PenTool, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import '../styles/ConsentForms.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ConsentForms = ({ patientId, appointmentId, onComplete, onCancel }) => {
  const [currentConsent, setCurrentConsent] = useState(0);
  const [signatures, setSignatures] = useState({
    hipaa: { signed: false, signature: null, date: null },
    privacy: { signed: false, signature: null, date: null },
    financial: { signed: false, signature: null, date: null }
  });
  const [isSigning, setIsSigning] = useState(false);
  const canvasRef = useRef(null);

  const consents = [
    {
      id: 'hipaa',
      title: 'HIPAA Privacy Notice & Consent',
      version: '2025-01',
      content: `HEALTH INFORMATION PRIVACY NOTICE AND CONSENT

This notice describes how medical information about you may be used and disclosed and how you can get access to this information. Please review it carefully.

1. OUR COMMITMENT TO YOUR PRIVACY
We are committed to protecting your health information. This notice describes our legal duties and privacy practices concerning your protected health information (PHI).

2. USES AND DISCLOSURES OF HEALTH INFORMATION
We may use and disclose your health information for:
- Treatment: To provide, coordinate, or manage your healthcare
- Payment: To bill and collect payment for services
- Healthcare Operations: For quality assessment, training, and administrative purposes
- Required by Law: When required by federal, state, or local law
- Public Health: To report disease outbreaks, product recalls, or adverse reactions
- Legal Proceedings: In response to court orders or subpoenas
- Research: With your authorization or as permitted by law

3. YOUR RIGHTS
You have the right to:
- Request restrictions on uses and disclosures
- Request confidential communications
- Inspect and copy your health information
- Request amendments to your health information
- Receive an accounting of disclosures
- File a complaint if you believe your privacy rights have been violated

4. CONSENT
By signing below, I acknowledge that I have received and read this Privacy Notice. I consent to the use and disclosure of my health information as described in this notice.

I understand that I may revoke this consent at any time by providing written notice, except to the extent that action has already been taken in reliance on this consent.`
    },
    {
      id: 'privacy',
      title: 'Patient Privacy & PHI Consent',
      version: '2025-01',
      content: `PATIENT PRIVACY AND PROTECTED HEALTH INFORMATION CONSENT

1. ACKNOWLEDGMENT OF PRIVACY POLICY
I acknowledge that I have received and reviewed the Notice of Privacy Practices. I understand my rights regarding my protected health information (PHI).

2. CONSENT FOR USE AND DISCLOSURE
I consent to the use and disclosure of my PHI for:
- Treatment purposes by healthcare providers involved in my care
- Payment processing and insurance claims
- Healthcare operations including quality improvement
- Communication via phone, email, or secure messaging
- Coordination of care with other healthcare providers as needed

3. TELEMEDICINE SPECIFIC CONSENT
I understand that telemedicine involves the use of electronic communications to enable healthcare providers to evaluate, diagnose, and treat patients remotely. I consent to:
- Video consultations and electronic transmission of health information
- Storage of health information in electronic health records
- Use of secure platforms for communication

4. AUTHORIZATION
I authorize the release of my health information to:
- Insurance companies for payment purposes
- Referring physicians and specialists
- Pharmacy for prescription fulfillment
- Laboratory and diagnostic service providers

5. RIGHT TO REVOKE
I understand that I may revoke this consent at any time in writing, except to the extent that action has already been taken in reliance on this consent.

By signing below, I acknowledge that I have read, understood, and agree to the terms of this Privacy Consent.`
    },
    {
      id: 'financial',
      title: 'Financial Responsibility Agreement',
      version: '2025-01',
      content: `FINANCIAL RESPONSIBILITY AGREEMENT

1. PAYMENT RESPONSIBILITY
I understand and agree that I am financially responsible for all charges incurred for services rendered, regardless of insurance coverage. Payment is due at the time of service unless other arrangements have been made.

2. CONSULTATION FEES
- Consultation fee: $175 (Semaglutide, Hormone Health, Hair Loss) or $249 (Tirzepatide)
- Payment is required at the time of booking
- Consultation fees are non-refundable but may be rescheduled with 24-hour notice

3. ADDITIONAL CHARGES
I understand that:
- Medications and prescriptions are billed separately and are not included in the consultation fee
- Laboratory work, if ordered, will be billed separately by the laboratory provider
- Additional services, procedures, or follow-up visits will be charged separately

4. INSURANCE
- I understand that insurance coverage may vary and is not guaranteed
- I am responsible for any copayments, deductibles, or amounts not covered by insurance
- I authorize the release of medical information necessary to process insurance claims
- I understand that I am responsible for all charges regardless of insurance determination

5. COLLECTION PRACTICES
- Accounts overdue more than 30 days may be subject to collection procedures
- I understand that collection costs, attorney fees, and court costs may be added to my account if legal action is required
- I agree to pay all such costs if collection becomes necessary

6. CANCELLATION POLICY
- Appointments cancelled with less than 24 hours notice may be subject to a cancellation fee
- No-show appointments may result in a charge equal to the consultation fee
- Rescheduling within 24 hours may be subject to a fee

7. ACKNOWLEDGMENT
By signing below, I acknowledge that:
- I have read and understand this Financial Responsibility Agreement
- I agree to be financially responsible for all charges incurred
- I understand the payment terms and cancellation policy
- I authorize the clinic to charge my payment method on file for services rendered`
    }
  ];

  const startSignature = () => {
    setIsSigning(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseDown = (e) => {
      isDrawing = true;
      const rect = canvas.getBoundingClientRect();
      lastX = e.clientX - rect.left;
      lastY = e.clientY - rect.top;
    };

    const handleMouseMove = (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      lastX = currentX;
      lastY = currentY;
    };

    const handleMouseUp = () => {
      isDrawing = false;
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);

    // Touch events for mobile
    const handleTouchStart = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      lastX = touch.clientX - rect.left;
      lastY = touch.clientY - rect.top;
      isDrawing = true;
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const currentX = touch.clientX - rect.left;
      const currentY = touch.clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(currentX, currentY);
      ctx.stroke();

      lastX = currentX;
      lastY = currentY;
    };

    const handleTouchEnd = () => {
      isDrawing = false;
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    const consentId = consents[currentConsent].id;
    
    setSignatures(prev => ({
      ...prev,
      [consentId]: {
        signed: true,
        signature: signatureData,
        date: new Date().toISOString()
      }
    }));

    setIsSigning(false);
    toast.success('Signature saved');
  };

  const handleNext = () => {
    if (currentConsent < consents.length - 1) {
      setCurrentConsent(currentConsent + 1);
      clearSignature();
      setIsSigning(false);
    }
  };

  const handlePrevious = () => {
    if (currentConsent > 0) {
      setCurrentConsent(currentConsent - 1);
      clearSignature();
      setIsSigning(false);
    }
  };

  const handleSubmit = async () => {
    // Verify all consents are signed
    const allSigned = Object.values(signatures).every(consent => consent.signed);
    
    if (!allSigned) {
      toast.error('Please sign all consent forms');
      return;
    }

    try {
      const response = await axios.post(`${API}/intake/submit-consents`, {
        patient_id: patientId,
        appointment_id: appointmentId,
        consents: signatures
      });

      if (response.data.success) {
        toast.success('Consent forms submitted successfully');
        onComplete(signatures);
      }
    } catch (error) {
      toast.error('Failed to submit consent forms');
      console.error(error);
    }
  };

  const currentConsentData = consents[currentConsent];
  const isSigned = signatures[currentConsentData.id]?.signed;

  return (
    <div className="consent-forms-container">
      <div className="consent-forms-header">
        <h1 className="heading-1">Consent Forms</h1>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentConsent + 1) / consents.length) * 100}%` }}
          />
        </div>
        <p className="progress-text">
          Form {currentConsent + 1} of {consents.length}: {currentConsentData.title}
        </p>
      </div>

      <div className="consent-form-content">
        <div className="consent-header">
          <h2 className="heading-2">{currentConsentData.title}</h2>
          <p className="consent-version">Version: {currentConsentData.version}</p>
        </div>

        <div className="consent-text">
          <pre>{currentConsentData.content}</pre>
        </div>

        <div className="signature-section">
          <h3 className="heading-3">Electronic Signature</h3>
          {isSigned ? (
            <div className="signature-saved">
              <Check size={24} color="#10b981" />
              <p>Signed on {new Date(signatures[currentConsentData.id].date).toLocaleDateString()}</p>
              <img 
                src={signatures[currentConsentData.id].signature} 
                alt="Signature" 
                className="signature-preview"
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setSignatures(prev => ({
                    ...prev,
                    [currentConsentData.id]: { signed: false, signature: null, date: null }
                  }));
                  clearSignature();
                }}
              >
                Clear & Resign
              </button>
            </div>
          ) : (
            <div className="signature-pad">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="signature-canvas"
                style={{ border: '2px solid #e5e7eb', borderRadius: '8px', cursor: 'crosshair' }}
              />
              <div className="signature-controls">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={startSignature}
                  disabled={isSigning}
                >
                  <PenTool size={16} /> Start Signing
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={clearSignature}
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={saveSignature}
                  disabled={!isSigning}
                >
                  Save Signature
                </button>
              </div>
              <p className="signature-hint">
                Click "Start Signing" and draw your signature in the box above
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="consent-forms-actions">
        {currentConsent > 0 && (
          <button type="button" className="btn-secondary" onClick={handlePrevious}>
            Previous
          </button>
        )}
        {currentConsent < consents.length - 1 ? (
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleNext}
            disabled={!isSigned}
          >
            Next Form
          </button>
        ) : (
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleSubmit}
            disabled={!isSigned}
          >
            Submit All Consents
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConsentForms;

