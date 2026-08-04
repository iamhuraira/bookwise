# BookWise Database

PostgreSQL schema for the BookWise booking platform. Plain SQL — no ORM, no migration tooling.

## How to apply

1. Open your [Supabase](https://supabase.com) project → **SQL Editor**.
2. Paste the contents of `schema.sql` and click **Run**.
3. (Optional) Run `seed.sql` to insert one default business.

The schema file uses `IF NOT EXISTS`, so re-running `schema.sql` is safe.

Verify in the Supabase **Table Editor** — you should see four tables: `businesses`, `users`, `appointments`, `chat_sessions`.

## Design decisions

**JSONB for chat context**
Booking conversations are multi-step — the assistant may collect service type, date, and time across several turns. JSONB `context` on `chat_sessions` holds in-progress state and message history without extra tables for now.

**Partial index on appointments**
`idx_appointments_slot` only indexes rows where `status IN ('pending', 'confirmed')`. Cancelled and completed appointments don't block availability, so excluding them keeps the index smaller and makes slot-lookup queries faster.

**Overlap prevention**
`no_overlapping_appointments` stops two active bookings at the same business from overlapping in time.

**business_id for multi-tenancy**
Every appointment and chat session belongs to a business. Staff/admins link to a business via `users.business_id`. Customers can book at any clinic.

## Performance at scale

What I'd add as traffic grows:

- **Split chat messages** into their own table when conversations get long
- **Read replicas** — route appointment list and chat reads to replicas
- **Archive old sessions** — move closed sessions older than N days to cold storage
- **Connection pooling** — use Supabase's pooler (PgBouncer) under load
