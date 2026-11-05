import { EXECUTION_STATUS } from '../config/constants.js';

export function errorHandler(err, req, res, next) {
  console.error('[CodeLab Server Error]:', err.message || err);

  const statusCode = err.statusCode || 500;
  const status = err.status || EXECUTION_STATUS.INTERNAL_ERROR;

  res.status(statusCode).json({
    status,
    stdout: '',
    stderr: err.message || 'An unexpected internal server error occurred.',
    executionTimeMs: 0
  });
}
