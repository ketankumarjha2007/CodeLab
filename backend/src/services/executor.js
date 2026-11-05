import { CONSTANTS, EXECUTION_STATUS } from '../config/constants.js';
import { executionQueue } from './executionQueue.js';
import { checkDockerAvailability, executeInDocker } from './dockerService.js';
import { executeLocally } from './localFallbackService.js';

export async function executeCode({ language, code, stdin = '' }) {
  return executionQueue.run(async () => {
    const isDockerReady = await checkDockerAvailability();

    if (CONSTANTS.EXECUTION_MODE === 'docker') {
      if (!isDockerReady) {
        return {
          status: EXECUTION_STATUS.INTERNAL_ERROR,
          stdout: '',
          stderr: 'Docker service unavailable: Docker daemon is not running or CLI is unreachable. Please check Docker Desktop or the container host.',
          executionTimeMs: 0,
          engine: 'docker-unavailable'
        };
      }
      const result = await executeInDocker({ language, code, stdin });
      return { ...result, engine: 'docker' };
    }

    // Auto mode
    if (isDockerReady) {
      const result = await executeInDocker({ language, code, stdin });
      return { ...result, engine: 'docker' };
    }

    if (CONSTANTS.ALLOW_LOCAL_FALLBACK) {
      const result = await executeLocally({ language, code, stdin });
      return { ...result, engine: 'local-fallback' };
    }

    return {
      status: EXECUTION_STATUS.INTERNAL_ERROR,
      stdout: '',
      stderr: 'Execution engine unavailable: Docker is not running and local fallback is disabled.',
      executionTimeMs: 0,
      engine: 'none'
    };
  });
}
