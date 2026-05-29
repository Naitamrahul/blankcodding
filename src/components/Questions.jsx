import React, { useState, useEffect } from 'react';
import './Questions.css';

const Questions = ({ onSelectQuestion, selectedLanguage }) => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    const storedQuestions = JSON.parse(localStorage.getItem('questions') || '[]');
    setQuestions(storedQuestions);
  };

  const filteredQuestions = questions.filter(q => {
    if (filter === 'all') return true;
    if (filter === 'easy') return q.difficulty === 'Easy';
    if (filter === 'medium') return q.difficulty === 'Medium';
    if (filter === 'hard') return q.difficulty === 'Hard';
    return true;
  });

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
    onSelectQuestion(question);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#4caf50';
      case 'Medium': return '#ffc107';
      case 'Hard': return '#f44336';
      default: return '#666';
    }
  };

  const getLanguageIcon = (language) => {
    switch (language) {
      case 'javascript': return 'JS';
      case 'python': return 'PY';
      case 'java': return 'JV';
      default: return language.toUpperCase().substring(0, 2);
    }
  };

  return (
    <div className="questions-container">
      <div className="questions-header">
        <h2>Choose a Challenge</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'easy' ? 'active' : ''}`}
            onClick={() => setFilter('easy')}
          >
            Easy
          </button>
          <button 
            className={`filter-btn ${filter === 'medium' ? 'active' : ''}`}
            onClick={() => setFilter('medium')}
          >
            Medium
          </button>
          <button 
            className={`filter-btn ${filter === 'hard' ? 'active' : ''}`}
            onClick={() => setFilter('hard')}
          >
            Hard
          </button>
        </div>
      </div>

      <div className="questions-grid">
        {filteredQuestions.map(question => (
          <div 
            key={question.id}
            className={`question-card ${selectedQuestion?.id === question.id ? 'selected' : ''}`}
            onClick={() => handleSelectQuestion(question)}
          >
            <div className="question-header">
              <h3>{question.title}</h3>
              <div className="question-meta">
                <span 
                  className="difficulty-badge"
                  style={{ backgroundColor: getDifficultyColor(question.difficulty) }}
                >
                  {question.difficulty}
                </span>
                <span className="language-badge">
                  {getLanguageIcon(question.language)}
                </span>
                <span className="points-badge">
                  {question.points} pts
                </span>
              </div>
            </div>
            
            <div className="question-description">
              <p>{question.description}</p>
            </div>
            
            <div className="question-examples">
              <h4>Examples:</h4>
              {question.examples.map((example, index) => (
                <div key={index} className="example">
                  <div className="example-input">
                    <strong>Input:</strong> {example.input || 'None'}
                  </div>
                  <div className="example-output">
                    <strong>Output:</strong> {example.output}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="question-footer">
              <span className="time-limit">
                Time: {Math.floor(question.timeLimit / 60)} min
              </span>
              <button className="select-btn">
                {selectedQuestion?.id === question.id ? 'Selected' : 'Select'}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {selectedQuestion && (
        <div className="question-actions">
          <button 
            onClick={() => onSelectQuestion(selectedQuestion)}
            className="start-coding-btn"
          >
            Start Coding
          </button>
        </div>
      )}
    </div>
  );
};

export default Questions;
