import { z } from 'zod';
import { SERVICES } from '../config/services.js';

type ServiceId = (typeof SERVICES)[number]['id'];
const serviceIds = SERVICES.map((s) => s.id) as [ServiceId, ...ServiceId[]];

export const createAppointmentSchema = z.object({
  serviceType: z.enum(serviceIds),
  startsAt: z.iso.datetime({ offset: true }),
  notes: z.string().max(500).optional(),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
