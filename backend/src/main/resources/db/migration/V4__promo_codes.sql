-- V4__promo_codes.sql
-- Table for promotional discounts, group vouchers, and affiliate tracking

CREATE TABLE IF NOT EXISTS promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    code VARCHAR(30) NOT NULL UNIQUE,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE', -- 'PERCENTAGE' or 'FIXED_AMOUNT'
    discount_value NUMERIC(10, 2) NOT NULL,
    min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
    max_discount_amount NUMERIC(10, 2),
    max_uses INT DEFAULT 100,
    times_used INT DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_event ON promo_codes(event_id);

-- Insert demo promo codes for seeded events
INSERT INTO promo_codes (id, event_id, code, discount_type, discount_value, min_order_amount, max_uses, times_used, is_active)
VALUES 
    ('p1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'ROPHNAN20', 'PERCENTAGE', 20.00, 500.00, 200, 14, TRUE),
    ('p2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'ADDIS100', 'FIXED_AMOUNT', 100.00, 400.00, 500, 32, TRUE),
    ('p3333333-3333-3333-3333-333333333333', 'e2222222-2222-2222-2222-222222222222', 'TECHVIP', 'PERCENTAGE', 15.00, 1000.00, 100, 5, TRUE)
ON CONFLICT (code) DO NOTHING;
