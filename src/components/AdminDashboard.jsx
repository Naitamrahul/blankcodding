import React, { useState, useEffect } from 'react';
import './AdminDashboard.css';

const AdminDashboard = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('competitions');
  const [competitions, setCompetitions] = useState([]);
  const [users, setUsers] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [showCreateCompetition, setShowCreateCompetition] = useState(false);
  const [showCreateQuestion, setShowCreateQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [newCompetition, setNewCompetition] = useState({
    title: '',
    description: '',
    duration: 1800,
    startTime: '',
    languages: ['javascript', 'python', 'java']
  });
  const [newQuestion, setNewQuestion] = useState({
    title: '',
    difficulty: 'Easy',
    language: 'javascript',
    description: '',
    examples: [{ input: '', output: '' }],
    timeLimit: 300,
    points: 10
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const storedCompetitions = JSON.parse(localStorage.getItem('competitions') || '[]');
    const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const storedQuestions = JSON.parse(localStorage.getItem('questions') || '[]');
    
    // Initialize default questions if none exist
    if (storedQuestions.length === 0) {
      const defaultQuestions = [
        {
          id: 1,
          title: "Hello World",
          difficulty: "Easy",
          language: "javascript",
          description: "Write a program that prints 'Hello, World!' to the console.",
          examples: [
            {
              input: "",
              output: "Hello, World!"
            }
          ],
          timeLimit: 300,
          points: 10,
          createdBy: 'system',
          createdAt: new Date().toISOString()
        },
        {
          id: 2,
          title: "Sum of Two Numbers",
          difficulty: "Easy",
          language: "javascript",
          description: "Write a function that takes two numbers as input and returns their sum.",
          examples: [
            {
              input: "5, 3",
              output: "8"
            },
            {
              input: "10, -2",
              output: "8"
            }
          ],
          timeLimit: 600,
          points: 15,
          createdBy: 'system',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('questions', JSON.stringify(defaultQuestions));
      setQuestions(defaultQuestions);
    } else {
      setQuestions(storedQuestions);
    }
    
    setCompetitions(storedCompetitions);
    setUsers(storedUsers);
  };

  const createCompetition = () => {
    const competition = {
      id: Date.now(),
      ...newCompetition,
      createdBy: currentUser.username,
      createdAt: new Date().toISOString(),
      status: 'upcoming',
      participants: []
    };
    
    const updatedCompetitions = [...competitions, competition];
    setCompetitions(updatedCompetitions);
    localStorage.setItem('competitions', JSON.stringify(updatedCompetitions));
    
    setNewCompetition({
      title: '',
      description: '',
      duration: 1800,
      startTime: '',
      languages: ['javascript', 'python', 'java']
    });
    setShowCreateCompetition(false);
  };

  const deleteCompetition = (id) => {
    const updatedCompetitions = competitions.filter(comp => comp.id !== id);
    setCompetitions(updatedCompetitions);
    localStorage.setItem('competitions', JSON.stringify(updatedCompetitions));
  };

  const startCompetition = (id) => {
    const updatedCompetitions = competitions.map(comp => 
      comp.id === id ? { ...comp, status: 'active', startTime: new Date().toISOString() } : comp
    );
    setCompetitions(updatedCompetitions);
    localStorage.setItem('competitions', JSON.stringify(updatedCompetitions));
  };

  const endCompetition = (id) => {
    const updatedCompetitions = competitions.map(comp => 
      comp.id === id ? { ...comp, status: 'completed', endTime: new Date().toISOString() } : comp
    );
    setCompetitions(updatedCompetitions);
    localStorage.setItem('competitions', JSON.stringify(updatedCompetitions));
  };

  const deleteUser = (id) => {
    if (id === currentUser.id) {
      alert('Cannot delete your own account');
      return;
    }
    
    const updatedUsers = users.filter(user => user.id !== id);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const toggleUserRole = (id) => {
    const updatedUsers = users.map(user => 
      user.id === id ? { ...user, role: user.role === 'admin' ? 'user' : 'admin' } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
  };

  const createQuestion = () => {
    const question = {
      id: Date.now(),
      ...newQuestion,
      createdBy: currentUser.username,
      createdAt: new Date().toISOString()
    };
    
    const updatedQuestions = [...questions, question];
    setQuestions(updatedQuestions);
    localStorage.setItem('questions', JSON.stringify(updatedQuestions));
    
    setNewQuestion({
      title: '',
      difficulty: 'Easy',
      language: 'javascript',
      description: '',
      examples: [{ input: '', output: '' }],
      timeLimit: 300,
      points: 10
    });
    setShowCreateQuestion(false);
  };

  const updateQuestion = () => {
    const updatedQuestions = questions.map(q => 
      q.id === editingQuestion.id ? { ...editingQuestion, updatedBy: currentUser.username, updatedAt: new Date().toISOString() } : q
    );
    setQuestions(updatedQuestions);
    localStorage.setItem('questions', JSON.stringify(updatedQuestions));
    
    setEditingQuestion(null);
    setShowCreateQuestion(false);
  };

  const deleteQuestion = (id) => {
    const updatedQuestions = questions.filter(q => q.id !== id);
    setQuestions(updatedQuestions);
    localStorage.setItem('questions', JSON.stringify(updatedQuestions));
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setShowCreateQuestion(true);
  };

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <div className="header-content">
          <h1>Admin Dashboard</h1>
          <div className="user-info">
            <span>Welcome, {currentUser.username}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="admin-content">
        <nav className="admin-nav">
          <button 
            className={`nav-btn ${activeTab === 'competitions' ? 'active' : ''}`}
            onClick={() => setActiveTab('competitions')}
          >
            Competitions
          </button>
          <button 
            className={`nav-btn ${activeTab === 'questions' ? 'active' : ''}`}
            onClick={() => setActiveTab('questions')}
          >
            Questions
          </button>
          <button 
            className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button 
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            Analytics
          </button>
        </nav>

        <main className="admin-main">
          {activeTab === 'competitions' && (
            <div className="competitions-section">
              <div className="section-header">
                <h2>Competitions Management</h2>
                <button 
                  onClick={() => setShowCreateCompetition(true)}
                  className="create-btn"
                >
                  Create Competition
                </button>
              </div>

              {showCreateCompetition && (
                <div className="create-competition-form">
                  <h3>Create New Competition</h3>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={newCompetition.title}
                      onChange={(e) => setNewCompetition({...newCompetition, title: e.target.value})}
                      placeholder="Competition title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newCompetition.description}
                      onChange={(e) => setNewCompetition({...newCompetition, description: e.target.value})}
                      placeholder="Competition description"
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration (seconds)</label>
                    <input
                      type="number"
                      value={newCompetition.duration}
                      onChange={(e) => setNewCompetition({...newCompetition, duration: parseInt(e.target.value)})}
                      min="60"
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="datetime-local"
                      value={newCompetition.startTime}
                      onChange={(e) => setNewCompetition({...newCompetition, startTime: e.target.value})}
                    />
                  </div>
                  <div className="form-actions">
                    <button onClick={createCompetition} className="save-btn">Create</button>
                    <button onClick={() => setShowCreateCompetition(false)} className="cancel-btn">Cancel</button>
                  </div>
                </div>
              )}

              <div className="competitions-list">
                {competitions.map(comp => (
                  <div key={comp.id} className="competition-card">
                    <div className="competition-info">
                      <h3>{comp.title}</h3>
                      <p>{comp.description}</p>
                      <div className="competition-meta">
                        <span className={`status ${comp.status}`}>{comp.status}</span>
                        <span>Duration: {Math.floor(comp.duration / 60)} minutes</span>
                        <span>Participants: {comp.participants.length}</span>
                      </div>
                    </div>
                    <div className="competition-actions">
                      {comp.status === 'upcoming' && (
                        <button onClick={() => startCompetition(comp.id)} className="start-btn">
                          Start
                        </button>
                      )}
                      {comp.status === 'active' && (
                        <button onClick={() => endCompetition(comp.id)} className="end-btn">
                          End
                        </button>
                      )}
                      <button onClick={() => deleteCompetition(comp.id)} className="delete-btn">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="questions-section">
              <div className="section-header">
                <h2>Questions Management</h2>
                <button 
                  onClick={() => {
                    setEditingQuestion(null);
                    setShowCreateQuestion(true);
                  }}
                  className="create-btn"
                >
                  Create Question
                </button>
              </div>

              {showCreateQuestion && (
                <div className="create-question-form">
                  <h3>{editingQuestion ? 'Edit Question' : 'Create New Question'}</h3>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={editingQuestion ? editingQuestion.title : newQuestion.title}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({...editingQuestion, title: e.target.value});
                        } else {
                          setNewQuestion({...newQuestion, title: e.target.value});
                        }
                      }}
                      placeholder="Question title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select
                      value={editingQuestion ? editingQuestion.difficulty : newQuestion.difficulty}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({...editingQuestion, difficulty: e.target.value});
                        } else {
                          setNewQuestion({...newQuestion, difficulty: e.target.value});
                        }
                      }}
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Language</label>
                    <select
                      value={editingQuestion ? editingQuestion.language : newQuestion.language}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({...editingQuestion, language: e.target.value});
                        } else {
                          setNewQuestion({...newQuestion, language: e.target.value});
                        }
                      }}
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="python">Python</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="c">C</option>
                      <option value="csharp">C#</option>
                      <option value="ruby">Ruby</option>
                      <option value="php">PHP</option>
                      <option value="go">Go</option>
                      <option value="rust">Rust</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={editingQuestion ? editingQuestion.description : newQuestion.description}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({...editingQuestion, description: e.target.value});
                        } else {
                          setNewQuestion({...newQuestion, description: e.target.value});
                        }
                      }}
                      placeholder="Question description"
                    />
                  </div>
                  <div className="form-group">
                    <label>Time Limit (seconds)</label>
                    <input
                      type="number"
                      value={editingQuestion ? editingQuestion.timeLimit : newQuestion.timeLimit}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({...editingQuestion, timeLimit: parseInt(e.target.value)});
                        } else {
                          setNewQuestion({...newQuestion, timeLimit: parseInt(e.target.value)});
                        }
                      }}
                      min="60"
                    />
                  </div>
                  <div className="form-group">
                    <label>Points</label>
                    <input
                      type="number"
                      value={editingQuestion ? editingQuestion.points : newQuestion.points}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({...editingQuestion, points: parseInt(e.target.value)});
                        } else {
                          setNewQuestion({...newQuestion, points: parseInt(e.target.value)});
                        }
                      }}
                      min="5"
                    />
                  </div>
                  <div className="form-group">
                    <label>Example Input</label>
                    <input
                      type="text"
                      value={editingQuestion ? editingQuestion.examples[0]?.input || '' : newQuestion.examples[0]?.input || ''}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({
                            ...editingQuestion, 
                            examples: [{ ...editingQuestion.examples[0], input: e.target.value }]
                          });
                        } else {
                          setNewQuestion({
                            ...newQuestion, 
                            examples: [{ ...newQuestion.examples[0], input: e.target.value }]
                          });
                        }
                      }}
                      placeholder="Example input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Example Output</label>
                    <input
                      type="text"
                      value={editingQuestion ? editingQuestion.examples[0]?.output || '' : newQuestion.examples[0]?.output || ''}
                      onChange={(e) => {
                        if (editingQuestion) {
                          setEditingQuestion({
                            ...editingQuestion, 
                            examples: [{ ...editingQuestion.examples[0], output: e.target.value }]
                          });
                        } else {
                          setNewQuestion({
                            ...newQuestion, 
                            examples: [{ ...newQuestion.examples[0], output: e.target.value }]
                          });
                        }
                      }}
                      placeholder="Example output"
                    />
                  </div>
                  <div className="form-actions">
                    <button 
                      onClick={editingQuestion ? updateQuestion : createQuestion} 
                      className="save-btn"
                    >
                      {editingQuestion ? 'Update' : 'Create'}
                    </button>
                    <button 
                      onClick={() => {
                        setShowCreateQuestion(false);
                        setEditingQuestion(null);
                      }} 
                      className="cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="questions-list">
                {questions.map(question => (
                  <div key={question.id} className="question-card">
                    <div className="question-info">
                      <h3>{question.title}</h3>
                      <p>{question.description}</p>
                      <div className="question-meta">
                        <span className={`difficulty ${question.difficulty.toLowerCase()}`}>{question.difficulty}</span>
                        <span className="language">{question.language}</span>
                        <span>{question.points} points</span>
                        <span>{Math.floor(question.timeLimit / 60)} min</span>
                      </div>
                    </div>
                    <div className="question-actions">
                      <button onClick={() => handleEditQuestion(question)} className="edit-btn">
                        Edit
                      </button>
                      <button onClick={() => deleteQuestion(question.id)} className="delete-btn">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="users-section">
              <h2>User Management</h2>
              <div className="users-list">
                {users.map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      <h3>{user.username}</h3>
                      <p>{user.email}</p>
                      <span className={`role ${user.role}`}>{user.role}</span>
                    </div>
                    <div className="user-actions">
                      <button onClick={() => toggleUserRole(user.id)} className="role-btn">
                        Change Role
                      </button>
                      {user.id !== currentUser.id && (
                        <button onClick={() => deleteUser(user.id)} className="delete-btn">
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="analytics-section">
              <h2>Analytics</h2>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Total Users</h3>
                  <p className="stat-number">{users.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Competitions</h3>
                  <p className="stat-number">{competitions.length}</p>
                </div>
                <div className="stat-card">
                  <h3>Active Competitions</h3>
                  <p className="stat-number">{competitions.filter(c => c.status === 'active').length}</p>
                </div>
                <div className="stat-card">
                  <h3>Total Participants</h3>
                  <p className="stat-number">
                    {competitions.reduce((sum, comp) => sum + comp.participants.length, 0)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
