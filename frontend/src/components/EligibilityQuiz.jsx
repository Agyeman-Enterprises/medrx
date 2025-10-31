import React, { useState } from 'react';
import { glp1EligibilityQuiz } from '../mockMedVi';
import '../styles/EligibilityQuiz.css';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';

const EligibilityQuiz = ({ onComplete, onDisqualified }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isComplete, setIsComplete] = useState(false);

  const handleAnswer = (answer) => {
    const question = glp1EligibilityQuiz[currentQuestion];
    const newAnswers = { ...answers, [question.id]: answer };
    setAnswers(newAnswers);

    // Check if answer disqualifies
    if (question.disqualifyIf && answer === question.disqualifyIf) {
      onDisqualified(question.reason);
      return;
    }

    // Move to next question or complete
    if (currentQuestion < glp1EligibilityQuiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsComplete(true);
      setTimeout(() => onComplete(newAnswers), 1000);
    }
  };

  if (isComplete) {
    return (
      <div className="quiz-container">
        <div className="quiz-card success">
          <CheckCircle size={64} color="#10b981" />
          <h2 className="heading-1">You're Eligible!</h2>
          <p className="body-large">Great news! You meet the criteria for GLP-1 therapy.</p>
          <p className="body-medium">Next: Complete voice intake for physician review.</p>
        </div>
      </div>
    );
  }

  const question = glp1EligibilityQuiz[currentQuestion];
  const progress = ((currentQuestion + 1) / glp1EligibilityQuiz.length) * 100;

  return (
    <div className="quiz-container">
      <div className="quiz-card">
        <div className="quiz-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="progress-text caption">
            Question {currentQuestion + 1} of {glp1EligibilityQuiz.length}
          </span>
        </div>

        <h2 className="heading-2 quiz-question">{question.question}</h2>

        <div className="quiz-answers">
          <button
            className="quiz-answer-btn yes"
            onClick={() => handleAnswer('yes')}
          >
            <CheckCircle size={24} />
            <span>Yes</span>
          </button>
          <button
            className="quiz-answer-btn no"
            onClick={() => handleAnswer('no')}
          >
            <XCircle size={24} />
            <span>No</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EligibilityQuiz;