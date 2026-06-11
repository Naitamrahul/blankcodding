const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const FORCE_REMOTE = String(process.env.FORCE_REMOTE || 'false').toLowerCase() === 'true';
const REMOTE_API_URL = process.env.PISTON_REMOTE_URL || 'https://emkc.org/api/v2/piston/execute';

// JDoodle API Configuration
const JDOODLE_CLIENT_ID = process.env.JDOODLE_CLIENT_ID;
const JDOODLE_CLIENT_SECRET = process.env.JDOODLE_CLIENT_SECRET;
const JDOODLE_API_URL = process.env.JDOODLE_API_URL || 'https://api.jdoodle.com/v1/execute';

app.use(cors());
app.use(express.json());

// Language configurations
const languageConfigs = {
  javascript: {
    command: 'node',
    args: [],
    extension: 'js',
    timeout: 5000
  },
  python: {
    command: 'python',
    args: [],
    extension: 'py',
    timeout: 5000
  },
  java: {
    command: 'java',
    args: ['Main'],
    extension: 'java',
    compileCommand: 'javac',
    timeout: 10000
  },
  cpp: {
    command: process.platform === 'win32' ? 'program.exe' : './program',
    args: [],
    extension: 'cpp',
    compileCommand: 'g++',
    compileArgs: ['-o', 'program'],
    timeout: 10000
  },
  c: {
    command: process.platform === 'win32' ? 'program.exe' : './program',
    args: [],
    extension: 'c',
    compileCommand: 'gcc',
    compileArgs: ['-o', 'program'],
    timeout: 10000
  },
  csharp: {
    command: 'dotnet',
    args: ['run'],
    extension: 'cs',
    compileCommand: 'dotnet',
    compileArgs: ['build'],
    timeout: 10000
  }
};

