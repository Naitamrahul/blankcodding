import React, { useState, useRef, useEffect } from 'react';
import './BlindEditor.css';

const BlindEditor = ({ onRun, language }) => {
  const [code, setCode] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [lineCount, setLineCount] = useState(1);
  const [showCode, setShowCode] = useState(false);
  const [showCodeCountdown, setShowCodeCountdown] = useState(0);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (showCodeCountdown > 0) {
      const timer = setTimeout(() => {
        setShowCodeCountdown(showCodeCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showCodeCountdown === 0 && showCode) {
      setShowCode(false);
    }
  }, [showCodeCountdown, showCode]);

  const handleShowCode = () => {
    setShowCode(true);
    setShowCodeCountdown(5);
  };

  const handleKeyDown = (e) => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 100);
  };

  const handleChange = (e) => {
    const newCode = e.target.value;
    setCode(newCode);
    setCharCount(newCode.length);
    setLineCount(newCode.split('\n').length);
  };

  const handleRun = () => {
    onRun(code, language);
  };

  const handleCtrlEnter = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
    }
  };

  return (
    <div className="blind-editor">
      <div className="editor-header">
        <h2>Blind Code Editor</h2>
        <div className="editor-stats">
          <span className="stat">Characters: {charCount}</span>
          <span className="stat">Lines: {lineCount}</span>
          <span className="stat">Language: {language}</span>
        </div>
      </div>
      
      <div className="editor-container">
        <div className="typing-indicator">
          {isTyping && <span className="typing-dot">Typing...</span>}
        </div>
        
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyPress={handleCtrlEnter}
          className="hidden-textarea"
          placeholder="Start typing your code here... (Your code will not be visible)"
          style={{ 
            color: showCode ? 'white' : 'transparent',
            backgroundColor: showCode ? 'rgba(0,0,0,0.3)' : 'transparent',
            caretColor: showCode ? 'white' : 'transparent'
          }}
        />
        
        <div className="editor-cover" style={{ display: showCode ? 'none' : 'flex' }}>
          <div className="cover-text">
            <h3>Blind Coding Mode</h3>
            <p>Your code is hidden while typing</p>
            <p>Press Ctrl+Enter to run your code</p>
          </div>
        </div>
        
        {showCode && (
          <div className="show-code-overlay">
            <div className="countdown-timer">
              Code visible for: {showCodeCountdown}s
            </div>
          </div>
        )}
      </div>
      
      <div className="editor-footer">
        <button onClick={handleRun} className="run-button">
          Run Code (Ctrl+Enter)
        </button>
        <button 
          onClick={handleShowCode}
          disabled={showCode}
          className="show-code-button"
        >
          {showCode ? `Showing (${showCodeCountdown}s)` : 'Show Code (5xs)'}
        </button>
        <button 
          onClick={() => setCode('')} 
          className="clear-button"
        >
          Clear Code
        </button>
      </div>
    </div>
  );
};

export default BlindEditor;
