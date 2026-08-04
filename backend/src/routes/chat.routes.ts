import { Router } from 'express';
import {
  createOrGetSession,
  getMessages,
  sendMessage,
} from '../controllers/chat.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { chatLimiter } from '../middleware/rateLimit.js';
import { sendMessageSchema } from '../schemas/chat.schema.js';

const router = Router();

router.post('/sessions', requireAuth, createOrGetSession);
router.get('/sessions/:id/messages', requireAuth, getMessages);
router.post(
  '/sessions/:id/messages',
  requireAuth,
  chatLimiter,
  validate(sendMessageSchema),
  sendMessage,
);

export default router;
