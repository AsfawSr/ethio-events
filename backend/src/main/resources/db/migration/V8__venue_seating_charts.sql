-- Phase 11: Interactive Venue Seating & VIP Table Floor Plan Schema

CREATE TABLE seating_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
    section_name VARCHAR(100) NOT NULL,
    section_type VARCHAR(30) NOT NULL DEFAULT 'TABLES', -- 'TABLES', 'THEATRE_ROWS', 'BALCONY', 'VIP_LOUNGE'
    layout_config TEXT,
    capacity INT NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id UUID NOT NULL REFERENCES seating_sections(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
    row_identifier VARCHAR(30) NOT NULL, -- e.g. 'Table 1', 'Row A', 'Box 2'
    seat_number VARCHAR(30) NOT NULL,    -- e.g. 'Seat 1', 'Table 1 - Seat 3'
    seat_label VARCHAR(100) NOT NULL,   -- e.g. 'VIP Table 1 - Seat A'
    grid_row INT NOT NULL DEFAULT 0,
    grid_col INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'HELD', 'BOOKED', 'BLOCKED'
    price_modifier DECIMAL(12, 2) DEFAULT 0.00,
    held_until TIMESTAMP WITH TIME ZONE,
    held_by_session_id VARCHAR(100),
    current_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    current_ticket_id UUID REFERENCES tickets(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add seat tracking to tickets and order_items
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS seat_id UUID REFERENCES seats(id) ON DELETE SET NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS seat_label VARCHAR(100);

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS selected_seat_ids TEXT;

CREATE INDEX idx_seating_sections_event_id ON seating_sections(event_id);
CREATE INDEX idx_seats_event_id ON seats(event_id);
CREATE INDEX idx_seats_section_id ON seats(section_id);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_held_by ON seats(held_by_session_id);
