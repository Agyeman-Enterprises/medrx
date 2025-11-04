import React, { useState, useEffect, useRef } from 'react';
import '../styles/Questionnaire.css';
import { AlertCircle, CheckCircle } from 'lucide-react';

const MedicalQuestionnaire = ({ serviceCategory, onComplete, onCancel }) => {
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isEligible, setIsEligible] = useState(true);
  const redirectRef = useRef(false);

  // Base medical questions for all services
  const baseQuestions = [
    {
      id: 'age',
      question: 'Are you 18 years of age or older?',
      type: 'yesno',
      required: true,
      disqualifyIf: 'no'
    },
    {
      id: 'pregnant',
      question: 'Are you currently pregnant, planning to become pregnant, or breastfeeding?',
      type: 'yesno',
      required: true,
      disqualifyIf: 'yes'
    },
    {
      id: 'allergies',
      question: 'Do you have any known drug allergies?',
      type: 'textarea',
      required: true,
      placeholder: 'List any known drug allergies, or write "None"'
    },
    {
      id: 'medications',
      question: 'Are you currently taking any medications?',
      type: 'textarea',
      required: true,
      placeholder: 'List all current medications, or write "None"'
    },
    {
      id: 'chronic_conditions',
      question: 'Do you have any chronic medical conditions?',
      type: 'textarea',
      required: true,
      placeholder: 'e.g., diabetes, hypertension, thyroid disease, or write "None"'
    }
  ];

  // GLP-1 specific screening questions
  const glp1Questions = [
    {
      id: 'thyroid_cancer',
      question: 'Do you or any family members have a history of medullary thyroid carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)?',
      type: 'yesno',
      required: true,
      disqualifyIf: 'yes',
      explanation: 'GLP-1 medications are contraindicated with personal or family history of MTC or MEN 2'
    },
    {
      id: 'pancreatitis',
      question: 'Do you have a history of pancreatitis?',
      type: 'yesno',
      required: true,
      disqualifyIf: 'yes',
      explanation: 'History of pancreatitis is a contraindication for GLP-1 therapy'
    },
    {
      id: 'kidney_disease',
      question: 'Do you have severe kidney disease or are you on dialysis?',
      type: 'yesno',
      required: true,
      disqualifyIf: 'yes'
    },
    {
      id: 'gastroparesis',
      question: 'Do you have a history of severe gastrointestinal disease or gastroparesis?',
      type: 'yesno',
      required: true,
      disqualifyIf: 'yes',
      explanation: 'Severe GI disease or gastroparesis is a contraindication for GLP-1 therapy'
    },
    {
      id: 'type1_diabetes',
      question: 'Do you have Type 1 Diabetes?',
      type: 'yesno',
      required: true,
      disqualifyIf: 'yes',
      explanation: 'GLP-1 medications are not approved for Type 1 Diabetes'
    },
    {
      id: 'allergic_reaction',
      question: 'Have you ever had a severe allergic reaction to semaglutide, tirzepatide, or any GLP-1 medication?',
      type: 'yesno',
      required: true,
      disqualifyIf: 'yes',
      explanation: 'Previous severe allergic reactions to GLP-1 medications are a contraindication'
    },
    {
      id: 'bmi',
      question: 'What is your current weight and height?',
      type: 'text',
      required: true,
      placeholder: 'e.g., 180 lbs, 5 ft 6 in'
    },
    {
      id: 'weight_loss_goal',
      question: 'What is your weight loss goal?',
      type: 'textarea',
      required: true,
      placeholder: 'Describe your weight loss goals and any previous attempts'
    }
  ];

  const questions = serviceCategory === 'weight-loss' 
    ? [...baseQuestions, ...glp1Questions]
    : baseQuestions;

  const currentQuestion = questions[currentStep];

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);

    // Check if answer disqualifies patient - ONLY for GLP-1 (weight-loss category)
    if (serviceCategory === 'weight-loss' && currentQuestion.disqualifyIf && value === currentQuestion.disqualifyIf) {
      setIsEligible(false);
    } else {
      // Reset eligibility if they change to an eligible answer
      setIsEligible(true);
    }
  };

  const handleNext = () => {
    // Validate answer
    if (!answers[currentQuestion.id] || answers[currentQuestion.id].trim() === '') {
      alert('Please answer the question before continuing');
      return;
    }

    // If ineligible, show disqualification (but don't block navigation if they want to continue)
    // Actually, we should show the disqualification screen, so return early
    if (!isEligible && serviceCategory === 'weight-loss') {
      return; // The disqualification screen will be shown
    }

    // Move to next question or complete
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete questionnaire
      onComplete(answers);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Reset eligibility when going back - check the previous question's answer
      const prevQuestion = questions[currentStep - 1];
      if (prevQuestion && prevQuestion.disqualifyIf) {
        const prevAnswer = answers[prevQuestion.id];
        if (prevAnswer === prevQuestion.disqualifyIf) {
          setIsEligible(false);
        } else {
          setIsEligible(true);
        }
      } else {
        setIsEligible(true);
      }
    }
  };

  
  // Auto-advance for text/textarea when Enter is pressed or on blur if filled
  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      e.preventDefault();
      const value = e.target.value.trim();
      handleAnswer(value);
      setTimeout(() => {
        if (currentStep < questions.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          onComplete({ ...answers, [currentQuestion.id]: value });
        }
      }, 300);
    }
  };
  
  const handleTextBlur = (e) => {
    const value = e.target.value.trim();
    if (value) {
      handleAnswer(value);
      // Auto-advance after a short delay
      setTimeout(() => {
        if (currentStep < questions.length - 1) {
          setCurrentStep(currentStep + 1);
        } else {
          onComplete({ ...answers, [currentQuestion.id]: value });
        }
      }, 800); // Delay to give user time to see their input
    }
  };

  // Quick action buttons for allergies and medications
  const handleQuickAction = (action, questionId) => {
    const value = action === 'NKDA' ? 'NKDA (No Known Drug Allergies)' : 'None';
    handleAnswer(value);
    // Auto-advance after a short delay
    setTimeout(() => {
      if (currentStep < questions.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete({ ...answers, [questionId]: value });
      }
    }, 500);
  };

  // Auto-redirect to BookADoc2U if ineligible - only redirect when user explicitly answers a disqualifying question
  // Don't redirect on hover or other interactions
  useEffect(() => {
    // Only redirect if we have a clear disqualifying answer AND we haven't redirected yet
    // This prevents redirect on hover or other unintended triggers
    if (!redirectRef.current &&
        serviceCategory === 'weight-loss' && 
        !isEligible && 
        currentQuestion && 
        currentQuestion.disqualifyIf &&
        answers[currentQuestion.id] === currentQuestion.disqualifyIf) {
      redirectRef.current = true;
      // Small delay to show the disqualification message first
      const redirectTimer = setTimeout(() => {
        window.location.href = 'https://bookadoc2u.com';
      }, 2000);
      
      return () => clearTimeout(redirectTimer);
    }
  }, [serviceCategory, isEligible, answers, currentQuestion?.id]);

  // Show disqualification ONLY for GLP-1 (weight-loss) services - redirect to BookADoc2U
  if (serviceCategory === 'weight-loss' && !isEligible && answers[currentQuestion.id] === currentQuestion.disqualifyIf) {
    return (
      <div className="questionnaire-container">
        <div className="questionnaire-card disqualification">
          <div className="disqualification-icon">
            <AlertCircle size={48} color="#dc2626" />
          </div>
          <h2 className="heading-2">GLP-1 Therapy Not Recommended</h2>
          <p className="body-medium">
            Based on your medical history, GLP-1 medications may not be appropriate at this time. 
            {currentQuestion.explanation && ` ${currentQuestion.explanation}.`}
          </p>
          <div className="alternative-offer">
            <h3 className="heading-2" style={{ marginTop: '2rem', marginBottom: '1rem' }}>
              Next Steps
            </h3>
            <p className="body-medium" style={{ marginBottom: '1.5rem' }}>
              Based on your medical history, GLP-1 medications may not be appropriate for you at this time. 
              However, you should book an appointment with our doctor to discuss your options further and explore 
              alternative treatment approaches that may be suitable for your situation.
            </p>
            <p className="body-medium" style={{ marginBottom: '1.5rem', color: 'var(--accent-purple)' }}>
              Redirecting you to BookADoc2U to schedule a medical appointment...
            </p>
          </div>
          <div className="questionnaire-actions">
            <a 
              href="https://bookadoc2u.com" 
              className="btn-primary"
              style={{ textDecoration: 'none', display: 'inline-block' }}
              onClick={(e) => {
                e.preventDefault();
                window.location.href = 'https://bookadoc2u.com';
              }}
            >
              Book Appointment at BookADoc2U
            </a>
            <button onClick={onCancel} className="btn-secondary">
              Return to Service Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="questionnaire-container">
      <div className="questionnaire-card">
        <div className="questionnaire-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="progress-text caption">
            Question {currentStep + 1} of {questions.length}
          </span>
        </div>

        <h2 className="heading-2 question-title">{currentQuestion.question}</h2>

        {currentQuestion.required && (
          <p className="caption" style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            * Required
          </p>
        )}

        <div className="answer-section">
          {/* Quick action buttons for allergies */}
          {currentQuestion.id === 'allergies' && (
            <div className="quick-actions" style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                className="btn-quick-action"
                onClick={() => handleQuickAction('NKDA', 'allergies')}
              >
                <CheckCircle size={16} /> NKDA
              </button>
            </div>
          )}

          {/* Quick action buttons for medications */}
          {currentQuestion.id === 'medications' && (
            <div className="quick-actions" style={{ marginBottom: '1rem' }}>
              <button
                type="button"
                className="btn-quick-action"
                onClick={() => handleQuickAction('None', 'medications')}
              >
                <CheckCircle size={16} /> None
              </button>
            </div>
          )}

          {currentQuestion.type === 'yesno' && (
            <div className="yesno-buttons">
              <button
                type="button"
                className={`yesno-btn ${answers[currentQuestion.id] === 'yes' ? 'active' : ''}`}
                onClick={() => {
                  const value = 'yes';
                  handleAnswer(value);
                  
                  // Auto-advance after a short delay to show selection
                  setTimeout(() => {
                    // Check if answer disqualifies - if so, show disqualification screen
                    if (serviceCategory === 'weight-loss' && currentQuestion.disqualifyIf && value === currentQuestion.disqualifyIf) {
                      // Don't advance - disqualification screen will show
                      return;
                    }
                    
                    // Validate and advance
                    if (currentStep < questions.length - 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      // Complete questionnaire
                      onComplete({ ...answers, [currentQuestion.id]: value });
                    }
                  }, 500);
                }}
              >
                <CheckCircle size={20} />
                Yes
              </button>
              <button
                type="button"
                className={`yesno-btn ${answers[currentQuestion.id] === 'no' ? 'active' : ''}`}
                onClick={() => {
                  const value = 'no';
                  handleAnswer(value);
                  
                  // Auto-advance after a short delay to show selection
                  setTimeout(() => {
                    // Check if answer disqualifies - if so, show disqualification screen
                    if (serviceCategory === 'weight-loss' && currentQuestion.disqualifyIf && value === currentQuestion.disqualifyIf) {
                      // Don't advance - disqualification screen will show
                      return;
                    }
                    
                    // Validate and advance
                    if (currentStep < questions.length - 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      // Complete questionnaire
                      onComplete({ ...answers, [currentQuestion.id]: value });
                    }
                  }, 500);
                }}
              >
                <CheckCircle size={20} />
                No
              </button>
            </div>
          )}

          {currentQuestion.type === 'text' && (
            <input
              type="text"
              className="form-input"
              placeholder={currentQuestion.placeholder}
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              onKeyPress={handleTextSubmit}
              onBlur={handleTextBlur}
            />
          )}

          {currentQuestion.type === 'textarea' && (
            <textarea
              className="form-textarea"
              placeholder={currentQuestion.placeholder}
              rows={4}
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
              onKeyPress={handleTextSubmit}
              onBlur={handleTextBlur}
            />
          )}
        </div>

        <div className="questionnaire-actions">
          {currentStep > 0 && (
            <button 
              type="button"
              onClick={handlePrevious} 
              className="btn-secondary"
            >
              ← Previous
            </button>
          )}
          <button 
            type="button"
            onClick={onCancel} 
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalQuestionnaire;
