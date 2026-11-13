-- Rede Solidária Inteligente — schema do banco (PostgreSQL / PGlite)
-- Cinco entidades principais do MVP. Idempotente (CREATE IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('RESIDENT', 'DONOR', 'ORGANIZATION')),
  region TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_requests (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  item TEXT,
  description TEXT NOT NULL,
  quantity INTEGER CHECK (quantity IS NULL OR quantity > 0),
  region TEXT NOT NULL,
  contact_method TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'VALIDATED', 'REJECTED', 'FULFILLED')),
  ai_classification JSONB,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS help_offers (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('DONATION', 'VOLUNTEERING')),
  category TEXT NOT NULL,
  item TEXT,
  description TEXT NOT NULL,
  quantity INTEGER CHECK (quantity IS NULL OR quantity > 0),
  region TEXT NOT NULL,
  availability TEXT,
  status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE', 'RESERVED', 'UNAVAILABLE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES help_requests(id) ON DELETE CASCADE,
  offer_id TEXT NOT NULL REFERENCES help_offers(id) ON DELETE CASCADE,
  compatibility_reason TEXT NOT NULL,
  requester_interested BOOLEAN NOT NULL DEFAULT FALSE,
  provider_interested BOOLEAN NOT NULL DEFAULT FALSE,
  status TEXT NOT NULL DEFAULT 'SUGGESTED'
    CHECK (status IN ('SUGGESTED', 'INTERESTED', 'PENDING_CONFIRMATION', 'CONFIRMED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (request_id, offer_id)
);

CREATE TABLE IF NOT EXISTS attendances (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  validated_by TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_help_requests_status ON help_requests (status);
CREATE INDEX IF NOT EXISTS idx_help_offers_status ON help_offers (status);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches (status);
