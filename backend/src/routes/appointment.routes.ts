import { Router } from 'express';
import {
  createAppointment,
  listAppointments,
  cancelAppointment,
} from '../controllers/appointment.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createAppointmentSchema } from '../schemas/appointment.schema.js';

const router = Router();

router.post('/', requireAuth, validate(createAppointmentSchema), createAppointment);
router.get('/', requireAuth, listAppointments);
router.patch('/:id/cancel', requireAuth, cancelAppointment);

export default router;
