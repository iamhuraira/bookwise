/*
 * chat_sessions.context JSONB shape:
 * {
 *   "messages": [{ "role": "user|assistant", "content": "...", "at": "ISO timestamp" }],
 *   "booking":  {},     // extracted booking fields — filled by AI in next step
 *   "attempts": 0       // follow-up question counter — used for form fallback later
 * }
 *
 * Messages live inside the session JSONB (one read + one write per turn, memory
 * can't desync from history). Production tradeoff: separate chat_messages table
 * for pagination and cheap appends.
 */

import { query } from '../config/db.js';
import { DEFAULT_BUSINESS_ID } from '../config/env.js';
import { AppError, isAppError } from '../utils/AppError.js';
import { extractBookingIntent } from './ai.service.js';
import * as appointmentService from './appointment.service.js';
import * as businessService from './business.service.js';
import type { Appointment } from './appointment.service.js';
import { getServiceById, type ServiceId } from '../config/services.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  at: string;
}

export interface ChatContext {
  messages: ChatMessage[];
  booking: Record<string, unknown>;
  attempts: number;
}

export type ChatAction = 'show_form' | 'booking_confirmed' | null;

export interface HandleMessageResult {
  reply: ChatMessage;
  action: ChatAction;
  formDefaults?: Record<string, unknown>;
  appointment?: Appointment;
}

interface SessionRow {
  id: string;
  business_id: string;
  user_id: string;
  status: string;
  context: ChatContext;
  created_at: Date;
  updated_at: Date;
}

export interface ChatSession {
  id: string;
  status: string;
  createdAt: string;
}

const SESSION_FIELDS = 'id, business_id, user_id, status, context, created_at, updated_at';
const MAX_ATTEMPTS = 3;

const mapSession = (row: SessionRow): ChatSession => ({
  id: row.id,
  status: row.status,
  createdAt: row.created_at.toISOString(),
});

const greetingMessage = (): ChatMessage => ({
  role: 'assistant',
  content:
    "Hi! I can help you book an appointment. Try: 'Book a consultation tomorrow at 2pm' 😊",
  at: new Date().toISOString(),
});

const initialContext = (): ChatContext => ({
  messages: [greetingMessage()],
  booking: {},
  attempts: 0,
});

const assistantReply = (content: string): ChatMessage => ({
  role: 'assistant',
  content,
  at: new Date().toISOString(),
});

const toFormDefaults = (booking: Record<string, unknown>): Record<string, unknown> => ({
  serviceType: booking.service_type ?? undefined,
  date: booking.date ?? undefined,
  time: booking.time ?? undefined,
  notes: booking.notes ?? undefined,
});

const mergeExtractedBooking = (
  booking: Record<string, unknown>,
  extracted: {
    service_type: string | null;
    date: string | null;
    time: string | null;
    notes: string | null;
  },
): boolean => {
  let changed = false;
  if (extracted.service_type) {
    booking.service_type = extracted.service_type;
    changed = true;
  }
  if (extracted.date) {
    booking.date = extracted.date;
    changed = true;
  }
  if (extracted.time) {
    booking.time = extracted.time;
    changed = true;
  }
  if (extracted.notes) {
    booking.notes = extracted.notes;
    changed = true;
  }
  return changed;
};

const isBookingComplete = (booking: Record<string, unknown>): boolean =>
  Boolean(booking.service_type && booking.date && booking.time);

// shared fallback — counts confused/off-topic turns, not just missing booking fields
const tryFormFallback = (
  context: ChatContext,
  replyText: string,
): HandleMessageResult | null => {
  context.attempts += 1;

  if (context.attempts < MAX_ATTEMPTS) {
    return null;
  }

  const reply = assistantReply(
    replyText ||
      "Let me make this easier — use this quick form and I'll pre-fill what I have:",
  );
  context.messages.push(reply);
  context.attempts = 0;

  return {
    reply,
    action: 'show_form',
    formDefaults: toFormDefaults(context.booking),
  };
};

const buildStartsAtISO = (date: string, time: string): string => {
  const [year, month, day] = date.split('-').map(Number);
  const [hours, minutes] = time.split(':').map(Number);
  const local = new Date(year, month - 1, day, hours, minutes);
  const offsetMinutes = -local.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(abs / 60)).padStart(2, '0');
  const offsetMins = String(abs % 60).padStart(2, '0');
  return `${date}T${time}:00${sign}${offsetHours}:${offsetMins}`;
};

const formatConfirmation = (booking: Record<string, unknown>): string => {
  const service = getServiceById(String(booking.service_type));
  const startsAt = buildStartsAtISO(String(booking.date), String(booking.time));
  const when = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(startsAt));

  return `You're all set! Your ${service?.name ?? 'appointment'} is confirmed for ${when}.`;
};

const persistContext = async (
  sessionId: string,
  context: ChatContext,
  status?: string,
): Promise<void> => {
  if (status) {
    await query(
      `UPDATE chat_sessions SET context = $1, status = $2, updated_at = now() WHERE id = $3`,
      [context, status, sessionId],
    );
    return;
  }

  await query(
    `UPDATE chat_sessions SET context = $1, updated_at = now() WHERE id = $2`,
    [context, sessionId],
  );
};

const closeActiveSessions = async (userId: string): Promise<void> => {
  await query(
    `UPDATE chat_sessions SET status = 'closed', updated_at = now()
     WHERE user_id = $1 AND status = 'active'`,
    [userId],
  );
};

