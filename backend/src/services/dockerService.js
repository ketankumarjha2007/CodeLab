import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { CONSTANTS, EXECUTION_STATUS } from '../config/constants.js';
import { SUPPORTED_LANGUAGES } from '../config/languages.js';

let isDockerAvailableCache = null;
let lastDockerCheckTime = 0;

/**
 * Check if the Docker daemon and CLI are functional
 */
export async function checkDockerAvailability() {
  const now = Date.now();
  // Cache check for 30 seconds
  if (isDockerAvailableCache !== null && (now - lastDockerCheckTime < 30000)) {
    return isDockerAvailableCache;
  }

  return new Promise((resolve) => {
    try {
      const proc = spawn('docker', ['version', '--format', '{{.Server.Version}}'], {
        windowsHide: true,
        timeout: 3000
      });

      let stdout = '';
      proc.stdout?.on('data', (d) => { stdout += d.toString(); });
      
      proc.on('error', () => {
        isDockerAvailableCache = false;
        lastDockerCheckTime = Date.now();
        resolve(false);
      });

      proc.on('close', (code) => {
        isDockerAvailableCache = (code === 0 && stdout.trim().length > 0);
        lastDockerCheckTime = Date.now();
        resolve(isDockerAvailableCache);
      });
    } catch {
      isDockerAvailableCache = false;
      lastDockerCheckTime = Date.now();
      resolve(false);
    }
  });
}

/**
 * Execute code inside a disposable hardened Docker container
 */
export async function executeInDocker({ language, code, stdin = '' }) {
  const langConfig = SUPPORTED_LANGUAGES[language];
  if (!langConfig) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const runId = crypto.randomUUID();
  const containerName = `codelab-exec-${runId.slice(0, 12)}`;
  const tempDir = path.join(os.tmpdir(), `codelab-${runId}`);

  try {
    // 1. Prepare isolated workspace directory
    await fs.mkdir(tempDir, { recursive: true });
    const sourceFilePath = path.join(tempDir, langConfig.filename);
    const stdinFilePath = path.join(tempDir, 'stdin.txt');

    await fs.writeFile(sourceFilePath, code, 'utf-8');
    const formattedStdin = stdin && !stdin.endsWith('\n') ? stdin + '\n' : (stdin || '');
    await fs.writeFile(stdinFilePath, formattedStdin, 'utf-8');

    // 2. Prepare Docker run arguments with strict isolation
    // Convert Windows host path to forward slashes for Docker mount
    const normalizedDir = os.platform() === 'win32'
      ? tempDir.replace(/\\/g, '/')
      : tempDir;

    const dockerArgs = [
      'run',
      '--rm',
      '--name', containerName,
      '--network', 'none',                           // No internet access
      '--memory', '256m',                            // Strict 256MB RAM limit
      '--memory-swap', '256m',                       // Disable swap
      '--cpus', '1.0',                               // Limit to 1 CPU core
      '--pids-limit', '64',                          // Prevent fork bombs
      '--read-only',                                 // Read-only root filesystem
      '--tmpfs', '/tmp:rw,noexec,nosuid,size=64m',   // Writable temporary scratch
      '--cap-drop', 'ALL',                           // Drop all Linux capabilities
      '--security-opt', 'no-new-privileges',         // Prevent privilege escalation
      '--user', '1001:1001',                         // Unprivileged non-root user
      '-v', `${normalizedDir}:/workspace:rw`,        // Mount user temp workspace
      '-w', '/workspace',
      CONSTANTS.DOCKER_IMAGE_NAME,
      language
    ];

    const startTime = process.hrtime.bigint();

    return await new Promise((resolve) => {
      let stdout = '';
      let stderr = '';
      let isTimedOut = false;
      let isOutputLimitExceeded = false;
      let totalOutputLength = 0;

      const proc = spawn('docker', dockerArgs, {
        windowsHide: true
      });

      // Wall-clock timeout timer
      const timer = setTimeout(() => {
        isTimedOut = true;
        // Kill docker container forcefully
        try {
          spawn('docker', ['rm', '-f', containerName], { windowsHide: true });
        } catch {
          // ignore
        }
        try {
          proc.kill('SIGKILL');
        } catch {
          // ignore
        }
      }, CONSTANTS.DEFAULT_TIMEOUT_MS);

      // Handle stdout
      proc.stdout.on('data', (chunk) => {
        const text = chunk.toString();
        totalOutputLength += text.length;

        if (totalOutputLength > CONSTANTS.MAX_OUTPUT_SIZE_BYTES) {
          isOutputLimitExceeded = true;
          try {
            spawn('docker', ['rm', '-f', containerName], { windowsHide: true });
            proc.kill('SIGKILL');
          } catch {
            // ignore
          }
          return;
        }

        stdout += text;
      });

      // Handle stderr
      proc.stderr.on('data', (chunk) => {
        const text = chunk.toString();
        totalOutputLength += text.length;

        if (totalOutputLength > CONSTANTS.MAX_OUTPUT_SIZE_BYTES) {
          isOutputLimitExceeded = true;
          try {
            spawn('docker', ['rm', '-f', containerName], { windowsHide: true });
            proc.kill('SIGKILL');
          } catch {
            // ignore
          }
          return;
        }

        stderr += text;
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          status: EXECUTION_STATUS.INTERNAL_ERROR,
          stdout: '',
          stderr: `Failed to spawn Docker process: ${err.message}`,
          executionTimeMs: 0
        });
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        const endTime = process.hrtime.bigint();
        const executionTimeMs = Number((endTime - startTime) / 1000000n);

        if (isTimedOut) {
          return resolve({
            status: EXECUTION_STATUS.TIME_LIMIT_EXCEEDED,
            stdout,
            stderr: `Time Limit Exceeded (${CONSTANTS.DEFAULT_TIMEOUT_MS / 1000}s limit). Process terminated.`,
            executionTimeMs: CONSTANTS.DEFAULT_TIMEOUT_MS
          });
        }

        if (isOutputLimitExceeded) {
          return resolve({
            status: EXECUTION_STATUS.OUTPUT_LIMIT_EXCEEDED,
            stdout: stdout.slice(0, 10000) + '\n...[Output Truncated]',
            stderr: 'Output Limit Exceeded (max 256KB). Process terminated.',
            executionTimeMs
          });
        }

        // Check runner.sh exit codes
        if (code === 42) {
          return resolve({
            status: EXECUTION_STATUS.COMPILATION_ERROR,
            stdout,
            stderr: stderr.trim() || 'Compilation failed.',
            executionTimeMs
          });
        }

        if (code !== 0) {
          return resolve({
            status: EXECUTION_STATUS.RUNTIME_ERROR,
            stdout,
            stderr: stderr.trim() || `Process exited with code ${code}`,
            executionTimeMs
          });
        }

        return resolve({
          status: EXECUTION_STATUS.ACCEPTED,
          stdout,
          stderr,
          executionTimeMs
        });
      });
    });
  } finally {
    // Clean up temporary workspace directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  }
}
