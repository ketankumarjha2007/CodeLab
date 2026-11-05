import { SUPPORTED_LANGUAGES } from '../config/languages.js';
import { checkDockerAvailability } from '../services/dockerService.js';
import { executionQueue } from '../services/executionQueue.js';
import { CONSTANTS } from '../config/constants.js';

export async function getHealth(req, res) {
  const dockerReady = await checkDockerAvailability();
  res.json({
    status: 'ok',
    service: 'CodeLab Online Compiler API',
    uptime: process.uptime(),
    dockerReady,
    executionMode: CONSTANTS.EXECUTION_MODE,
    allowLocalFallback: CONSTANTS.ALLOW_LOCAL_FALLBACK,
    queue: executionQueue.getStats()
  });
}

export function getLanguages(req, res) {
  const list = Object.values(SUPPORTED_LANGUAGES).map(lang => ({
    id: lang.id,
    name: lang.name,
    version: lang.version,
    extension: lang.extension,
    starterTemplate: lang.starterTemplate
  }));

  res.json({ languages: list });
}
