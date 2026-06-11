import React, { useState, useEffect, useCallback } from 'react';
import './Leaderboard.css';

const Leaderboard = ({ currentUser }) => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all'); // 'all', 'week', 'month'
  const [loading, setLoading] = useState(true);

  const loadLeaderboardData = useCallback(() => {
    setLoading(true);
    
    // Get all users
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userScores = [];
    
    // Calculate scores for each user
    users.forEach(user => {
      if (user.role === 'user') {
        const history = JSON.parse(localStorage.getItem(`history_${user.id}`) || '[]');
        const totalScore = history.reduce((sum, entry) => sum + (entry.score || 0), 0);
        const competitionsCompleted = history.filter(entry => entry.status === 'completed').length;
        const averageScore = competitionsCompleted > 0 ? Math.round(totalScore / competitionsCompleted) : 0;
        
        // Filter by time period
        let filteredHistory = history;
        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        if (timeFilter === 'week') {
          filteredHistory = history.filter(entry => new Date(entry.date) >= oneWeekAgo);
        } else if (timeFilter === 'month') {
          filteredHistory = history.filter(entry => new Date(entry.date) >= oneMonthAgo);
        }
        
        const periodScore = filteredHistory.reduce((sum, entry) => sum + (entry.score || 0), 0);
        const periodCompetitions = filteredHistory.filter(entry => entry.status === 'completed').length;
        
        userScores.push({
          id: user.id,
          username: user.username,
          email: user.email,
          totalScore: timeFilter === 'all' ? totalScore : periodScore,
          competitionsCompleted: timeFilter === 'all' ? competitionsCompleted : periodCompetitions,
          averageScore: periodCompetitions > 0 ? Math.round(periodScore / periodCompetitions) : averageScore,
          lastActive: history.length > 0 ? new Date(Math.max(...history.map(h => new Date(h.date)))) : null,
          isCurrentUser: user.id === currentUser.id,
          rank: 0 // Will be set after sorting
        });
      }
    });
    
    // Sort by total score (descending)
    userScores.sort((a, b) => b.totalScore - a.totalScore);
    
    // Assign ranks
    userScores.forEach((user, index) => {
      user.rank = index + 1;
    });
    
    setLeaderboardData(userScores);
    setLoading(false);
  }, [timeFilter, currentUser.id]);

  useEffect(() => {
    loadLeaderboardData();
  }, [loadLeaderboardData]);

  const getRankIcon = (rank) => {
    if (rank === 1) return '??';
    if (rank === 2) return '??';
    if (rank === 3) return '??';
    return `#${rank}`;
  };

  const getRankColor = (rank) => {
    if (rank === 1) return 'gold';
    if (rank === 2) return 'silver';
    if (rank === 3) return 'bronze';
    return 'standard';
  };

  const formatDate = (date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  if (loading) {
    return (
      <div className="leaderboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h2>Leaderboard</h2>
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${timeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setTimeFilter('all')}
          >
            All Time
          </button>
          <button 
            className={`filter-btn ${timeFilter === 'month' ? 'active' : ''}`}
            onClick={() => setTimeFilter('month')}
          >
            This Month
          </button>
          <button 
            className={`filter-btn ${timeFilter === 'week' ? 'active' : ''}`}
            onClick={() => setTimeFilter('week')}
          >
            This Week
          </button>
        </div>
      </div>

      {leaderboardData.length === 0 ? (
        <div className="empty-leaderboard">
          <div className="empty-icon">??</div>
          <h3>No scores yet</h3>
          <p>Be the first to complete a competition and appear on the leaderboard!</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboardData.map((user) => (
            <div 
              key={user.id} 
              className={`leaderboard-item ${user.isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="rank-display">
                <span className={`rank-icon ${getRankColor(user.rank)}`}>
                  {getRankIcon(user.rank)}
                </span>
              </div>
              
              <div className="user-info">
                <div className="user-details">
                  <h3 className="username">
                    {user.username}
                    {user.isCurrentUser && <span className="you-badge">YOU</span>}
                  </h3>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>
              
              <div className="score-info">
                <div className="main-score">
                  <span className="score-value">{user.totalScore}</span>
                  <span className="score-label">points</span>
                </div>
                <div className="stats">
                  <span className="stat">
                    {user.competitionsCompleted} competitions
                  </span>
                  <span className="stat">
                    Avg: {user.averageScore}
                  </span>
                </div>
              </div>
              
              <div className="last-active">
                <span className="last-active-text">
                  {formatDate(user.lastActive)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="leaderboard-footer">
        <div className="summary-stats">
          <div className="stat-card">
            <span className="stat-value">{leaderboardData.length}</span>
            <span className="stat-label">Competitors</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {leaderboardData.reduce((sum, user) => sum + user.competitionsCompleted, 0)}
            </span>
            <span className="stat-label">Total Competitions</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {leaderboardData.length > 0 ? Math.round(
                leaderboardData.reduce((sum, user) => sum + user.averageScore, 0) / leaderboardData.length
              ) : 0}
            </span>
            <span className="stat-label">Average Score</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
