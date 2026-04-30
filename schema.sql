-- PostgreSQL schema for PadelScoreLiveBack
-- Run with: psql -U <user> -d <database> -f schema.sql

BEGIN;

-- =====================================================
-- ENUMS
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'spectator');
  END IF;
END
$$;

-- =====================================================
-- TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS terrains (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  label VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pairs (
  id BIGSERIAL PRIMARY KEY,
  player1_id BIGINT NOT NULL,
  player2_id BIGINT NOT NULL,
  category_id BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_pairs_player1 FOREIGN KEY (player1_id) REFERENCES players(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pairs_player2 FOREIGN KEY (player2_id) REFERENCES players(id) ON DELETE RESTRICT,
  CONSTRAINT fk_pairs_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  CONSTRAINT chk_pairs_distinct_players CHECK (player1_id <> player2_id)
);

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  terrain_id BIGINT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_users_terrain FOREIGN KEY (terrain_id) REFERENCES terrains(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS matches (
  id BIGSERIAL PRIMARY KEY,
  terrain_id BIGINT NOT NULL,
  team1_pair_id BIGINT NULL,
  team2_pair_id BIGINT NULL,
  phase VARCHAR(50) NULL,
  score_state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_matches_terrain FOREIGN KEY (terrain_id) REFERENCES terrains(id) ON DELETE CASCADE,
  CONSTRAINT fk_matches_team1_pair FOREIGN KEY (team1_pair_id) REFERENCES pairs(id) ON DELETE SET NULL,
  CONSTRAINT fk_matches_team2_pair FOREIGN KEY (team2_pair_id) REFERENCES pairs(id) ON DELETE SET NULL,
  CONSTRAINT chk_matches_distinct_pairs CHECK (
    team1_pair_id IS NULL
    OR team2_pair_id IS NULL
    OR team1_pair_id <> team2_pair_id
  )
);

-- One scoreboard row per court (required by current backend updates by terrain_id)
CREATE UNIQUE INDEX IF NOT EXISTS ux_matches_terrain_id ON matches(terrain_id);

CREATE INDEX IF NOT EXISTS ix_pairs_category_id ON pairs(category_id);
CREATE INDEX IF NOT EXISTS ix_pairs_player1_id ON pairs(player1_id);
CREATE INDEX IF NOT EXISTS ix_pairs_player2_id ON pairs(player2_id);
CREATE INDEX IF NOT EXISTS ix_users_role ON users(role);
CREATE INDEX IF NOT EXISTS ix_users_terrain_id ON users(terrain_id);
CREATE INDEX IF NOT EXISTS ix_matches_team1_pair_id ON matches(team1_pair_id);
CREATE INDEX IF NOT EXISTS ix_matches_team2_pair_id ON matches(team2_pair_id);

-- Prevent duplicate pair in either order inside same category
CREATE UNIQUE INDEX IF NOT EXISTS ux_pairs_unique_duo_in_category
ON pairs (
  category_id,
  LEAST(player1_id, player2_id),
  GREATEST(player1_id, player2_id)
);

-- =====================================================
-- MIGRATION HELPERS FOR OLD SCHEMA
-- =====================================================

-- Legacy columns from previous schema version are no longer used by backend.
ALTER TABLE matches DROP COLUMN IF EXISTS player1;
ALTER TABLE matches DROP COLUMN IF EXISTS player2;

ALTER TABLE matches ADD COLUMN IF NOT EXISTS team1_pair_id BIGINT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS team2_pair_id BIGINT NULL;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS phase VARCHAR(50) NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_matches_team1_pair'
  ) THEN
    ALTER TABLE matches
      ADD CONSTRAINT fk_matches_team1_pair
      FOREIGN KEY (team1_pair_id) REFERENCES pairs(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_matches_team2_pair'
  ) THEN
    ALTER TABLE matches
      ADD CONSTRAINT fk_matches_team2_pair
      FOREIGN KEY (team2_pair_id) REFERENCES pairs(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_matches_distinct_pairs'
  ) THEN
    ALTER TABLE matches
      ADD CONSTRAINT chk_matches_distinct_pairs
      CHECK (
        team1_pair_id IS NULL
        OR team2_pair_id IS NULL
        OR team1_pair_id <> team2_pair_id
      );
  END IF;
END
$$;

-- =====================================================
-- TRIGGER: auto-update matches.updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION set_matches_updated_at()
RETURNS TRIGGER AS
$$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_matches_set_updated_at ON matches;
CREATE TRIGGER trg_matches_set_updated_at
BEFORE UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION set_matches_updated_at();

-- =====================================================
-- SEED DATA
-- =====================================================

INSERT INTO terrains (name)
VALUES
  ('Terrain 1'),
  ('Terrain 2'),
  ('Terrain 3'),
  ('Terrain 4')
ON CONFLICT (name) DO NOTHING;

INSERT INTO categories (code, label)
VALUES
  ('P100', 'P100'),
  ('P250', 'P250'),
  ('P25', 'P25'),
  ('P50', 'P50'),
  ('P-MIXTE', 'P-Mixte'),
  ('P-FUSION', 'P-Fusion')
ON CONFLICT (code) DO NOTHING;



-- Password: 123456789
INSERT INTO users (username, password_hash, role, terrain_id)
VALUES (
  'admin',
  '$2a$10$2N86q.lYcYnHrUTn556Yweenu0hmiI4IhE/n3onrE7CMbSxl.sXoy',
  'admin',
  NULL
)
ON CONFLICT (username) DO NOTHING;

COMMIT;
