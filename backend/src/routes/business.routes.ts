import { Router } from 'express';
import { getBusiness } from '../controllers/business.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', requireAuth, getBusiness);

export default router;
