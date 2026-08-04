/*
 * The AI service ONLY converts conversation → structured JSON. It never touches the
 * database (except logging), never creates appointments, never makes business decisions.
 * All decisions live in chat.service.ts; all booking execution lives in appointment.service.ts.
 */

import { Mistral } from '@mistralai/mistralai';
import { SERVICES, type ServiceId } from '../config/services.js';

const MODEL = process.env.MISTRAL_MODEL ?? 'mistral-small-latest';
const TIMEOUT_MS = 15_000;

const INTENTS = ['book_appointment', 'greeting', 'off_topic', 'other'] as const;
type Intent = (typeof INTENTS)[number];

const SERVICE_IDS = SERVICES.map((s) => s.id);

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface KnownBooking {
  service_type?: string | null;
  date?: string | null;
  time?: string | null;
  notes?: string | null;
}

export interface ExtractedBooking {
  intent: Intent;
  service_type: ServiceId | null;
  date: string | null;
  time: string | null;
  notes: string | null;
  reply: string;
}

export type ExtractBookingIntentResult =
  | { success: true; data: ExtractedBooking }
  | { success: false; error: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

const getClient = (): Mistral | null => {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return null;
  return new Mistral({ apiKey });
};

const serverNowContext = (): { date: string; weekday: string; timezone: string } => {
  const now = new Date();
  return {
    date: now.toLocaleDateString('en-CA'),
    weekday: now.toLocaleDateString('en-US', { weekday: 'long' }),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
};

const buildSystemPrompt = (businessName: string, knownBooking: KnownBooking): string => {
  const { date, weekday, timezone } = serverNowContext();
  const servicesList = SERVICES.map(
    (s) => `- ${s.id}: ${s.name} (${s.durationMinutes} min)`,
  ).join('\n');

  return `You are the booking assistant for ${businessName}, a clinic.
You ONLY help with appointments: booking, checking, cancelling.
Politely refuse unrelated topics in one sentence.

TODAY: ${date} (${weekday}), timezone: ${timezone}.
Use this to resolve relative dates like "tomorrow" or "next Friday".

Available services:
${servicesList}

Business hours: Monday–Friday 09:00–17:00, appointments use 30-minute slots.

ALREADY KNOWN booking fields: ${JSON.stringify(knownBooking)}
Never re-ask for fields already known.

Respond ONLY with valid JSON in this exact shape:
{
  "intent": "book_appointment" | "greeting" | "off_topic" | "other",
  "service_type": "consultation" | "checkup" | "followup" | null,
  "date": "YYYY-MM-DD" | null,
  "time": "HH:MM" | null,
  "notes": string | null,
  "reply": "natural, friendly, concise message to the user"
}

Rules for reply:
- If fields are missing, ask for exactly ONE missing field per turn.
- If everything is known, confirm what you are about to book.`;
};

const sanitizeIntent = (value: unknown): Intent => {
  if (typeof value === 'string' && INTENTS.includes(value as Intent)) {
    return value as Intent;
  }
  return 'other';
};

const sanitizeServiceType = (value: unknown): ServiceId | null => {
  if (typeof value === 'string' && SERVICE_IDS.includes(value as ServiceId)) {
    return value as ServiceId;
  }
  return null;
};

const sanitizeDate = (value: unknown): string | null =>
  typeof value === 'string' && DATE_RE.test(value) ? value : null;

const sanitizeTime = (value: unknown): string | null =>
  typeof value === 'string' && TIME_RE.test(value) ? value : null;

const sanitizeReply = (value: unknown): string =>
  typeof value === 'string' && value.trim() ? value.trim() : 'How can I help with your appointment?';

const parseExtracted = (raw: unknown): ExtractedBooking => {
  const obj = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    intent: sanitizeIntent(obj.intent),
    service_type: sanitizeServiceType(obj.service_type),
    date: sanitizeDate(obj.date),
    time: sanitizeTime(obj.time),
    notes: typeof obj.notes === 'string' ? obj.notes : null,
    reply: sanitizeReply(obj.reply),
  };
};

const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('AI request timed out')), ms);
    }),
  ]);

// privacy: do not log full message contents
const logInteraction = (entry: Record<string, unknown>): void => {
  console.log(JSON.stringify({ tag: 'ai_interaction', ...entry }));
};

export const extractBookingIntent = async ({
  messages,
  knownBooking,
  businessName,
  sessionId,
}: {
  messages: AIMessage[];
  knownBooking: KnownBooking;
  businessName: string;
  sessionId?: string;
}): Promise<ExtractBookingIntentResult> => {
  const started = Date.now();
  const client = getClient();

  if (!client) {
    const error = 'MISTRAL_API_KEY is not configured';
    logInteraction({
      sessionId: sessionId ?? null,
      model: MODEL,
      latencyMs: Date.now() - started,
      success: false,
      extracted: null,
      error,
    });
    return { success: false, error };
  }

  try {
    const response = await withTimeout(
      client.chat.complete({
        model: MODEL,
        temperature: 0.2,
        maxTokens: 400,
        responseFormat: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt(businessName, knownBooking) },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
      TIMEOUT_MS,
    );

    const content = response.choices?.[0]?.message?.content;
    const rawText = typeof content === 'string' ? content : null;

    if (!rawText) {
      throw new Error('Empty AI response');
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error('AI response was not valid JSON');
    }

    const data = parseExtracted(parsed);

    logInteraction({
      sessionId: sessionId ?? null,
      model: MODEL,
      latencyMs: Date.now() - started,
      success: true,
      extracted: {
        intent: data.intent,
        service_type: data.service_type,
        date: data.date,
        time: data.time,
        has_notes: Boolean(data.notes),
      },
      error: null,
    });

    return { success: true, data };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown AI error';
    logInteraction({
      sessionId: sessionId ?? null,
      model: MODEL,
      latencyMs: Date.now() - started,
      success: false,
      extracted: null,
      error,
    });
    return { success: false, error };
  }
};
