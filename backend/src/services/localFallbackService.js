import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { CONSTANTS, EXECUTION_STATUS } from '../config/constants.js';
import { SUPPORTED_LANGUAGES } from '../config/languages.js';

// Build augmented PATH including common compiler/JDK paths if not already in system PATH
const extraPaths = [
  'C:\\Program Files\\Microsoft\\jdk-21.0.13.21-hotspot\\bin',
  'C:\\MinGW\\bin'
];
const currentPath = process.env.PATH || '';
const augmentedPath = [...extraPaths, ...currentPath.split(path.delimiter)].filter(Boolean).join(path.delimiter);

/**
 * Execute child process safely using spawn with argument array
 */
function runProcess(cmd, args, { cwd, stdinText, timeoutMs = CONSTANTS.DEFAULT_TIMEOUT_MS }) {
  return new Promise((resolve) => {
    const startTime = process.hrtime.bigint();
    let stdout = '';
    let stderr = '';
    let isTimedOut = false;
    let isOutputLimitExceeded = false;
    let totalOutputLength = 0;

    const proc = spawn(cmd, args, {
      cwd,
      windowsHide: true,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PATH: augmentedPath,
        PYTHONIOENCODING: 'utf-8',
        LC_ALL: 'en_US.UTF-8'
      }
    });

    const timer = setTimeout(() => {
      isTimedOut = true;
      try {
        proc.kill('SIGKILL');
      } catch {
        // ignore
      }
    }, timeoutMs);

    if (stdinText !== undefined && stdinText !== null && proc.stdin) {
      try {
        const textToSend = stdinText.length > 0
          ? (stdinText.endsWith('\n') ? stdinText : stdinText + '\n')
          : '';
        proc.stdin.write(textToSend);
        proc.stdin.end();
      } catch {
        // ignore stdin pipe errors
      }
    } else if (proc.stdin) {
      proc.stdin.end();
    }

    proc.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      totalOutputLength += text.length;

      if (totalOutputLength > CONSTANTS.MAX_OUTPUT_SIZE_BYTES) {
        isOutputLimitExceeded = true;
        try { proc.kill('SIGKILL'); } catch { /* ignore */ }
        return;
      }
      stdout += text;
    });

    proc.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      totalOutputLength += text.length;

      if (totalOutputLength > CONSTANTS.MAX_OUTPUT_SIZE_BYTES) {
        isOutputLimitExceeded = true;
        try { proc.kill('SIGKILL'); } catch { /* ignore */ }
        return;
      }
      stderr += text;
    });

    proc.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        code: 1,
        stdout,
        stderr: err.message,
        executionTimeMs: 0,
        isSpawnError: true
      });
    });

    proc.on('close', (code) => {
      clearTimeout(timer);
      const endTime = process.hrtime.bigint();
      const executionTimeMs = Number((endTime - startTime) / 1000000n);

      resolve({
        code: isTimedOut ? -1 : code,
        stdout,
        stderr,
        executionTimeMs,
        isTimedOut,
        isOutputLimitExceeded
      });
    });
  });
}

/**
 * Execute submission locally using safe spawn (for dev fallback)
 */
export async function executeLocally({ language, code, stdin = '' }) {
  const langConfig = SUPPORTED_LANGUAGES[language];
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const runId = crypto.randomUUID();
  const tempDir = path.join(os.tmpdir(), `codelab-local-${runId}`);

  try {
    await fs.mkdir(tempDir, { recursive: true });
    const sourceFilePath = path.join(tempDir, langConfig.filename);
    await fs.writeFile(sourceFilePath, code, 'utf-8');

    const isWin = os.platform() === 'win32';

    // 1. Compilation step (if required)
    if (langConfig.compileCmd) {
      let [cmd, ...args] = langConfig.compileCmd;
      let compileRes = await runProcess(cmd, args, {
        cwd: tempDir,
        timeoutMs: 8000
      });

      // If local compiler is an older version (like GCC 6.3) that doesn't recognize -std=c17 / -std=c++17
      if (compileRes.code !== 0 && compileRes.stderr.includes('unrecognized command line option')) {
        const fallbackArgs = args.map(arg => {
          if (arg === '-std=c17') return '-std=c11';
          if (arg === '-std=c++17') return '-std=c++14';
          return arg;
        });
        compileRes = await runProcess(cmd, fallbackArgs, {
          cwd: tempDir,
          timeoutMs: 8000
        });
      }

      if (compileRes.isSpawnError) {
        return {
          status: EXECUTION_STATUS.INTERNAL_ERROR,
          stdout: '',
          stderr: `Compiler executable '${cmd}' not found on host environment. Check README for setup instructions.`,
          executionTimeMs: 0
        };
      }

      if (compileRes.code !== 0) {
        return {
          status: EXECUTION_STATUS.COMPILATION_ERROR,
          stdout: compileRes.stdout,
          stderr: compileRes.stderr.trim() || 'Compilation failed.',
          executionTimeMs: compileRes.executionTimeMs
        };
      }
    }

    // 2. Execution step
    let runCmdArr = isWin && langConfig.windowsRunCmd
      ? langConfig.windowsRunCmd
      : langConfig.runCmd;

    let [execCmd, ...execArgs] = runCmdArr;

    // For Windows native executables (e.g. main.exe)
    if (isWin && execCmd === './main') {
      execCmd = path.join(tempDir, 'main.exe');
    } else if (isWin && execCmd === 'main.exe') {
      execCmd = path.join(tempDir, 'main.exe');
    }

    const execRes = await runProcess(execCmd, execArgs, {
      cwd: tempDir,
      stdinText: stdin,
      timeoutMs: CONSTANTS.DEFAULT_TIMEOUT_MS
    });

    if (execRes.isSpawnError) {
      return {
        status: EXECUTION_STATUS.INTERNAL_ERROR,
        stdout: '',
        stderr: `Runtime executable '${execCmd}' not found on host environment.`,
        executionTimeMs: 0
      };
    }

    if (execRes.isTimedOut) {
      return {
        status: EXECUTION_STATUS.TIME_LIMIT_EXCEEDED,
        stdout: execRes.stdout,
        stderr: `Time Limit Exceeded (${CONSTANTS.DEFAULT_TIMEOUT_MS / 1000}s limit). Process terminated.`,
        executionTimeMs: CONSTANTS.DEFAULT_TIMEOUT_MS
      };
    }

    if (execRes.isOutputLimitExceeded) {
      return {
        status: EXECUTION_STATUS.OUTPUT_LIMIT_EXCEEDED,
        stdout: execRes.stdout.slice(0, 10000) + '\n...[Output Truncated]',
        stderr: 'Output Limit Exceeded (max 256KB). Process terminated.',
        executionTimeMs: execRes.executionTimeMs
      };
    }

    if (execRes.code !== 0) {
      return {
        status: EXECUTION_STATUS.RUNTIME_ERROR,
        stdout: execRes.stdout,
        stderr: execRes.stderr.trim() || `Process exited with code ${execRes.code}`,
        executionTimeMs: execRes.executionTimeMs
      };
    }

    return {
      status: EXECUTION_STATUS.ACCEPTED,
      stdout: execRes.stdout,
      stderr: execRes.stderr,
      executionTimeMs: execRes.executionTimeMs
    };
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
