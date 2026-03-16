-- =============================================================
-- Cloud IT Service Dashboard - Database Schema
-- Compatible with PostgreSQL (AWS RDS)
-- =============================================================

-- Enable UUID extension (PostgreSQL)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- USERS TABLE
-- Stores both employees and admins
-- =============================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100)  NOT NULL,
    email       VARCHAR(150)  NOT NULL UNIQUE,
    role        VARCHAR(20)   NOT NULL DEFAULT 'employee'
                    CHECK (role IN ('employee', 'admin', 'it_staff')),
    password    VARCHAR(255)  NOT NULL,          -- bcrypt hash
    department  VARCHAR(100),
    avatar_url  VARCHAR(500),
    is_active   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TICKETS TABLE
-- Core service request entity
-- =============================================================
CREATE TABLE tickets (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number   SERIAL UNIQUE,               -- human-readable: TKT-0001
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assignee_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    category        VARCHAR(50) NOT NULL
                        CHECK (category IN ('network', 'hardware', 'software', 'access_request', 'other')),
    priority        VARCHAR(20) NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                        CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    sla_deadline    TIMESTAMPTZ,                 -- computed on insert based on priority
    resolved_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TICKET COMMENTS TABLE
-- Audit trail / communication thread per ticket
-- =============================================================
CREATE TABLE ticket_comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment     TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,  -- internal notes (admin-only)
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- TICKET HISTORY TABLE
-- Full audit log of every status/field change
-- =============================================================
CREATE TABLE ticket_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_id   UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    changed_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_name  VARCHAR(50)  NOT NULL,
    old_value   VARCHAR(200),
    new_value   VARCHAR(200),
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- INDEXES
-- =============================================================
CREATE INDEX idx_tickets_user_id       ON tickets(user_id);
CREATE INDEX idx_tickets_status        ON tickets(status);
CREATE INDEX idx_tickets_priority      ON tickets(priority);
CREATE INDEX idx_tickets_category      ON tickets(category);
CREATE INDEX idx_tickets_created_at    ON tickets(created_at DESC);
CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_history_ticket  ON ticket_history(ticket_id);

-- =============================================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- SLA DEADLINE TRIGGER
-- Sets sla_deadline based on priority at insert time
-- critical=4h  high=8h  medium=24h  low=72h
-- =============================================================
CREATE OR REPLACE FUNCTION set_sla_deadline()
RETURNS TRIGGER AS $$
BEGIN
    NEW.sla_deadline = CASE NEW.priority
        WHEN 'critical' THEN NOW() + INTERVAL '4 hours'
        WHEN 'high'     THEN NOW() + INTERVAL '8 hours'
        WHEN 'medium'   THEN NOW() + INTERVAL '24 hours'
        WHEN 'low'      THEN NOW() + INTERVAL '72 hours'
        ELSE                 NOW() + INTERVAL '24 hours'
    END;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_sla
    BEFORE INSERT ON tickets
    FOR EACH ROW EXECUTE FUNCTION set_sla_deadline();

-- =============================================================
-- SEED DATA — Demo users
-- Passwords are bcrypt of "Password123!"
-- =============================================================
INSERT INTO users (name, email, role, password, department) VALUES
  ('Alice Admin',   'admin@company.com',   'admin',    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgL.J8sFSvCWqRpZ2U7sMi', 'IT'),
  ('Bob IT Staff',  'it@company.com',      'it_staff', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgL.J8sFSvCWqRpZ2U7sMi', 'IT'),
  ('Carol Employee','employee@company.com','employee', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQyCgL.J8sFSvCWqRpZ2U7sMi', 'Finance');
