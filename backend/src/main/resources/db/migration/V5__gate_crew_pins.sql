-- =========================================================
-- EthioEvents: Gate Crew Temporary Access PIN Schema
-- Enables fast turnstile staff authentication on event day
-- =========================================================

CREATE TABLE IF NOT EXISTS gate_crew_pins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
    gate_name VARCHAR(100) NOT NULL DEFAULT 'Main Turnstile Gate',
    pin_code VARCHAR(10) NOT NULL,
    crew_member_name VARCHAR(100),
    expires_at TIMESTAMPTZ NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_used_at TIMESTAMPTZ,
    login_count INT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_gate_crew_pins_event ON gate_crew_pins(event_id);
CREATE INDEX IF NOT EXISTS idx_gate_crew_pins_code ON gate_crew_pins(pin_code);
CREATE INDEX IF NOT EXISTS idx_gate_crew_pins_active ON gate_crew_pins(active);
