export const CONSTANTS = {
  // Submission Limits
  MAX_CODE_SIZE_BYTES: 64 * 1024,      // 64 KB
  MAX_STDIN_SIZE_BYTES: 64 * 1024,     // 64 KB
  MAX_OUTPUT_SIZE_BYTES: 256 * 1024,   // 256 KB max output before truncation
  
  // Execution Limits
  DEFAULT_TIMEOUT_MS: 5000,            // 5 seconds wall clock
  MAX_TIMEOUT_MS: 10000,               // 10 seconds max allowed
  
  // Concurrency & Queue
  MAX_CONCURRENT_EXECUTIONS: 4,        // Max parallel worker processes
  MAX_QUEUE_WAITING: 20,               // Max submissions waiting in queue
  
  // Docker settings
  DOCKER_IMAGE_NAME: process.env.DOCKER_IMAGE_NAME || 'codelab-runner:latest',
  EXECUTION_MODE: process.env.EXECUTION_MODE || 'auto', // 'auto', 'docker', 'local'
  ALLOW_LOCAL_FALLBACK: process.env.ALLOW_LOCAL_FALLBACK !== 'false', // true by default in dev
  
  // Server
  PORT: parseInt(process.env.PORT, 10) || 5000,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || '*'
};

export const EXECUTION_STATUS = {
  ACCEPTED: 'Accepted',
  COMPILATION_ERROR: 'Compilation Error',
  RUNTIME_ERROR: 'Runtime Error',
  TIME_LIMIT_EXCEEDED: 'Time Limit Exceeded',
  OUTPUT_LIMIT_EXCEEDED: 'Output Limit Exceeded',
  QUEUE_FULL: 'Queue Full',
  INTERNAL_ERROR: 'Internal Error'
};
