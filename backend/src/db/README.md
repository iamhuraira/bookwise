# BookWise Database

PostgreSQL schema for the BookWise booking platform. Plain SQL — no ORM, no migration tooling.

## How to apply

1. Create a [Supabase](https://supabase.com) project (free tier is sufficient).
2. Open **SQL Editor** → paste the full contents of [`schema.sql`](./schema.sql) → **Run**.
3. (Optional) Run [`seed.sql`](./seed.sql) to insert the default business:

   | Column | Value |
   |--------|-------|
   | `id` | `11111111-1111-1111-1111-111111111111` |
   | `name` | `Shifa Medical Clinic, Lahore` |

   Must match `DEFAULT_BUSINESS_ID` in `backend/.env`.

4. Verify in **Table Editor** — four tables: `businesses`, `users`, `appointments`, `chat_sessions`.

`schema.sql` uses `IF NOT EXISTS` / `CREATE EXTENSION IF NOT EXISTS`, so re-running is safe for idempotent objects.

## Connection strings

| Environment | Connection type | Notes |
|-------------|-----------------|-------|
| **Local dev** | Direct (`db.<ref>.supabase.co:5432`) | Works from your machine |
| **Render / cloud** | **Session pooler** (`...pooler.supabase.com:5432`, user `postgres.<ref>`) | Required for IPv4 hosts like Render |

Copy the URI from Supabase → **Project Settings → Database → Connection string → Session pooler**.

## Tables

| Table | Role |
|-------|------|
| `businesses` | Clinic/tenant |
| `users` | Auth; `business_id` for staff; customers assigned at signup |
| `appointments` | Bookings with GiST overlap prevention |
| `chat_sessions` | JSONB `context` = messages + booking progress + attempt counter |

## Design decisions

**JSONB for chat context**

Multi-step booking collects fields across turns. Embedding messages and `booking` state in `chat_sessions.context` gives one read + one write per turn — memory cannot desync from history. At scale: split into `chat_messages` table.

**Partial index on appointments**

`idx_appointments_slot` indexes only `status IN ('pending', 'confirmed')`. Cancelled/completed rows do not block availability and are excluded from the index → smaller, faster slot checks.

**Overlap prevention**

`no_overlapping_appointments` (GiST) prevents two active bookings at the same business from overlapping in time. Requires `btree_gist` extension. Application maps Postgres `23P01` → HTTP `409 SLOT_TAKEN`.

**business_id for multi-tenancy**

Every appointment and chat session belongs to a business. Prototype uses a single `DEFAULT_BUSINESS_ID` for all customers.

## Performance at scale

- **Separate chat messages table** when conversations grow long
- **Read replicas** for appointment lists and chat reads
- **Archive closed sessions** older than N days
- **Connection pooler** (Supabase Supavisor) under concurrent load

## Related docs

- Root [`README.md`](../../README.md) — full setup and env vars
- [`docs/architecture.md`](../../docs/architecture.md) — exclusion constraint and session lifecycle
