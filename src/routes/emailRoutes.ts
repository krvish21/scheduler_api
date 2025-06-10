import { Router, RequestHandler } from 'express';
import { createTask } from '../controllers/emailController.js';

const router = Router();

router.post('/create', createTask as RequestHandler);

export default router;