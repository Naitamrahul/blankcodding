import React, { useState, useEffect, useCallback } from 'react';
import './UserProfile.css';

const UserProfile = ({ currentUser, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [userStats, setUserStats] = useState({
    totalCompetitions: 0,
    completedCompetitions: 0,
    averageScore: 0,
    favoriteLanguage: 'javascript'
  });
  const [competitionHistory, setCompetitionHistory] = useState([]);

  const loadUserData = useCallback(() => {
    const history = JSON.parse(localStorage.getItem(`history_${currentUser.id}`) || '[]');
    setCompetitionHistory(history);
    
    const stats = {
      totalCompetitions: history.length,
      completedCompetitions: history.filter(h => h.status === 'completed').length,
      averageScore: history.length > 0 ? 
        Math.round(history.reduce((sum, h) => sum + (h.score || 0), 0) / history.length) : 0,
      favoriteLanguage: getFavoriteLanguage(history)
    };
    setUserStats(stats);
  }, [currentUser.id]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const getFavoriteLanguage = (history) => {
    const languageCount = {};
    history.forEach(h => {
      languageCount[h.language] = (languageCount[h.language] || 0) + 1;
    });
    
    const sorted = Object.entries(languageCount).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : 'javascript';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#4caf50';
    if (score >= 70) return '#ffc107';
    if (score >= 50) return '#ff9800';
    return '#f44336';
  };

  return (
    <div className="user-profile">
      <header className="profile-header">
        <div className="header-content">
          <h1>User Profile</h1>
          <div className="user-info">
            <span>Welcome, {currentUser.username}</span>
            <button onClick={onLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>

      <div className="profile-content">
        <nav className="profile-nav">
          <button 
            className={`nav-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`nav-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            Statistics
          </button>
          <button 
            className={`nav-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </nav>

        <main className="profile-main">
          {activeTab === 'profile' && (
            <div className="profile-section">
              <div className="profile-card">
                <div className="avatar">
                  <div className="avatar-circle">
                    {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="profile-info">
                  <h2>{currentUser.username}</h2>
                  <p className="email">{currentUser.email}</p>
                  <span className={`role ${currentUser.role}`}>{currentUser.role}</span>
                  <p className="joined">Joined: {formatDate(currentUser.createdAt)}</p>
                </div>
              </div>
              
              <div className="quick-stats">
                <div className="stat-item">
                  <h3>{userStats.totalCompetitions}</h3>
                  <p>Total Competitions</p>
                </div>
                <div className="stat-item">
                  <h3>{userStats.completedCompetitions}</h3>
                  <p>Completed</p>
                </div>
                <div className="stat-item">
                  <h3>{userStats.averageScore}%</h3>
                  <p>Average Score</p>
                </div>
                <div className="stat-item">
                  <h3>{userStats.favoriteLanguage}</h3>
                  <p>Favorite Language</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div className="stats-section">
              <h2>Detailed Statistics</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Performance</h3>
                  <div className="performance-bar">
                    <div 
                      className="performance-fill" 
                      style={{ 
                        width: `${userStats.averageScore}%`,
                        backgroundColor: getScoreColor(userStats.averageScore)
                      }}
                    />
                  </div>
                  <p>Average Score: {userStats.averageScore}%</p>
                </div>
                
                <div className="stat-card">
                  <h3>Success Rate</h3>
                  <div className="success-rate">
                    {userStats.totalCompetitions > 0 ? 
                      Math.round((userStats.completedCompetitions / userStats.totalCompetitions) * 100) : 0
                    }%
                  </div>
                  <p>Competitions Completed</p>
                </div>
                
                <div className="stat-card">
                  <h3>Language Distribution</h3>
                  <div className="language-stats">
                    {Object.entries(
                      competitionHistory.reduce((acc, comp) => {
                        acc[comp.language] = (acc[comp.language] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([lang, count]) => (
                      <div key={lang} className="language-item">
                        <span>{lang}</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="stat-card">
                  <h3>Recent Activity</h3>
                  <p>Last competition: {
                    competitionHistory.length > 0 ? 
                      formatDate(competitionHistory[0].date) : 
                      'No competitions yet'
                  }</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-section">
              <h2>Competition History</h2>
              
              {competitionHistory.length === 0 ? (
                <div className="empty-history">
                  <p>No competitions participated yet.</p>
                  <button 
                    onClick={() => window.location.reload()}
                    className="start-competition-btn"
                  >
                    Start Your First Competition
                  </button>
                </div>
              ) : (
                <div className="history-list">
                  {competitionHistory.map((competition, index) => (
                    <div key={index} className="history-item">
                      <div className="history-info">
                        <h3>{competition.title || 'Blind Coding Challenge'}</h3>
                        <p className="date">{formatDate(competition.date)}</p>
                        <div className="competition-details">
                          <span className="language">{competition.language}</span>
                          <span className={`status ${competition.status}`}>
                            {competition.status}
                          </span>
                          {competition.score && (
                            <span 
                              className="score" 
                              style={{ color: getScoreColor(competition.score) }}
                            >
                              Score: {competition.score}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="history-actions">
                        <button className="view-btn">View Details</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserProfile;
