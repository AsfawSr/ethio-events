-- Phase 10: Ticket Transfers & Re-Signing Schema
CREATE TABLE ticket_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender_name VARCHAR(100) NOT NULL,
    sender_phone VARCHAR(30) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    reason VARCHAR(255),
    previous_security_hash VARCHAR(64) NOT NULL,
    new_security_hash VARCHAR(64) NOT NULL,
    previous_signature TEXT NOT NULL,
    new_signature TEXT NOT NULL,
    transferred_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transfers_ticket_id ON ticket_transfers(ticket_id);
CREATE INDEX idx_transfers_recipient_phone ON ticket_transfers(recipient_phone);
CREATE INDEX idx_transfers_sender_phone ON ticket_transfers(sender_phone);
CREATE INDEX idx_transfers_prev_hash ON ticket_transfers(previous_security_hash);
CREATE INDEX idx_transfers_new_hash ON ticket_transfers(new_security_hash);