// Create temporary directory for execution
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Execute code endpoint
app.post('/api/v2/piston/execute', async (req, res) => {
  const { language, version, files } = req.body;
  
  if (!files || files.length === 0) {
    return res.status(400).json({ 
      error: 'No files provided' 
    });
  }

  const config = languageConfigs[language];
  if (!config) {
    return res.status(400).json({ 
      error: `Language ${language} not supported` 
    });
  }

  const file = files[0];
  const fileName = file.name || `main.${config.extension}`;
  const filePath = path.join(tempDir, fileName);
  const executionDir = path.join(tempDir, `exec_${Date.now()}`);
  
  try {
    // Create execution directory
    fs.mkdirSync(executionDir);
    
    // Write code to file
    const codeFilePath = path.join(executionDir, fileName);
    fs.writeFileSync(codeFilePath, file.content);

    let compileOutput = '';
    let compileError = '';
    
    // Compile if needed
    if (config.compileCommand) {
      const compileResult = await compileCode(
        config.compileCommand, 
        config.compileArgs || [], 
        codeFilePath, 
        executionDir,
        config.timeout
      );
      
      if (compileResult.error) {
        compileError = compileResult.error;
      }
      if (compileResult.output) {
        compileOutput = compileResult.output;
      }
    }

    // Run the code
    const runResult = await runCode(
      config.command, 
      config.args, 
      executionDir,
      config.timeout
    );

    // Cleanup
    try {
      fs.rmSync(executionDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.log('Cleanup error:', cleanupError);
    }

    // Return response in Piston format
    res.json({
      language,
      version,
      compile: compileError ? {
        stderr: compileError,
        stdout: compileOutput,
        code: 1
      } : null,
      run: {
        stdout: runResult.output,
        stderr: runResult.error,
        code: runResult.error ? 1 : 0,
        signal: null,
        output: runResult.output + (runResult.error ? '\n' + runResult.error : '')
      }
    });

  } catch (error) {
    // Cleanup on error
    try {
      fs.rmSync(executionDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.log('Cleanup error:', cleanupError);
    }
    
    res.status(500).json({ 
      error: `Execution failed: ${error.message}` 
    });
  }
});

// Remote proxy endpoint: forwards execution requests to the free Piston API when configured.
app.post('/api/remote/execute', async (req, res) => {
  if (!FORCE_REMOTE) {
    console.log('FORCE_REMOTE=false: executing locally via /api/v2/piston/execute');
    try {
      const localResp = await axios.post(`http://localhost:${PORT}/api/v2/piston/execute`, req.body, { timeout: 20000 });
      return res.json(localResp.data);
    } catch (localError) {
      console.error('Local execution failed:', localError.message || localError);
      return res.status(502).json({ error: 'Local execution failed', message: localError.message });
    }
  }

  try {
    const response = await axios.post(REMOTE_API_URL, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Remote Piston proxy error:', error.message || error);
    console.log('FORCE_REMOTE=true: falling back to local execution endpoint');

    try {
      const localResp = await axios.post(`http://localhost:${PORT}/api/v2/piston/execute`, req.body, { timeout: 20000 });
      return res.json(localResp.data);
    } catch (localError) {
      console.error('Local fallback also failed:', localError.message || localError);
      return res.status(502).json({ error: 'Remote execution failed', message: error.message });
    }
  }
});

// Remote proxy endpoint: forwards execution requests to the free Piston API when configured.
app.post('/api/remote/execute', async (req, res) => {
  if (!FORCE_REMOTE) {
    console.log('FORCE_REMOTE=false: executing locally via /api/v2/piston/execute');
    try {
      const localResp = await axios.post(`http://localhost:${PORT}/api/v2/piston/execute`, req.body, { timeout: 20000 });
      return res.json(localResp.data);
    } catch (localError) {
      console.error('Local execution failed:', localError.message || localError);
      return res.status(502).json({ error: 'Local execution failed', message: localError.message });
    }
  }

  try {
    const response = await axios.post(REMOTE_API_URL, req.body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    return res.json(response.data);
  } catch (error) {
    console.error('Remote Piston proxy error:', error.message || error);
    console.log('FORCE_REMOTE=true: falling back to local execution endpoint');

    try {
      const localResp = await axios.post(`http://localhost:${PORT}/api/v2/piston/execute`, req.body, { timeout: 20000 });
      return res.json(localResp.data);
    } catch (localError) {
      console.error('Local fallback also failed:', localError.message || localError);
      return res.status(502).json({ error: 'Remote execution failed', message: error.message });
    }
  }
});

// JDoodle API endpoint: forwards execution requests to JDoodle
app.post('/api/jdoodle/execute', async (req, res) => {
  const { language, script, stdin } = req.body;

  if (!script) {
    return res.status(400).json({ error: 'No script provided' });
  }

  if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
    return res.status(500).json({ error: 'JDoodle API credentials not configured' });
  }

  const languageMap = {
    'nodejs': 'nodejs',
    'python3': 'python3',
    'java': 'java',
    'cpp': 'cpp14',
    'c': 'c',
    'csharp': 'csharp',
    'ruby': 'ruby',
    'php': 'php',
    'go': 'go',
    'rust': 'rust',
    'kotlin': 'kotlin',
    'swift': 'swift'
  };

  try {
    console.log(`Executing ${language} code with JDoodle API...`);

    const jdoodlePayload = {
      clientId: JDOODLE_CLIENT_ID,
      clientSecret: JDOODLE_CLIENT_SECRET,
      script: script,
      language: languageMap[language] || 'nodejs',
      stdin: stdin || ''
    };

    const response = await axios.post(JDOODLE_API_URL, jdoodlePayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    console.log('JDoodle API response:', response.data);

    return res.json({
      output: response.data.output || '',
      error: response.data.error || '',
      exitCode: response.data.statusCode === 201 ? 0 : 1
    });

  } catch (error) {
    console.error('JDoodle API error:', error.message);
    return res.status(502).json({ 
      error: 'JDoodle API execution failed', 
      message: error.message,
      output: '',
      exitCode: 1
    });
  }
});

function compileCode(command, args, filePath, workingDir, timeout) {
  return new Promise((resolve) => {
    const compileArgs = [...args, filePath];
    const process = spawn(command, compileArgs, { cwd: workingDir });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    const timer = setTimeout(() => {
      process.kill('SIGKILL');
      resolve({ output: stdout, error: 'Compilation timeout' });
    }, timeout);
    
    process.on('close', (code) => {
      clearTimeout(timer);
      resolve({ 
        output: stdout, 
        error: code !== 0 ? stderr : '' 
      });
    });
    
    process.on('error', (error) => {
      clearTimeout(timer);
      resolve({ output: stdout, error: error.message });
    });
  });
}

function runCode(command, args, workingDir, timeout) {
  return new Promise((resolve) => {
    const process = spawn(command, args, { cwd: workingDir });
    
    let stdout = '';
    let stderr = '';
    
    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    const timer = setTimeout(() => {
      process.kill('SIGKILL');
      resolve({ output: stdout, error: 'Execution timeout' });
    }, timeout);
    
    process.on('close', (code) => {
      clearTimeout(timer);
      resolve({ 
        output: stdout, 
        error: code !== 0 ? stderr : '' 
      });
    });
    
    process.on('error', (error) => {
      clearTimeout(timer);
      resolve({ output: stdout, error: error.message });
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Code execution server is running (JDoodle API enabled)',
    jdoodleConfigured: !!(JDOODLE_CLIENT_ID && JDOODLE_CLIENT_SECRET),
    apiUrl: JDOODLE_API_URL
  });
});

// JDoodle API Test Endpoint
app.get('/api/test-jdoodle', async (req, res) => {
  if (!JDOODLE_CLIENT_ID || !JDOODLE_CLIENT_SECRET) {
    return res.status(500).json({ 
      error: 'JDoodle API credentials not configured',
      clientId: JDOODLE_CLIENT_ID ? 'Set' : 'Missing',
      clientSecret: JDOODLE_CLIENT_SECRET ? 'Set' : 'Missing'
    });
  }

  try {
    console.log('Testing JDoodle API with simple JavaScript code...');
    
    const testPayload = {
      clientId: JDOODLE_CLIENT_ID,
      clientSecret: JDOODLE_CLIENT_SECRET,
      script: 'console.log("Hello from JDoodle!");',
      language: 'nodejs',
      stdin: ''
    };

    const response = await axios.post(JDOODLE_API_URL, testPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    console.log('JDoodle API Test Response:', response.data);

    return res.json({
      status: 'success',
      message: 'JDoodle API is working correctly',
      response: response.data
    });

  } catch (error) {
    console.error('JDoodle API Test Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    
    return res.status(502).json({ 
      error: 'JDoodle API test failed', 
      message: error.message,
      details: error.response?.data
    });
  }
});

// Languages endpoint
app.get('/api/v2/piston/runtimes', (req, res) => {
  const runtimes = Object.keys(languageConfigs).map(lang => ({
    language: lang,
    version: '1.0.0',
    aliases: [lang]
  }));
  
  res.json(runtimes);
});

app.listen(PORT, () => {
  console.log(`Code execution server running on port ${PORT}`);
  console.log(`JDoodle API is configured and active`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`JDoodle API endpoint: http://localhost:${PORT}/api/jdoodle/execute`);
  console.log(`Piston API endpoint: http://localhost:${PORT}/api/v2/piston/execute`);
});