// returns 404 for missing or wrong owner — avoids leaking session existence
const loadOwnedSession = async (sessionId: string, userId: string): Promise<SessionRow> => {
  const result = await query(
    `SELECT ${SESSION_FIELDS}
     FROM chat_sessions
     WHERE id = $1 AND user_id = $2`,
    [sessionId, userId],
  );

  if (result.rows.length === 0) {
    throw AppError('Session not found', 404, 'NOT_FOUND');
  }

  return result.rows[0] as SessionRow;
};

export const findOrCreateSession = async (
  userId: string,
): Promise<{ session: ChatSession; messages: ChatMessage[]; created: boolean }> => {
  await closeActiveSessions(userId);

  const context = initialContext();
  const result = await query(
    `INSERT INTO chat_sessions (business_id, user_id, context)
     VALUES ($1, $2, $3)
     RETURNING ${SESSION_FIELDS}`,
    [DEFAULT_BUSINESS_ID, userId, context],
  );

  const row = result.rows[0] as SessionRow;
  return {
    session: mapSession(row),
    messages: row.context.messages,
    created: true,
  };
};

export const getSessionMessages = async (
  sessionId: string,
  userId: string,
): Promise<{ messages: ChatMessage[]; status: string }> => {
  const row = await loadOwnedSession(sessionId, userId);
  return { messages: row.context.messages, status: row.status };
};

export const handleUserMessage = async (
  sessionId: string,
  userId: string,
  content: string,
): Promise<HandleMessageResult> => {
  const row = await loadOwnedSession(sessionId, userId);

  if (row.status !== 'active') {
    throw AppError('This chat session is closed', 409, 'SESSION_CLOSED');
  }

  const context = row.context;
  context.messages.push({ role: 'user', content, at: new Date().toISOString() });

  const recentMessages = context.messages.slice(-10).map(({ role, content: text }) => ({
    role,
    content: text,
  }));

  const { name: businessName } = await businessService.getBusinessForUser(userId);

  const aiResult = await extractBookingIntent({
    messages: recentMessages,
    knownBooking: context.booking as Record<string, string | null>,
    businessName,
    sessionId,
  });

  // --- decision tree (interview material) ---

  // 1. AI unavailable → form fallback, don't penalize user
  if (!aiResult.success) {
    const reply = assistantReply(
      "I'm having trouble understanding right now — you can book directly with this quick form.",
    );
    context.messages.push(reply);
    await persistContext(sessionId, context);

    return {
      reply,
      action: 'show_form',
      formDefaults: toFormDefaults(context.booking),
    };
  }

  const ai = aiResult.data;
  if (mergeExtractedBooking(context.booking, ai)) {
    context.attempts = 0;
  }

  // 2a. off-topic / other → count toward form fallback (greeting alone does not)
  if (ai.intent !== 'book_appointment') {
    if (ai.intent !== 'greeting') {
      const fallback = tryFormFallback(context, ai.reply);
      if (fallback) {
        await persistContext(sessionId, context);
        return fallback;
      }
    }

    const reply = assistantReply(ai.reply);
    context.messages.push(reply);
    await persistContext(sessionId, context);
    return { reply, action: null };
  }

  // 2b. booking intent but incomplete → follow-up or form after max attempts
  if (!isBookingComplete(context.booking)) {
    const fallback = tryFormFallback(
      context,
      "Let me make this easier — I've pre-filled what I have:",
    );
    if (fallback) {
      await persistContext(sessionId, context);
      return fallback;
    }

    const reply = assistantReply(ai.reply);
    context.messages.push(reply);
    await persistContext(sessionId, context);
    return { reply, action: null };
  }

  // 2c. booking complete → create appointment via appointment.service
  try {
    const appointment = await appointmentService.createAppointment(
      userId,
      {
        serviceType: String(context.booking.service_type) as ServiceId,
        startsAt: buildStartsAtISO(String(context.booking.date), String(context.booking.time)),
        notes: context.booking.notes ? String(context.booking.notes) : undefined,
      },
      'chat',
    );

    const reply = assistantReply(formatConfirmation(context.booking));
    context.messages.push(reply);
    context.booking = {};
    context.attempts = 0;
    await persistContext(sessionId, context, 'closed');

    return {
      reply,
      action: 'booking_confirmed',
      appointment,
    };
  } catch (err) {
    if (isAppError(err)) {
      if (err.code === 'SLOT_TAKEN') {
        delete context.booking.time;
        const reply = assistantReply('That slot is already booked — what other time works?');
        context.messages.push(reply);
        await persistContext(sessionId, context);
        return { reply, action: null };
      }

      if (err.code === 'INVALID_DATE') {
        delete context.booking.date;
        delete context.booking.time;
        const reply = assistantReply(
          "That time has already passed — please pick a future date and time.",
        );
        context.messages.push(reply);
        await persistContext(sessionId, context);
        return { reply, action: null };
      }

      if (err.code === 'OUTSIDE_BUSINESS_HOURS') {
        delete context.booking.time;
        const reply = assistantReply(
          "We're open Mon–Fri, 9:00–17:00. Could you pick a time within those hours?",
        );
        context.messages.push(reply);
        await persistContext(sessionId, context);
        return { reply, action: null };
      }
    }

    throw err;
  }
};
