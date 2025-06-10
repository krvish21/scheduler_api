import { Router } from 'express';
import emailRoutes from './emailRoutes.js';

const router = Router();

router.use('/task', emailRoutes);

export default router;