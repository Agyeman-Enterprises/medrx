import React, { useState, useRef } from 'react';
import { Camera, X, Check, Upload, FileText, User, Pill, Heart, Shield, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import '../styles/IntakeForm.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const IntakeForm = ({ patientId, appointmentId, onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    // Demographics
    demographics: {
      name: '',
      dob: '',
      sex: '',
      gender_identity: '',
      preferred_pronouns: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      email: '',
      emergency_contact_name: '',
      emergency_contact_phone: ''
    },
    // Medical History
    medicalHistory: {
      chronic_conditions: [],
      surgeries: [],
      hospitalizations: []
    },
    // Medications
    medications: [],
    // Allergies
    allergies: [],
    // Insurance
    insurance: {
      carrier: '',
      policy_number: '',
      group_number: '',
      subscriber_name: '',
      subscriber_dob: '',
      insurance_front_photo: null,
      insurance_back_photo: null
    },
    // Identification
    identification: {
      id_type: '', // 'driver_license' or 'passport'
      id_number: '',
      id_state: '',
      id_expiration: '',
      id_front_photo: null,
      id_back_photo: null
    },
    // Consents (will be handled separately)
    consents: {
      hipaa: { signed: false, signature: null, date: null },
      privacy: { signed: false, signature: null, date: null },
      financial: { signed: false, signature: null, date: null }
    }
  });

  const [photos, setPhotos] = useState({
    medications: {},
    insurance: { front: null, back: null },
    identification: { front: null, back: null }
  });

  const fileInputRefs = {
    medication: useRef(null),
    insuranceFront: useRef(null),
    insuranceBack: useRef(null),
    idFront: useRef(null),
    idBack: useRef(null)
  };

  const steps = [
    { id: 'demographics', title: 'Demographics', icon: User },
    { id: 'medical', title: 'Medical History', icon: Heart },
    { id: 'medications', title: 'Medications', icon: Pill },
    { id: 'allergies', title: 'Allergies', icon: Shield },
    { id: 'insurance', title: 'Insurance', icon: CreditCard },
    { id: 'identification', title: 'ID Verification', icon: FileText },
    { id: 'consents', title: 'Consents', icon: FileText }
  ];

  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleArrayAdd = (section, item) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], item]
    }));
  };

  const handleArrayRemove = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  // Photo capture/upload handlers
  const capturePhoto = async (type, category) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera
      });
      
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      // Create video preview modal
      const modal = document.createElement('div');
      modal.className = 'photo-capture-modal';
      modal.innerHTML = `
        <div class="photo-capture-container">
          <video id="capture-video" autoplay playsinline></video>
          <div class="capture-controls">
            <button id="capture-btn" class="btn-primary">Capture</button>
            <button id="cancel-capture" class="btn-secondary">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      const videoEl = modal.querySelector('#capture-video');
      videoEl.srcObject = stream;
      
      return new Promise((resolve, reject) => {
        modal.querySelector('#capture-btn').onclick = () => {
          const canvas = document.createElement('canvas');
          canvas.width = videoEl.videoWidth;
          canvas.height = videoEl.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(videoEl, 0, 0);
          
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(base64);
        };
        
        modal.querySelector('#cancel-capture').onclick = () => {
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(modal);
          reject(new Error('Cancelled'));
        };
      });
    } catch (error) {
      toast.error('Camera access denied. Please use file upload instead.');
      fileInputRefs[type]?.current?.click();
    }
  };

  const handleFileUpload = async (event, type, category) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result;
      
      // Update state
      if (category === 'medications') {
        setPhotos(prev => ({
          ...prev,
          medications: { ...prev.medications, [type]: base64 }
        }));
      } else {
        setPhotos(prev => ({
          ...prev,
          [category]: { ...prev[category], [type]: base64 }
        }));
      }

      // Upload to backend
      try {
        const response = await axios.post(`${API}/intake/upload-photo`, {
          photo_base64: base64,
          photo_type: `${category}_${type}`,
          patient_id: patientId,
          appointment_id: appointmentId
        });

        if (response.data.success) {
          toast.success('Photo uploaded successfully');
          // Store file path in form data
          if (category === 'insurance') {
            handleInputChange('insurance', `insurance_${type}_photo`, response.data.file_path);
          } else if (category === 'identification') {
            handleInputChange('identification', `id_${type}_photo`, response.data.file_path);
          }
        }
      } catch (error) {
        toast.error('Failed to upload photo');
        console.error(error);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick action buttons
  const handleQuickAction = (action, field) => {
    if (action === 'NKDA') {
      handleArrayAdd('allergies', {
        allergen: 'NKDA',
        reaction: 'No known drug allergies',
        severity: 'none'
      });
      toast.success('NKDA added');
    } else if (action === 'None') {
      if (field === 'medications') {
        handleArrayAdd('medications', {
          name: 'None',
          dosage: '',
          frequency: '',
          prescriber: '',
          indication: ''
        });
        toast.success('None added to medications');
      }
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(`${API}/intake/submit`, {
        patient_id: patientId,
        appointment_id: appointmentId,
        intake_data: formData
      });

      if (response.data.success) {
        toast.success('Intake form submitted successfully');
        onComplete(formData);
      }
    } catch (error) {
      toast.error('Failed to submit intake form');
      console.error(error);
    }
  };

  const renderStep = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'demographics':
        return (
          <div className="intake-step">
            <h2 className="heading-2">Demographics</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={formData.demographics.name}
                  onChange={(e) => handleInputChange('demographics', 'name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={formData.demographics.dob}
                  onChange={(e) => handleInputChange('demographics', 'dob', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Sex *</label>
                <select
                  value={formData.demographics.sex}
                  onChange={(e) => handleInputChange('demographics', 'sex', e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Gender Identity</label>
                <input
                  type="text"
                  value={formData.demographics.gender_identity}
                  onChange={(e) => handleInputChange('demographics', 'gender_identity', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Preferred Pronouns</label>
                <input
                  type="text"
                  value={formData.demographics.preferred_pronouns}
                  onChange={(e) => handleInputChange('demographics', 'preferred_pronouns', e.target.value)}
                  placeholder="e.g., he/him, she/her, they/them"
                />
              </div>
              <div className="form-group full-width">
                <label>Address *</label>
                <input
                  type="text"
                  value={formData.demographics.address}
                  onChange={(e) => handleInputChange('demographics', 'address', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>City *</label>
                <input
                  type="text"
                  value={formData.demographics.city}
                  onChange={(e) => handleInputChange('demographics', 'city', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>State *</label>
                <input
                  type="text"
                  value={formData.demographics.state}
                  onChange={(e) => handleInputChange('demographics', 'state', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>ZIP Code *</label>
                <input
                  type="text"
                  value={formData.demographics.zip}
                  onChange={(e) => handleInputChange('demographics', 'zip', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Phone *</label>
                <input
                  type="tel"
                  value={formData.demographics.phone}
                  onChange={(e) => handleInputChange('demographics', 'phone', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={formData.demographics.email}
                  onChange={(e) => handleInputChange('demographics', 'email', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  value={formData.demographics.emergency_contact_name}
                  onChange={(e) => handleInputChange('demographics', 'emergency_contact_name', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={formData.demographics.emergency_contact_phone}
                  onChange={(e) => handleInputChange('demographics', 'emergency_contact_phone', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'medications':
        return (
          <div className="intake-step">
            <h2 className="heading-2">Current Medications</h2>
            <div className="quick-actions">
              <button
                type="button"
                className="btn-quick-action"
                onClick={() => handleQuickAction('None', 'medications')}
              >
                <Check size={16} /> None
              </button>
            </div>
            
            <div className="medications-list">
              {formData.medications.map((med, index) => (
                <div key={index} className="medication-item">
                  <div className="medication-photo">
                    {photos.medications[`med_${index}`] ? (
                      <img src={photos.medications[`med_${index}`]} alt="Medication" />
                    ) : (
                      <div className="photo-placeholder">
                        <button
                          type="button"
                          className="btn-camera"
                          onClick={() => capturePhoto(`med_${index}`, 'medications')}
                        >
                          <Camera size={24} /> Take Photo
                        </button>
                        <input
                          ref={fileInputRefs.medication}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(e, `med_${index}`, 'medications')}
                        />
                        <button
                          type="button"
                          className="btn-upload"
                          onClick={() => fileInputRefs.medication.current?.click()}
                        >
                          <Upload size={16} /> Upload
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="medication-details">
                    <input
                      type="text"
                      placeholder="Medication name"
                      value={med.name}
                      onChange={(e) => {
                        const updated = [...formData.medications];
                        updated[index].name = e.target.value;
                        setFormData(prev => ({ ...prev, medications: updated }));
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={med.dosage}
                      onChange={(e) => {
                        const updated = [...formData.medications];
                        updated[index].dosage = e.target.value;
                        setFormData(prev => ({ ...prev, medications: updated }));
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={med.frequency}
                      onChange={(e) => {
                        const updated = [...formData.medications];
                        updated[index].frequency = e.target.value;
                        setFormData(prev => ({ ...prev, medications: updated }));
                      }}
                    />
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleArrayRemove('medications', index)}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="btn-add"
                onClick={() => handleArrayAdd('medications', {
                  name: '',
                  dosage: '',
                  frequency: '',
                  prescriber: '',
                  indication: ''
                })}
              >
                + Add Medication
              </button>
            </div>
          </div>
        );

      case 'allergies':
        return (
          <div className="intake-step">
            <h2 className="heading-2">Allergies</h2>
            <div className="quick-actions">
              <button
                type="button"
                className="btn-quick-action"
                onClick={() => handleQuickAction('NKDA', 'allergies')}
              >
                <Check size={16} /> NKDA (No Known Drug Allergies)
              </button>
            </div>
            
            <div className="allergies-list">
              {formData.allergies.map((allergy, index) => (
                <div key={index} className="allergy-item">
                  <input
                    type="text"
                    placeholder="Allergen"
                    value={allergy.allergen}
                    onChange={(e) => {
                      const updated = [...formData.allergies];
                      updated[index].allergen = e.target.value;
                      setFormData(prev => ({ ...prev, allergies: updated }));
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Reaction"
                    value={allergy.reaction}
                    onChange={(e) => {
                      const updated = [...formData.allergies];
                      updated[index].reaction = e.target.value;
                      setFormData(prev => ({ ...prev, allergies: updated }));
                    }}
                  />
                  <select
                    value={allergy.severity}
                    onChange={(e) => {
                      const updated = [...formData.allergies];
                      updated[index].severity = e.target.value;
                      setFormData(prev => ({ ...prev, allergies: updated }));
                    }}
                  >
                    <option value="">Severity</option>
                    <option value="mild">Mild</option>
                    <option value="moderate">Moderate</option>
                    <option value="severe">Severe</option>
                  </select>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => handleArrayRemove('allergies', index)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-add"
                onClick={() => handleArrayAdd('allergies', {
                  allergen: '',
                  reaction: '',
                  severity: ''
                })}
              >
                + Add Allergy
              </button>
            </div>
          </div>
        );

      case 'insurance':
        return (
          <div className="intake-step">
            <h2 className="heading-2">Insurance Information</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Insurance Carrier *</label>
                <input
                  type="text"
                  value={formData.insurance.carrier}
                  onChange={(e) => handleInputChange('insurance', 'carrier', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Policy Number *</label>
                <input
                  type="text"
                  value={formData.insurance.policy_number}
                  onChange={(e) => handleInputChange('insurance', 'policy_number', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Group Number</label>
                <input
                  type="text"
                  value={formData.insurance.group_number}
                  onChange={(e) => handleInputChange('insurance', 'group_number', e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Subscriber Name *</label>
                <input
                  type="text"
                  value={formData.insurance.subscriber_name}
                  onChange={(e) => handleInputChange('insurance', 'subscriber_name', e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Subscriber DOB</label>
                <input
                  type="date"
                  value={formData.insurance.subscriber_dob}
                  onChange={(e) => handleInputChange('insurance', 'subscriber_dob', e.target.value)}
                />
              </div>
            </div>
            
            <div className="photo-upload-section">
              <h3 className="heading-3">Insurance Card Photos *</h3>
              <div className="photo-grid">
                <div className="photo-upload-item">
                  <label>Front of Card</label>
                  {photos.insurance.front ? (
                    <div className="photo-preview">
                      <img src={photos.insurance.front} alt="Insurance front" />
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={() => {
                          setPhotos(prev => ({
                            ...prev,
                            insurance: { ...prev.insurance, front: null }
                          }));
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="photo-upload-buttons">
                      <button
                        type="button"
                        className="btn-camera"
                        onClick={() => capturePhoto('front', 'insurance')}
                      >
                        <Camera size={24} /> Take Photo
                      </button>
                      <input
                        ref={fileInputRefs.insuranceFront}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'front', 'insurance')}
                      />
                      <button
                        type="button"
                        className="btn-upload"
                        onClick={() => fileInputRefs.insuranceFront.current?.click()}
                      >
                        <Upload size={16} /> Upload
                      </button>
                    </div>
                  )}
                </div>
                <div className="photo-upload-item">
                  <label>Back of Card</label>
                  {photos.insurance.back ? (
                    <div className="photo-preview">
                      <img src={photos.insurance.back} alt="Insurance back" />
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={() => {
                          setPhotos(prev => ({
                            ...prev,
                            insurance: { ...prev.insurance, back: null }
                          }));
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="photo-upload-buttons">
                      <button
                        type="button"
                        className="btn-camera"
                        onClick={() => capturePhoto('back', 'insurance')}
                      >
                        <Camera size={24} /> Take Photo
                      </button>
                      <input
                        ref={fileInputRefs.insuranceBack}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'back', 'insurance')}
                      />
                      <button
                        type="button"
                        className="btn-upload"
                        onClick={() => fileInputRefs.insuranceBack.current?.click()}
                      >
                        <Upload size={16} /> Upload
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'identification':
        return (
          <div className="intake-step">
            <h2 className="heading-2">Identification Verification</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>ID Type *</label>
                <select
                  value={formData.identification.id_type}
                  onChange={(e) => handleInputChange('identification', 'id_type', e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option value="driver_license">Driver's License</option>
                  <option value="passport">Passport</option>
                </select>
              </div>
              <div className="form-group">
                <label>ID Number *</label>
                <input
                  type="text"
                  value={formData.identification.id_number}
                  onChange={(e) => handleInputChange('identification', 'id_number', e.target.value)}
                  required
                />
              </div>
              {formData.identification.id_type === 'driver_license' && (
                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    value={formData.identification.id_state}
                    onChange={(e) => handleInputChange('identification', 'id_state', e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="form-group">
                <label>Expiration Date</label>
                <input
                  type="date"
                  value={formData.identification.id_expiration}
                  onChange={(e) => handleInputChange('identification', 'id_expiration', e.target.value)}
                />
              </div>
            </div>
            
            <div className="photo-upload-section">
              <h3 className="heading-3">ID Photos *</h3>
              <div className="photo-grid">
                <div className="photo-upload-item">
                  <label>Front of ID</label>
                  {photos.identification.front ? (
                    <div className="photo-preview">
                      <img src={photos.identification.front} alt="ID front" />
                      <button
                        type="button"
                        className="btn-remove-photo"
                        onClick={() => {
                          setPhotos(prev => ({
                            ...prev,
                            identification: { ...prev.identification, front: null }
                          }));
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="photo-upload-buttons">
                      <button
                        type="button"
                        className="btn-camera"
                        onClick={() => capturePhoto('front', 'identification')}
                      >
                        <Camera size={24} /> Take Photo
                      </button>
                      <input
                        ref={fileInputRefs.idFront}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleFileUpload(e, 'front', 'identification')}
                      />
                      <button
                        type="button"
                        className="btn-upload"
                        onClick={() => fileInputRefs.idFront.current?.click()}
                      >
                        <Upload size={16} /> Upload
                      </button>
                    </div>
                  )}
                </div>
                {formData.identification.id_type === 'driver_license' && (
                  <div className="photo-upload-item">
                    <label>Back of ID</label>
                    {photos.identification.back ? (
                      <div className="photo-preview">
                        <img src={photos.identification.back} alt="ID back" />
                        <button
                          type="button"
                          className="btn-remove-photo"
                          onClick={() => {
                            setPhotos(prev => ({
                              ...prev,
                              identification: { ...prev.identification, back: null }
                            }));
                          }}
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="photo-upload-buttons">
                        <button
                          type="button"
                          className="btn-camera"
                          onClick={() => capturePhoto('back', 'identification')}
                        >
                          <Camera size={24} /> Take Photo
                        </button>
                        <input
                          ref={fileInputRefs.idBack}
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(e, 'back', 'identification')}
                        />
                        <button
                          type="button"
                          className="btn-upload"
                          onClick={() => fileInputRefs.idBack.current?.click()}
                        >
                          <Upload size={16} /> Upload
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return <div>Step not implemented yet</div>;
    }
  };

  return (
    <div className="intake-form-container">
      <div className="intake-form-header">
        <h1 className="heading-1">Medical Intake Form</h1>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="progress-text">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
        </p>
      </div>

      <div className="intake-form-content">
        {renderStep()}
      </div>

      <div className="intake-form-actions">
        {currentStep > 0 && (
          <button type="button" className="btn-secondary" onClick={handlePrevious}>
            Previous
          </button>
        )}
        {currentStep < steps.length - 1 ? (
          <button type="button" className="btn-primary" onClick={handleNext}>
            Next
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={handleSubmit}>
            Submit
          </button>
        )}
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default IntakeForm;

