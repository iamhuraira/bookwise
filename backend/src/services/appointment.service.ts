import { query } from '../config/db.js';
import { DEFAULT_BUSINESS_ID } from '../config/env.js';
import { getServiceById } from '../config/services.js';
import { AppError } from '../utils/AppError.js';
import type { CreateAppointmentInput } from '../schemas/appointment.schema.js';

interface PostgresError extends Error {
  code?: string;
}

interface AppointmentRow {
  id: string;
  business_id: string;
  user_id: string;
  service_type: string;
  starts_at: Date;
  ends_at: Date;
  status: string;
  booked_via: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Appointment {
  id: string;
  businessId: string;
  userId: string;
  serviceType: string;
  startsAt: string;
  endsAt: string;
  status: string;
  bookedVia: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

const APPOINTMENT_FIELDS = `
  id, business_id, user_id, service_type, starts_at, ends_at,
  status, booked_via, notes, created_at, updated_at
`;

const mapAppointment = (row: AppointmentRow): Appointment => ({
  id: row.id,
  businessId: row.business_id,
  userId: row.user_id,
  serviceType: row.service_type,
  startsAt: row.starts_at.toISOString(),
  endsAt: row.ends_at.toISOString(),
  status: row.status,
  bookedVia: row.booked_via,
  notes: row.notes,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

// wall-clock parts in the timezone offset embedded in the ISO string
const getLocalParts = (iso: string): { day: number; hours: number; minutes: number } => {
  const instant = new Date(iso);
  const offsetMatch = iso.match(/([+-]\d{2}):(\d{2})$/);
  const offsetMinutes = offsetMatch
    ? (offsetMatch[1].startsWith('-') ? -1 : 1) *
      (parseInt(offsetMatch[1].slice(1), 10) * 60 + parseInt(offsetMatch[2], 10))
    : 0;

  const localMs = instant.getTime() + offsetMinutes * 60_000;
  const local = new Date(localMs);

  return {
    day: local.getUTCDay(),
    hours: local.getUTCHours(),
    minutes: local.getUTCMinutes(),
  };
};

const minutesSinceMidnight = (hours: number, minutes: number) => hours * 60 + minutes;

const assertBookingRules = (startsAt: string, durationMinutes: number): void => {
  const start = new Date(startsAt);
  if (start.getTime() <= Date.now()) {
    throw AppError('Appointment must be scheduled in the future', 400, 'INVALID_DATE');
  }

  const { day, hours, minutes } = getLocalParts(startsAt);
  if (day === 0 || day === 6) {
    throw AppError('Appointments are only available Monday through Friday', 400, 'OUTSIDE_BUSINESS_HOURS');
  }

  const startMinutes = minutesSinceMidnight(hours, minutes);
  const endMinutes = startMinutes + durationMinutes;
  const openMinutes = minutesSinceMidnight(9, 0);
  const closeMinutes = minutesSinceMidnight(17, 0);

  if (startMinutes < openMinutes || endMinutes > closeMinutes) {
    throw AppError(
      'Appointments must be within business hours (09:00–17:00, Mon–Fri)',
      400,
      'OUTSIDE_BUSINESS_HOURS',
    );
  }
};

const fetchOwnedEditableAppointment = async (
  userId: string,
  appointmentId: string,
): Promise<AppointmentRow> => {
  const result = await query(`SELECT ${APPOINTMENT_FIELDS} FROM appointments WHERE id = $1`, [
    appointmentId,
  ]);

  if (result.rows.length === 0) {
    throw AppError('Appointment not found', 404, 'NOT_FOUND');
  }

  const row = result.rows[0] as AppointmentRow;

  if (row.user_id !== userId) {
    throw AppError('You can only modify your own appointments', 403, 'NOT_OWNER');
  }

  if (row.status !== 'pending' && row.status !== 'confirmed') {
    throw AppError('Only pending or confirmed appointments can be modified', 409, 'INVALID_STATUS');
  }

  return row;
};

const handleSlotConflict = (err: unknown): never => {
  const pgErr = err as PostgresError;
  if (pgErr.code === '23P01') {
    throw AppError(
      'This time slot is already booked. Please choose another time.',
      409,
      'SLOT_TAKEN',
    );
  }
  throw err;
};

export const createAppointment = async (
  userId: string,
  input: CreateAppointmentInput,
  bookedVia: 'form' | 'chat' = 'form',
): Promise<Appointment> => {
  const service = getServiceById(input.serviceType);
  if (!service) {
    throw AppError('Unknown service type', 400, 'VALIDATION_ERROR');
  }

  assertBookingRules(input.startsAt, service.durationMinutes);

  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

  try {
    const result = await query(
      `INSERT INTO appointments (business_id, user_id, service_type, starts_at, ends_at, booked_via, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${APPOINTMENT_FIELDS}`,
      [
        DEFAULT_BUSINESS_ID, // single-tenant prototype — all bookings go to the default business
        userId,
        input.serviceType,
        startsAt.toISOString(),
        endsAt.toISOString(),
        bookedVia,
        input.notes ?? null,
      ],
    );

    return mapAppointment(result.rows[0] as AppointmentRow);
  } catch (err) {
    return handleSlotConflict(err);
  }
};

export const listAppointments = async (
  userId: string,
): Promise<{ upcoming: Appointment[]; past: Appointment[] }> => {
  const [upcomingResult, pastResult] = await Promise.all([
    query(
      `SELECT ${APPOINTMENT_FIELDS}
       FROM appointments
       WHERE user_id = $1
         AND starts_at >= now()
         AND status IN ('pending', 'confirmed')
       ORDER BY starts_at ASC
       LIMIT 50`,
      [userId],
    ),
    query(
      `SELECT ${APPOINTMENT_FIELDS}
       FROM appointments
       WHERE user_id = $1
         AND NOT (starts_at >= now() AND status IN ('pending', 'confirmed'))
       ORDER BY starts_at DESC
       LIMIT 50`,
      [userId],
    ),
  ]);

  return {
    upcoming: upcomingResult.rows.map((row) => mapAppointment(row as AppointmentRow)),
    past: pastResult.rows.map((row) => mapAppointment(row as AppointmentRow)),
  };
};

export const cancelAppointment = async (
  userId: string,
  appointmentId: string,
): Promise<Appointment> => {
  await fetchOwnedEditableAppointment(userId, appointmentId);

  const updated = await query(
    `UPDATE appointments
     SET status = 'cancelled', updated_at = now()
     WHERE id = $1
     RETURNING ${APPOINTMENT_FIELDS}`,
    [appointmentId],
  );

  return mapAppointment(updated.rows[0] as AppointmentRow);
};
