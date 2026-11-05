import { Router } from 'express';
import { handleExecute } from '../controllers/executeController.js';
import { validateSubmission } from '../middleware/validateSubmission.js';
import { executionRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/execute', executionRateLimiter, validateSubmission, handleExecute);

export default router;
