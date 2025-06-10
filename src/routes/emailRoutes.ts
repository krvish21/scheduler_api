import { Router } from 'express';
import { sendEmail } from '../controllers/emailController.js';

const router = Router();

router.post('/send', sendEmail);

export default router;