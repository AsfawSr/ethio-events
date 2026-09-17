-- V11: Organizer SMS Broadcast Campaigns & Automated Pre-Event Reminders (AfroMessage Engine)

CREATE TABLE IF NOT EXISTS event_broadcast_campaigns (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    target_filter VARCHAR(50) NOT NULL DEFAULT 'ALL_ATTENDEES',
    target_ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
    message_content TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en',
    recipient_count INT NOT NULL DEFAULT 0,
    delivered_count INT NOT NULL DEFAULT 0,
    failed_count INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
    scheduled_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_event_id ON event_broadcast_campaigns(event_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_organizer_id ON event_broadcast_campaigns(organizer_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_status ON event_broadcast_campaigns(status);

CREATE TABLE IF NOT EXISTS event_automated_reminders (
    id UUID PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'T_MINUS_24_HOURS', 'T_MINUS_2_HOURS'
    enabled BOOLEAN NOT NULL DEFAULT true,
    sent_at TIMESTAMP WITH TIME ZONE,
    total_sent INT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_event_reminder_type UNIQUE (event_id, reminder_type)
);

CREATE INDEX IF NOT EXISTS idx_reminder_event_id ON event_automated_reminders(event_id);
CREATE INDEX IF NOT EXISTS idx_reminder_type_status ON event_automated_reminders(reminder_type, status);
