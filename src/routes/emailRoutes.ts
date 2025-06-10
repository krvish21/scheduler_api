import { Router, RequestHandler } from 'express';
import { createTask, listPendingTasks, listCompletedTasks } from '../controllers/emailController.js';

const router = Router();

router.post('/create', createTask as RequestHandler);
router.get('/fetch/pending', listPendingTasks as RequestHandler);
router.get('/fetch/completed', listCompletedTasks as RequestHandler);

export default router;