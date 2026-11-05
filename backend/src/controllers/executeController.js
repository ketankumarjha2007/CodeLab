import { executeCode } from '../services/executor.js';

export async function handleExecute(req, res, next) {
  try {
    const { language, code, stdin } = req.validatedSubmission;

    const result = await executeCode({ language, code, stdin });

    res.json({
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      executionTimeMs: result.executionTimeMs,
      engine: result.engine
    });
  } catch (error) {
    next(error);
  }
}
