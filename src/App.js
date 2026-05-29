import React, { useState, useEffect } from 'react';
import './App.css';
import BlindEditor from './components/BlindEditor';
import OutputDisplay from './components/OutputDisplay';
import LanguageSelector from './components/LanguageSelector';
import CompetitionTimer from './components/CompetitionTimer';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import UserProfile from './components/UserProfile';
import Questions from './components/Questions';
import Leaderboard from './components/Leaderboard';
import CompilerService from './services/CompilerService';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [executionTime, setExecutionTime] = useState(null);
  const [isCompetitionActive, setIsCompetitionActive] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [currentView, setCurrentView] = useState('questions'); // 'questions', 'editor', or 'leaderboard'

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

    // Initialize demo users if none exist
    const existingUsers = localStorage.getItem('users');
    if (!existingUsers) {
      const demoUsers = [
        {
          id: 1,
          username: 'admin',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          username: 'user',
          email: 'user@example.com',
          password: 'user123',
          role: 'user',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('users', JSON.stringify(demoUsers));
    }
  }, []);

  const handleLogin = (user) => {
    setCurrentUser(user);
    
    // Save competition history for user
    if (user.role === 'user') {
      const history = JSON.parse(localStorage.getItem(`history_${user.id}`) || '[]');
      // You can update this when competitions are completed
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    // Reset competition state
    setIsCompetitionActive(false);
    setOutput('');
    setError('');
  };

  const handleRun = async (code, language) => {
    setIsLoading(true);
    setOutput('');
    setError('');
    setExecutionTime(null);

    try {
      const result = await CompilerService.compileAndRun(code, language);
      setOutput(result.output);
      setError(result.error);
      setExecutionTime(result.executionTime);
      
      // Save to user history if logged in
      if (currentUser && currentUser.role === 'user') {
        const history = JSON.parse(localStorage.getItem(`history_${currentUser.id}`) || '[]');
        const newEntry = {
          date: new Date().toISOString(),
          language: language,
          status: error ? 'failed' : 'completed',
          score: error ? 0 : Math.floor(Math.random() * 30) + 70, // Mock score
          title: 'Practice Session'
        };
        history.unshift(newEntry);
        localStorage.setItem(`history_${currentUser.id}`, JSON.stringify(history));
      }
    } catch (err) {
      setError(`Unexpected error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleCompetitionComplete = () => {
    setIsCompetitionActive(false);
    
    if (currentUser && currentUser.role === 'user') {
      // Save competition to history
      const history = JSON.parse(localStorage.getItem(`history_${currentUser.id}`) || '[]');
      const competitionEntry = {
        date: new Date().toISOString(),
        language: selectedLanguage,
        status: 'completed',
        score: Math.floor(Math.random() * 40) + 60, // Mock score
        title: 'Blind Coding Competition'
      };
      history.unshift(competitionEntry);
      localStorage.setItem(`history_${currentUser.id}`, JSON.stringify(history));
    }
    
    alert('Time\'s up! Competition has ended.');
  };

  const startCompetition = () => {
    setIsCompetitionActive(true);
    setOutput('');
    setError('');
  };

  const handleSelectQuestion = (question) => {
    setSelectedQuestion(question);
    setSelectedLanguage(question.language);
    setCurrentView('editor');
  };

  const handleBackToQuestions = () => {
    setCurrentView('questions');
    setSelectedQuestion(null);
    setOutput('');
    setError('');
  };

  // If not logged in, show login screen
  if (!currentUser) {
    return <Login onLogin={handleLogin} onRegister={handleLogin} />;
  }

  // If admin, show admin dashboard
  if (currentUser.role === 'admin') {
    return <AdminDashboard currentUser={currentUser} onLogout={handleLogout} />;
  }

  // If user, show questions or editor based on current view
  return (
    <div className="App">
      <header className="App-header">
        <div className="header-content">
          <h1>Blind Coding Competition</h1>
          <p>Code without seeing your code - Test your programming skills!</p>
        </div>
        <div className="user-header">
          <span>Welcome, {currentUser.username}</span>
          {currentView === 'editor' && (
            <button onClick={handleBackToQuestions} className="profile-btn">
              Back to Questions
            </button>
          )}
          {currentView === 'questions' && (
            <button onClick={() => setCurrentView('leaderboard')} className="profile-btn">
              Leaderboard
            </button>
          )}
          {currentView === 'leaderboard' && (
            <button onClick={() => setCurrentView('questions')} className="profile-btn">
              Questions
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </header>
      
      <main className="App-main">
        {currentView === 'questions' ? (
          <Questions 
            onSelectQuestion={handleSelectQuestion}
            selectedLanguage={selectedLanguage}
          />
        ) : currentView === 'leaderboard' ? (
          <Leaderboard currentUser={currentUser} />
        ) : (
          <>
            {selectedQuestion && (
              <div className="question-info-bar">
                <h3>{selectedQuestion.title}</h3>
                <p>{selectedQuestion.description}</p>
                <span className="question-meta">
                  {selectedQuestion.difficulty} | {selectedQuestion.points} points | {Math.floor(selectedQuestion.timeLimit / 60)} min
                </span>
              </div>
            )}
            
            <div className="competition-controls">
              <button 
                onClick={startCompetition} 
                className="start-competition-btn"
                disabled={isCompetitionActive}
              >
                {isCompetitionActive ? 'Competition in Progress' : 'Start Competition'}
              </button>
              
              {isCompetitionActive && (
                <CompetitionTimer 
                  isActive={isCompetitionActive}
                  onComplete={handleCompetitionComplete}
                  timeLimit={selectedQuestion?.timeLimit || 1800}
                />
              )}
            </div>

            <LanguageSelector 
              selectedLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
            />

            <BlindEditor 
              onRun={handleRun}
              language={selectedLanguage}
            />

            <OutputDisplay 
              output={output}
              error={error}
              isLoading={isLoading}
              executionTime={executionTime}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
