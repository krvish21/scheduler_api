import { Router } from 'express';
import emailRoutes from './emailRoutes.js';

const router = Router();

router.use('/email', emailRoutes);

export default router;