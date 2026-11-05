import { CONSTANTS, EXECUTION_STATUS } from '../config/constants.js';
import { SUPPORTED_LANGUAGES } from '../config/languages.js';

export function validateSubmission(req, res, next) {
  const { language, code, stdin } = req.body;

  if (!language || typeof language !== 'string') {
    return res.status(400).json({
      status: EXECUTION_STATUS.INTERNAL_ERROR,
      stdout: '',
      stderr: 'Missing or invalid field: "language" must be a string.',
      executionTimeMs: 0
    });
  }

  const normalizedLang = language.toLowerCase().trim();
  if (!SUPPORTED_LANGUAGES[normalizedLang]) {
    const allowed = Object.keys(SUPPORTED_LANGUAGES).join(', ');
    return res.status(400).json({
      status: EXECUTION_STATUS.INTERNAL_ERROR,
      stdout: '',
      stderr: `Invalid language '${language}'. Supported languages are: ${allowed}.`,
      executionTimeMs: 0
    });
  }

  if (typeof code !== 'string' || code.trim().length === 0) {
    return res.status(400).json({
      status: EXECUTION_STATUS.INTERNAL_ERROR,
      stdout: '',
      stderr: 'Source code cannot be empty.',
      executionTimeMs: 0
    });
  }

  const codeBytes = Buffer.byteLength(code, 'utf-8');
  if (codeBytes > CONSTANTS.MAX_CODE_SIZE_BYTES) {
    return res.status(400).json({
      status: EXECUTION_STATUS.INTERNAL_ERROR,
      stdout: '',
      stderr: `Source code exceeds maximum size limit of ${CONSTANTS.MAX_CODE_SIZE_BYTES / 1024} KB.`,
      executionTimeMs: 0
    });
  }

  if (stdin !== undefined && typeof stdin !== 'string') {
    return res.status(400).json({
      status: EXECUTION_STATUS.INTERNAL_ERROR,
      stdout: '',
      stderr: '"stdin" must be a string if provided.',
      executionTimeMs: 0
    });
  }

  if (stdin) {
    const stdinBytes = Buffer.byteLength(stdin, 'utf-8');
    if (stdinBytes > CONSTANTS.MAX_STDIN_SIZE_BYTES) {
      return res.status(400).json({
        status: EXECUTION_STATUS.INTERNAL_ERROR,
        stdout: '',
        stderr: `Standard input exceeds maximum size limit of ${CONSTANTS.MAX_STDIN_SIZE_BYTES / 1024} KB.`,
        executionTimeMs: 0
      });
    }
  }

  req.validatedSubmission = {
    language: normalizedLang,
    code,
    stdin: stdin || ''
  };

  next();
}
