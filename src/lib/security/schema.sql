-- Sovereign Security Core: GSOCC Database Schema

-- 1. Security Events (Raw Stream)
CREATE TABLE IF NOT EXISTS public.gsocc_security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(50) NOT NULL, -- e.g., 'LOGIN_FAILED', 'RATE_LIMIT_EXCEEDED', 'SQL_INJECTION_ATTEMPT'
    severity VARCHAR(20) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    source_ip INET,
    user_id UUID,
    session_id VARCHAR(255),
    endpoint VARCHAR(255),
    payload JSONB,
    risk_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast time-series filtering
CREATE INDEX IF NOT EXISTS idx_gsocc_events_created_at ON public.gsocc_security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_gsocc_events_source_ip ON public.gsocc_security_events(source_ip);

-- 2. Active Incidents (GSOCC Workflow Cards)
CREATE TABLE IF NOT EXISTS public.gsocc_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'OPEN', -- 'OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    affected_components JSONB,
    root_cause TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID
);

-- 3. Incident Events Link (Understand)
CREATE TABLE IF NOT EXISTS public.gsocc_incident_events (
    incident_id UUID REFERENCES public.gsocc_incidents(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.gsocc_security_events(id) ON DELETE CASCADE,
    PRIMARY KEY (incident_id, event_id)
);

-- 4. Evidence Logs (Immutable - Prove)
CREATE TABLE IF NOT EXISTS public.gsocc_evidence_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID REFERENCES public.gsocc_incidents(id),
    action_taken VARCHAR(100) NOT NULL, -- e.g., 'ACCOUNT_ISOLATED', 'IP_BLOCKED'
    executed_by UUID, -- System or Admin ID
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    evidence_snapshot JSONB NOT NULL,
    hash_signature VARCHAR(255) -- Tamper-evident hash
);

-- 5. Active Security Rules (Prevent)
CREATE TABLE IF NOT EXISTS public.gsocc_security_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_type VARCHAR(50), -- 'IP_BLOCK', 'USER_ISOLATE', 'RATE_LIMIT_ADJUST'
    target_value VARCHAR(255), -- The IP, User ID, etc.
    action VARCHAR(50) DEFAULT 'BLOCK',
    expires_at TIMESTAMPTZ, -- For temporary blocks
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    reason TEXT,
    incident_id UUID REFERENCES public.gsocc_incidents(id)
);
CREATE INDEX IF NOT EXISTS idx_gsocc_rules_target ON public.gsocc_security_rules(target_value);

-- RLS (Row Level Security) - Ensure only Admins can read/write
ALTER TABLE public.gsocc_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsocc_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsocc_incident_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsocc_evidence_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gsocc_security_rules ENABLE ROW LEVEL SECURITY;
