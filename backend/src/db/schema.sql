-- BookWise schema (run in Supabase SQL Editor)

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- tenants
CREATE TABLE IF NOT EXISTS businesses (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- business_id null for customers, set for staff/admin
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id   UUID REFERENCES businesses (id) ON DELETE SET NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name     TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'admin')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS appointments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id  UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  starts_at    TIMESTAMPTZ NOT NULL,
  ends_at      TIMESTAMPTZ NOT NULL,
  status       TEXT NOT NULL DEFAULT 'confirmed'
               CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  booked_via   TEXT NOT NULL DEFAULT 'form'
               CHECK (booked_via IN ('chat', 'form')),
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (ends_at > starts_at),
  CONSTRAINT no_overlapping_appointments EXCLUDE USING gist (
    business_id WITH =,
    tstzrange(starts_at, ends_at) WITH &&
  ) WHERE (status IN ('pending', 'confirmed'))
);

CREATE INDEX IF NOT EXISTS idx_appointments_user
  ON appointments (business_id, user_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_business
  ON appointments (business_id, starts_at DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_slot
  ON appointments (business_id, starts_at)
  WHERE status IN ('pending', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_users_business
  ON users (business_id)
  WHERE business_id IS NOT NULL;

-- context jsonb = booking state + chat history for now
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'closed')),
  context     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user
  ON chat_sessions (business_id, user_id, created_at DESC);
