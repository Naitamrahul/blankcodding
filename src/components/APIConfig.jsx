import React, { useState } from 'react';
import './APIConfig.css';

const APIConfig = ({ onSave }) => {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showConfig, setShowConfig] = useState(false);

  const handleSave = () => {
    if (clientId && clientSecret) {
      localStorage.setItem('jdoodleClientId', clientId);
      localStorage.setItem('jdoodleClientSecret', clientSecret);
      onSave({ clientId, clientSecret });
      setShowConfig(false);
    } else {
      alert('Please enter both Client ID and Client Secret');
    }
  };

  const handleClear = () => {
    localStorage.removeItem('jdoodleClientId');
    localStorage.removeItem('jdoodleClientSecret');
    setClientId('');
    setClientSecret('');
    onSave({ clientId: '', clientSecret: '' });
  };

  return (
    <div className="api-config">
      <button 
        onClick={() => setShowConfig(!showConfig)}
        className="config-toggle-btn"
      >
        {showConfig ? 'Hide API Config' : 'Configure API'}
      </button>
      
      {showConfig && (
        <div className="config-panel">
          <h3>JDoodle API Configuration</h3>
          <p>
            To enable real code execution, get your API credentials from{' '}
            <a href="https://www.jdoodle.com/compiler-api" target="_blank" rel="noopener noreferrer">
              JDoodle Compiler API
            </a>
          </p>
          
          <div className="form-group">
            <label htmlFor="client-id">Client ID:</label>
            <input
              id="client-id"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Enter your JDoodle Client ID"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="client-secret">Client Secret:</label>
            <input
              id="client-secret"
              type="password"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              placeholder="Enter your JDoodle Client Secret"
            />
          </div>
          
          <div className="config-actions">
            <button onClick={handleSave} className="save-btn">
              Save Configuration
            </button>
            <button onClick={handleClear} className="clear-btn">
              Clear Configuration
            </button>
          </div>
          
          <div className="info-box">
            <strong>Note:</strong> Without API configuration, the app will use mock execution 
            for demonstration purposes only.
          </div>
        </div>
      )}
    </div>
  );
};

export default APIConfig;
