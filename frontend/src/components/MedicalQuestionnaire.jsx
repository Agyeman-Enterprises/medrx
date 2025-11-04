import React, { useState } from 'react';
import '../styles/Questionnaire.css';
import { AlertCircle, CheckCircle } from 'lucide-react';

const MedicalQuestionnaire = ({ serviceCategory, onComplete, onCancel }) => {
  const [answers, setAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isEligible, setIsEligible] = useState(true);

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
    }
  };

  const handleNext = () => {
    if (!answers[currentQuestion.id] || answers[currentQuestion.id] === '') {
      alert('Please answer the question before continuing');
      return;
    }

    if (!isEligible) {
      // Show disqualification message
      return;
    }

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
      setIsEligible(true); // Reset eligibility when going back
    }
  };

  // Show disqualification ONLY for GLP-1 (weight-loss) services
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
            <div className="alternative-details">
              <div style={{ marginBottom: '1.5rem' }}>
                <p className="body-medium" style={{ marginBottom: '0.5rem' }}>
                  <strong>📞 Call our clinic:</strong>
                </p>
                <a 
                  href="tel:+16716892993" 
                  className="price-highlight" 
                  style={{ display: 'inline-block', textDecoration: 'none', cursor: 'pointer' }}
                >
                  +1 (671) 689-2993
                </a>
              </div>
              <p className="body-medium" style={{ marginBottom: '1rem' }}>
                <strong>Or book a medical appointment online:</strong>
              </p>
            </div>
          </div>
          <div className="questionnaire-actions">
            <a 
              href="https://bookadoc2u.com" 
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ textDecoration: 'none', display: 'inline-block' }}
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

        <div className="answer-section">
          {currentQuestion.type === 'yesno' && (
            <div className="yesno-buttons">
              <button
                className={`yesno-btn ${answers[currentQuestion.id] === 'yes' ? 'active' : ''}`}
                onClick={() => handleAnswer('yes')}
              >
                <CheckCircle size={20} />
                Yes
              </button>
              <button
                className={`yesno-btn ${answers[currentQuestion.id] === 'no' ? 'active' : ''}`}
                onClick={() => handleAnswer('no')}
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
            />
          )}

          {currentQuestion.type === 'textarea' && (
            <textarea
              className="form-textarea"
              placeholder={currentQuestion.placeholder}
              rows={4}
              value={answers[currentQuestion.id] || ''}
              onChange={(e) => handleAnswer(e.target.value)}
            />
          )}
        </div>

        <div className="questionnaire-actions">
          {currentStep > 0 && (
            <button onClick={handlePrevious} className="btn-secondary">
              Previous
            </button>
          )}
          <button onClick={handleNext} className="btn-primary">
            {currentStep < questions.length - 1 ? 'Next' : 'Complete'}
          </button>
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default MedicalQuestionnaire;
