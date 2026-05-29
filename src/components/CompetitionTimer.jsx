import React, { useState, useEffect } from 'react';
import './CompetitionTimer.css';

const CompetitionTimer = ({ isActive, onComplete, timeLimit = 1800 }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval = null;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            onComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (timeLeft === 0) {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, onComplete]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 60) return '#ff4444';
    if (timeLeft <= 300) return '#ffaa00';
    return '#4ecdc4';
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setTimeLeft(timeLimit);
    setIsPaused(false);
  };

  return (
    <div className="competition-timer">
      <div className="timer-display" style={{ color: getTimeColor() }}>
        <div className="time-value">{formatTime(timeLeft)}</div>
        <div className="time-label">
          {isPaused ? 'PAUSED' : timeLeft === 0 ? 'TIME\'S UP!' : 'TIME REMAINING'}
        </div>
      </div>
      
      <div className="timer-controls">
        <button onClick={togglePause} className="pause-button">
          {isPaused ? 'Resume' : 'Pause'}
        </button>
        <button onClick={resetTimer} className="reset-button">
          Reset
        </button>
      </div>
      
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ 
            width: `${(timeLeft / timeLimit) * 100}%`,
            backgroundColor: getTimeColor()
          }}
        />
      </div>
    </div>
  );
};

export default CompetitionTimer;
