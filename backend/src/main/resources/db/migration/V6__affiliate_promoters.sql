-- =========================================================
-- EthioEvents: Promoter & Influencer Affiliate Schema
-- Tracks referral links, clicks, ticket conversions, and commission splits
-- =========================================================

CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    organizer_id UUID REFERENCES organizers(id) ON DELETE SET NULL,
    affiliate_code VARCHAR(50) NOT NULL UNIQUE,
    promoter_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(100),
    bank_name VARCHAR(100) DEFAULT 'Commercial Bank of Ethiopia (CBE)',
    bank_account_no VARCHAR(50),
    bank_account_name VARCHAR(100),
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00, -- Default 5% commission
    total_clicks INT NOT NULL DEFAULT 0,
    total_conversions INT NOT NULL DEFAULT 0,
    total_sales_etb DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_commission_etb DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_commission_etb DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    order_amount DECIMAL(12,2) NOT NULL,
    commission_amount DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED', -- 'PENDING', 'CONFIRMED', 'PAID'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_phone ON affiliates(phone_number);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_affiliate ON affiliate_referrals(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_order ON affiliate_referrals(order_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_referrals_event ON affiliate_referrals(event_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate ON affiliate_clicks(affiliate_id);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_code VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_orders_affiliate_code ON orders(affiliate_code);
