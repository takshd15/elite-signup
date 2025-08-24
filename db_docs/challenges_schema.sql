BEGIN;

-- ----------------------------------------------------------------------------------
-- Schema
-- ----------------------------------------------------------------------------------
CREATE SCHEMA IF NOT EXISTS challenges_schema;


-- ----------------------------------------------------------------------------------
-- Core reference: public.users_auth must already exist with integer user_id
-- We will reference public.users_auth(user_id) below in all FKs.
-- ----------------------------------------------------------------------------------

-- ----------------------------------------------------------------------------------
-- Challenge catalog
-- ----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges_schema.challenge
(
    id              SERIAL PRIMARY KEY,
    title           TEXT NOT NULL,
    description     TEXT,
    cadence         TEXT NOT NULL CHECK (cadence IN ('daily','monthly')),
    difficulty      TEXT NOT NULL CHECK (difficulty IN ('easy','medium','hard')),
    goals           TEXT[],
    activities      TEXT[],
    tags            TEXT[],
    est_minutes     INTEGER,
    base_xp         INTEGER NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT TRUE
);

-- ----------------------------------------------------------------------------------
-- UserChallenge (assignment instances)
-- ----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges_schema.user_challenge
(
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL,
    challenge_id        INTEGER NOT NULL REFERENCES challenges_schema.challenge(id) ON DELETE CASCADE,
    period_start        DATE NOT NULL,
    period_end          DATE NOT NULL,
    due_at              TIMESTAMPTZ NOT NULL,

    status              TEXT NOT NULL CHECK (status IN ('assigned','in_progress','verified','failed','expired','skipped')),
    progress_pct        INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
    personalized_xp     INTEGER NOT NULL,

    -- privacy-preserving attestation
    submission_sha256   TEXT,
    verifier            TEXT,
    verifier_version    TEXT,
    proof_signature     TEXT,

    started_at          TIMESTAMPTZ,
    verified_at         TIMESTAMPTZ,

    CONSTRAINT uc_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users_auth(user_id) ON DELETE CASCADE,

    CONSTRAINT uc_user_challenge_period_unique UNIQUE (user_id, challenge_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_uc_user_status ON challenges_schema.user_challenge (user_id, status);
CREATE INDEX IF NOT EXISTS idx_uc_due_at     ON challenges_schema.user_challenge (due_at);

-- ----------------------------------------------------------------------------------
-- Daily pack
-- ----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges_schema.daily_pack
(
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    day         DATE NOT NULL,
    title       TEXT,
    notes       TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT daily_pack_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users_auth(user_id) ON DELETE CASCADE,

    CONSTRAINT daily_pack_unique_per_user_day UNIQUE (user_id, day)
);

CREATE TABLE IF NOT EXISTS challenges_schema.daily_pack_item
(
    pack_id             INTEGER NOT NULL,
    user_challenge_id   INTEGER NOT NULL,
    position            INTEGER NOT NULL,
    PRIMARY KEY (pack_id, user_challenge_id),

    CONSTRAINT dpi_pack_fk FOREIGN KEY (pack_id)
        REFERENCES challenges_schema.daily_pack(id) ON DELETE CASCADE,

    CONSTRAINT dpi_uc_fk FOREIGN KEY (user_challenge_id)
        REFERENCES challenges_schema.user_challenge(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_pack_item_position
    ON challenges_schema.daily_pack_item (pack_id, position);

-- ----------------------------------------------------------------------------------
-- Monthly pack
-- ----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges_schema.monthly_pack
(
    id           SERIAL PRIMARY KEY,
    user_id      INTEGER NOT NULL,
    month_start  DATE NOT NULL,  -- first day of month
    title        TEXT,
    notes        TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT monthly_pack_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users_auth(user_id) ON DELETE CASCADE,

    CONSTRAINT monthly_pack_unique_per_user_month UNIQUE (user_id, month_start)
);

CREATE TABLE IF NOT EXISTS challenges_schema.monthly_pack_item
(
    pack_id             INTEGER NOT NULL,
    user_challenge_id   INTEGER NOT NULL,
    position            INTEGER NOT NULL,
    PRIMARY KEY (pack_id, user_challenge_id),

    CONSTRAINT mpi_pack_fk FOREIGN KEY (pack_id)
        REFERENCES challenges_schema.monthly_pack(id) ON DELETE CASCADE,

    CONSTRAINT mpi_uc_fk FOREIGN KEY (user_challenge_id)
        REFERENCES challenges_schema.user_challenge(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_monthly_pack_item_position
    ON challenges_schema.monthly_pack_item (pack_id, position);

-- ----------------------------------------------------------------------------------
-- XP ledger
-- ----------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS challenges_schema.xp_ledger
(
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL,
    delta       INTEGER NOT NULL,
    reason      TEXT NOT NULL CHECK (reason IN ('verified_completion','streak_bonus','adjustment')),
    ref_uc_id   INTEGER NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT xp_user_fk FOREIGN KEY (user_id)
        REFERENCES public.users_auth(user_id) ON DELETE CASCADE,

    CONSTRAINT xp_ref_uc_fk FOREIGN KEY (ref_uc_id)
        REFERENCES challenges_schema.user_challenge(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_xp_user_created ON challenges_schema.xp_ledger (user_id, created_at DESC);

COMMIT;
