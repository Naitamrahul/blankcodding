import React from 'react';
import './OutputDisplay.css';

const OutputDisplay = ({ output, error, isLoading, executionTime }) => {
  return (
    <div className="output-display">
      <div className="output-header">
        <h3>Output</h3>
        {executionTime && (
          <span className="execution-time">
            Execution time: {executionTime}ms
          </span>
        )}
      </div>
      
      <div className="output-content">
        {isLoading && (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Running code...</p>
          </div>
        )}
        
        {error && (
          <div className="error-output">
            <h4>Compilation/Runtime Error</h4>
            <pre>{error}</pre>
          </div>
        )}
        
        {output && !error && !isLoading && (
          <div className="success-output">
            <pre>{output}</pre>
          </div>
        )}
        
        {!output && !error && !isLoading && (
          <div className="empty-output">
            <p>Run your code to see the output here</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OutputDisplay;
