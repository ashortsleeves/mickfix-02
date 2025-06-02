import React, { useState } from 'react';
import './FollowUpQuestion.css';

interface FollowUpQuestionProps {
  isAnalyzing: boolean;
  onSubmit: (question: string) => void;
}

const FollowUpQuestion: React.FC<FollowUpQuestionProps> = ({ isAnalyzing, onSubmit }) => {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      onSubmit(question.trim());
      setQuestion('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="follow-up-container">
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Do you have any further questions?"
        disabled={isAnalyzing}
        className="follow-up-textarea"
        rows={3}
      />
      <button 
        type="submit" 
        disabled={isAnalyzing || !question.trim()}
        className="follow-up-button"
      >
        {isAnalyzing ? 'Analyzing...' : 'Ask Follow-up Question'}
      </button>
    </form>
  );
};

export default FollowUpQuestion; 