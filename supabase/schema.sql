-- Kaivex Personal OS Database Schema
-- Run this in your Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
    email TEXT NOT NULL DEFAULT 'ahmad@kaivex.local',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'ahmad@kaivex.local')
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('boolean', 'counter')),
    target_value INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    value NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_habit_date UNIQUE (habit_id, date)
);

CREATE TABLE IF NOT EXISTS sleep_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    sleep_time TIMESTAMPTZ NOT NULL,
    wake_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    quality_score NUMERIC NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_sleep_date UNIQUE (user_id, date)
);

CREATE TABLE IF NOT EXISTS nap_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sleep_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    target_bedtime TEXT NOT NULL DEFAULT '22:00',
    target_wake_time TEXT NOT NULL DEFAULT '05:00',
    weight_duration NUMERIC NOT NULL DEFAULT 0.40,
    weight_bedtime NUMERIC NOT NULL DEFAULT 0.30,
    weight_wake NUMERIC NOT NULL DEFAULT 0.30,
    penalty_factor NUMERIC NOT NULL DEFAULT 1.5,
    nap_threshold_minutes INTEGER NOT NULL DEFAULT 60,
    nap_penalty_per_minute NUMERIC NOT NULL DEFAULT 0.5,
    nap_late_cutoff TEXT NOT NULL DEFAULT '16:00',
    late_nap_penalty_factor NUMERIC NOT NULL DEFAULT 1.5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    distance_km NUMERIC(5,2) NOT NULL,
    duration_minutes NUMERIC(6,2) NOT NULL,
    pace TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'manual',
    strava_activity_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pipeline_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    linkedin_url TEXT,
    current_stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE CASCADE,
    last_contact_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    notes TEXT,
    day_of_week TEXT NOT NULL CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
    week_start_date DATE NOT NULL,
    date DATE NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT FALSE,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_sleep_entries_date ON sleep_entries(date);
CREATE INDEX IF NOT EXISTS idx_nap_entries_date ON nap_entries(date);
CREATE INDEX IF NOT EXISTS idx_runs_date ON runs(date);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_week_start ON tasks(week_start_date);
CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_stage ON pipeline_contacts(current_stage_id);

INSERT INTO sleep_settings (user_id, target_bedtime, target_wake_time, weight_duration, weight_bedtime, weight_wake, penalty_factor, nap_threshold_minutes, nap_penalty_per_minute, nap_late_cutoff, late_nap_penalty_factor)
VALUES ('00000000-0000-0000-0000-000000000001', '22:00', '05:00', 0.40, 0.30, 0.30, 1.5, 60, 0.5, '16:00', 1.5)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO habits (id, user_id, name, type, target_value, is_active, order_index) VALUES
('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Fajr Prayer', 'boolean', 1, true, 1),
('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Zuhr Prayer', 'boolean', 1, true, 2),
('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Asr Prayer', 'boolean', 1, true, 3),
('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Maghrib Prayer', 'boolean', 1, true, 4),
('11111111-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Isha Prayer', 'boolean', 1, true, 5),
('11111111-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'Run', 'boolean', 1, true, 6),
('11111111-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000001', 'LinkedIn Comments', 'counter', 5, true, 7),
('11111111-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000001', 'LinkedIn Connection Requests', 'counter', 20, true, 8),
('11111111-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000001', 'Conversations / DMs Started', 'counter', 5, true, 9)
ON CONFLICT (id) DO NOTHING;

INSERT INTO pipeline_stages (id, user_id, name, order_index) VALUES
('22222222-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Contacted', 1),
('22222222-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Replied', 2),
('22222222-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Conversation', 3),
('22222222-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Call Booked', 4),
('22222222-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Closed', 5)
ON CONFLICT (id) DO NOTHING;