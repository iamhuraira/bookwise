# BookWise — AI-Assisted Appointment Booking

BookWise is a full-stack **appointment booking system** for a medical clinic — users book via a conversational AI assistant (with a pre-filled form fallback) or a traditional booking form. Built as a Senior Full Stack Developer assessment: Express + PostgreSQL backend, Next.js frontend, Mistral-powered intent extraction with strict separation between AI parsing and business logic.

**Links**

- Live demo (frontend): [https://bookwise-frontend-omega.vercel.app/](https://bookwise-frontend-omega.vercel.app/)
- Demo video: [https://www.loom.com/share/08a29b81685148e290d9f2a3865a4e17](https://www.loom.com/share/08a29b81685148e290d9f2a3865a4e17)
- Demo credentials: `iamhuraira429@gmail.com` / `4123004abh`
- Live API (backend): `https://bookwise-eh6p.onrender.com/api` *(example — replace if redeployed)*

---

## Features

- **JWT authentication** — signup, login, bcrypt password hashing, protected routes
- **Conversational booking** — multi-turn chat with session memory (`service_type`, date, time, notes)
- **Form-based booking** — standalone page + inline form in chat when AI struggles
- **AI → form fallback** — after 3 confused/off-topic turns or AI failure, returns `show_form` with pre-filled defaults
- **Appointment dashboard** — upcoming/past lists, cancel pending/confirmed appointments
- **Double-booking prevention** — PostgreSQL GiST exclusion constraint; API maps `23P01` → `409 SLOT_TAKEN`
- **Rate limiting** — auth endpoints (10 / 15 min), chat messages (20 / min)
- **AI interaction logging** — structured JSON logs per Mistral call (intent, latency; no message bodies)
- **Server-side validation** — business hours, future dates, `ends_at` computed server-side

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Next.js 15 (App Router) — localhost:3000                       │
│  TanStack Query (server state) · Zustand (auth token only)        │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST / JSON  { data } | { error }
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Express API — /api/*                                           │
│  cors → requestLogger → express.json → routes → errorHandler    │
│  Per-route: requireAuth · validate(zod) · rateLimit               │
└──────┬──────────────────────────────┬───────────────────────────┘
       │                              │
       │  pg (raw SQL)                │  HTTPS (15s timeout)
       ▼                              ▼
┌──────────────────┐         ┌─────────────────────┐
│  PostgreSQL      │         │  Mistral API         │
│  (Supabase)      │         │  (ai.service.ts)     │
│                  │         │  JSON extraction ONLY│
└──────────────────┘         └──────────┬──────────┘
                                        │ called by
                                        ▼
                              ┌─────────────────────┐
                              │  chat.service.ts     │
                              │  (orchestrator)      │
                              │  decision tree       │
                              └──────────┬──────────┘
                                         │ on complete
                                         ▼
                              ┌─────────────────────┐
                              │ appointment.service  │
                              │ rules + INSERT       │
                              └─────────────────────┘
```

**Layering:** `routes → controllers → services → db`. Controllers are thin; services own business logic.

**Critical boundary:** `ai.service.ts` converts conversation → structured JSON only. It never touches the database, never creates appointments, and never decides what action to take. `chat.service.ts` (orchestrator) merges extracted fields, runs the decision tree, and calls `appointment.service.ts` to execute bookings with full validation. The AI never writes to the database.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js 15 (App Router) | File-based routing, React 19, production build |
| Styling | Tailwind CSS 3 | Utility-first, fast iteration |
| Server state | TanStack Query 5 | Caching, mutations, optimistic chat updates |
| Client auth | Zustand + persist | Token in `localStorage`; all other data in Query |
| Backend | Express 4 + TypeScript | Simple REST, explicit middleware chain |
| Database | PostgreSQL (Supabase hosted) | Managed Postgres; app uses raw `pg`, not Supabase SDK |
| SQL | `pg` pool, hand-written queries | Portable, no ORM magic; assessment evaluates *my* data layer |
| AI | `@mistralai/mistralai` | Structured JSON extraction via `json_object` response format |
| Auth | JWT + bcrypt | Stateless API; works across separate frontend/backend deploys |
| Validation | Zod v4 | Request schemas + shared types |
| Rate limits | `express-rate-limit` | Protect auth and AI budget |

---

## Running Locally

### Prerequisites

- **Node.js 20+** (no `engines` field in `package.json`; tested with Node 20–24)
- **npm** (workspaces monorepo at repo root)
- **Supabase** project (free tier) for PostgreSQL

### 1. Clone and install

```bash
git clone https://github.com/iamhuraira/bookwise.git
cd bookwise
npm install
```

Installs root, `backend/`, and `frontend/` workspaces.

### 2. Database setup

1. Create a [Supabase](https://supabase.com) project.
2. Open **SQL Editor** → paste and run `backend/src/db/schema.sql`.
3. (Optional) Run `backend/src/db/seed.sql` — inserts default business `Shifa Medical Clinic, Lahore`.

See `backend/src/db/README.md` for design notes.

### 3. Environment variables

**Backend** — copy and fill:

```bash
cp backend/.env.example backend/.env
```

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Default `4000` |
| `DATABASE_URL` | Yes | PostgreSQL URI. **Local:** direct connection (`db.<ref>.supabase.co:5432`). **Render/cloud:** use Supabase **Session pooler** URI (`postgres.<ref>@...pooler.supabase.com:5432`) |
| `JWT_SECRET` | Yes | Signing key. Generate: `openssl rand -base64 48` |
| `JWT_EXPIRES_IN` | No | Default `1d` |
| `DEFAULT_BUSINESS_ID` | No | Default `11111111-1111-1111-1111-111111111111` (must match seed) |
| `MISTRAL_API_KEY` | Yes (chat) | Free key at [console.mistral.ai](https://console.mistral.ai) |
| `MISTRAL_MODEL` | No | Default `mistral-small-latest` |
| `FRONTEND_URL` | Yes | CORS origin — **no trailing slash**, e.g. `http://localhost:3000` or `https://bookwise-frontend-omega.vercel.app` |

**Frontend:**

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend base including `/api`, e.g. `http://localhost:4000/api` |

### 4. Start dev servers

```bash
npm run dev
```

- Frontend: http://localhost:3000  
- Backend: http://localhost:4000/api  

### 5. Verify

```bash
curl http://localhost:4000/api/health
# {"status":"ok"}

curl http://localhost:4000/api/services
# {"data":{"services":[...]}}
```

Open http://localhost:3000 → sign up → book via chat or `/appointments/new`.

---

## API Overview

**Envelope:** Success `{ "data": ... }` · Error `{ "error": { "message", "code", "details?" } }`

**Exception:** `GET /api/health` returns `{ "status": "ok" }` (no wrapper).

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/health` | No | Liveness |
| POST | `/api/auth/signup` | No | Register customer |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/business` | Yes | Business name for logged-in user |
| GET | `/api/services` | No | Service catalog |
| GET | `/api/appointments` | Yes | Upcoming + past appointments |
| POST | `/api/appointments` | Yes | Create appointment (`booked_via: form`) |
| PATCH | `/api/appointments/:id/cancel` | Yes | Cancel own appointment |
| POST | `/api/chat/sessions` | Yes | Close prior sessions, create new chat |
| GET | `/api/chat/sessions/:id/messages` | Yes | Poll messages + status |
| POST | `/api/chat/sessions/:id/messages` | Yes | Send message, run AI + decision tree |

**Common status codes:** `400` validation · `401` auth · `403` not owner · `404` not found · `409` conflict (slot taken, email taken, session closed) · `429` rate limited · `500` unexpected

---

## How the AI Booking Flow Works

One user message lifecycle:

1. **Persist user message** — append to `chat_sessions.context.messages` (JSONB).
2. **Build AI prompt** — system prompt includes today's date/timezone, service catalog, business hours (Mon–Fri 9–17, 30-min slots), and `knownBooking` fields already collected.
3. **Single Mistral call** — `responseFormat: json_object`, temperature `0.2`, 15s timeout. Returns `{ intent, service_type, date, time, notes, reply }`.
4. **Validate & sanitize** — regex-check date/time; whitelist intent and service IDs.
5. **Merge into session** — non-null extracted fields update `context.booking`; new fields reset `attempts` to 0.
6. **Decision tree** (`chat.service.ts`):
   - AI failure → `show_form` (no attempt penalty)
   - Not `book_appointment` intent → greeting: reply only; off-topic/other: increment attempts → form after **3** attempts
   - `book_appointment` but incomplete → AI reply asks **one** missing field; form after 3 attempts
   - Complete → `appointment.service.createAppointment(..., 'chat')` → `booking_confirmed`, session `closed`
   - Booking errors → clear bad fields, ask again (`SLOT_TAKEN`, `INVALID_DATE`, `OUTSIDE_BUSINESS_HOURS`)
7. **Respond** — `{ reply, action, formDefaults?, appointment? }` in same HTTP response.

**Guardrails**

- Forced `json_object` response format from Mistral
- 15s timeout; failure → form fallback
- Field-level sanitization of all AI output
- Business rules in `appointment.service` (hours, future date, duration)
- GiST exclusion constraint as final safety net against races
- Structured `ai_interaction` logs (no raw message content)

---

## Key Design Decisions & Tradeoffs

### 1. Polling over WebSockets

Chat is strictly request→response: the assistant reply returns in the same `POST /messages` response. Frontend also polls `GET /messages` every **3s** (pauses while sending). WebSockets earn their complexity only when the server pushes unprompted events (live agent handoff, streaming). At this scale, polling is simpler and good enough.

### 2. JWT over server sessions

The frontend and backend can run on different domains (e.g. Vercel + Render) without a shared session database. After login, the API returns a JWT; the frontend sends it on each request. Tokens expire after 1 day. Stored in `localStorage` — simple for a SPA, with the usual XSS tradeoff.

### 3. Raw `pg` over Supabase SDK / ORM

Supabase is used purely as managed Postgres. The assessment evaluates my auth, API, and data layer. Raw SQL keeps the backend portable to any Postgres host.

### 4. DB-level double-booking prevention

GiST exclusion on `(business_id, tstzrange(starts_at, ends_at))` for `pending`/`confirmed` rows. No check-then-insert race. API maps Postgres `23P01` → `409 SLOT_TAKEN`. Assumption: one bookable resource per business (multi-staff would add `staff_id` to the constraint).

### 5. AI / business-logic boundary

The AI only reads the conversation and returns structured data (intent, date, time, etc.). It does not book appointments or touch the database. `chat.service.ts` decides what to do next (ask a question, show the form, or book). `appointment.service.ts` runs the actual booking with server-side rules. If the AI returns a bad date or time, validation and the database catch it. To switch AI providers, only `ai.service.ts` needs to change.

### 6. Messages in `chat_sessions.context` JSONB

One read + one write per turn; booking memory cannot desync from message history. Tradeoff: no cheap pagination. At scale: separate `chat_messages` table.

### 7. Server computes `ends_at`

Client sends only `startsAt` + `serviceType`. Duration comes from server catalog. Never trust client-derived end times.

### 8. Cancel, never delete

`PATCH .../cancel` sets `status = cancelled`. Partial exclusion index ignores cancelled rows, freeing the slot. Preserves audit trail.

### 9. State management split

TanStack Query owns **all** server data (appointments, chat, business, services). Zustand holds **only** the auth token (+ in-memory user). No duplicated sources of truth.

### 10. Schema-first (no migrations)

Requirements were fully specified upfront; `schema.sql` applied manually in Supabase SQL Editor. Production would use versioned migrations (Flyway, Drizzle, etc.).

---

## Database Design

| Table | Purpose |
|-------|---------|
| `businesses` | Tenant/clinic records |
| `users` | Auth; `business_id` links staff; customers get `DEFAULT_BUSINESS_ID` at signup |
| `appointments` | Bookings with `starts_at`/`ends_at`, status, `booked_via` |
| `chat_sessions` | `context` JSONB: messages + in-progress booking + attempt counter |

**Indexes**

- `idx_appointments_user` — dashboard list by user
- `idx_appointments_business` — business-wide schedule queries
- `idx_appointments_slot` — **partial** index on active slots only (`pending`/`confirmed`); cancelled/completed rows excluded → smaller index, faster availability checks
- `idx_users_business` — staff lookup
- `idx_sessions_user` — find user's chat sessions

**Multi-tenancy:** `business_id` on appointments and sessions. Prototype assumes single tenant via `DEFAULT_BUSINESS_ID`.

**At scale:** partition/archive old appointments, separate chat messages table, read replicas for list endpoints, connection pooler under load.

---

## Assumptions

- Single business, single bookable resource (no staff/resource columns)
- Business hours Mon–Fri 09:00–17:00; frontend time slots are 30-minute increments
- Service catalog is hardcoded in `backend/src/config/services.ts` — all services use 30-minute duration
- New chat session created on every `/chat` visit (prior active sessions closed)
- No email/SMS notifications
- No password reset; no timezone picker (server/client local offset embedded in ISO strings)
- One user cannot have multiple active chat sessions (previous closed on new visit)

---

## Known Limitations & Next Steps

- **Reschedule** — atomic cancel + rebook in one transaction
- **Refresh tokens** — longer sessions with revocable refresh flow
- **Separate `chat_messages` table** — pagination, analytics, cheaper appends
- **Streaming AI responses** — SSE/WebSocket for token streaming
- **Admin dashboard** — business view of all appointments
- **Tests (priority order):**
  1. `appointment.service` — business hours, future date, overlap → `SLOT_TAKEN`
  2. `chat.service` decision tree with mocked AI responses
  3. `errorHandler` — `23P01` → `409` mapping
  4. Auth signup/login integration tests

---

## Deploy Backend on Render

See `render.yaml` blueprint or configure manually:

| Setting | Value |
|---------|-------|
| Root Directory | `backend` **or** repo root |
| Build Command | `npm install && npm run build` (from `backend/`) **or** `npm install && npm run build --workspace=backend` |
| Start Command | `npm run start` **or** `npm run start --workspace=backend` |

Use Supabase **Session pooler** `DATABASE_URL` on Render. Set `FRONTEND_URL` to your frontend origin for CORS (no trailing slash).

---

## Project Structure

```
bookwise/
├── backend/          Express API, services, db schema
├── frontend/         Next.js app
├── docs/             architecture.md (interview deep-dive)
├── render.yaml       Render blueprint (backend only)
└── package.json      npm workspaces root
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Backend + frontend concurrently |
| `npm run dev:backend` | Backend only (:4000) |
| `npm run dev:frontend` | Frontend only (:3000) |
| `npm run build` | Build backend |
| `npm run build:frontend` | Build frontend |
| `npm start` | Run backend production server |

---

## Further Reading

- [`docs/architecture.md`](docs/architecture.md) — request lifecycle, decision tree, middleware order, exclusion constraint details
