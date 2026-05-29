const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

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
    args: [],
    extension: 'java',
    compileCommand: 'javac',
    timeout: 10000
  },
  cpp: {
    command: './program',
    args: [],
    extension: 'cpp',
    compileCommand: 'g++',
    compileArgs: ['-o', 'program'],
    timeout: 10000
  },
  c: {
    command: './program',
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
  res.json({ status: 'ok', message: 'Piston API server is running' });
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
  console.log(`Piston API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`API endpoint: http://localhost:${PORT}/api/v2/piston/execute`);
});
