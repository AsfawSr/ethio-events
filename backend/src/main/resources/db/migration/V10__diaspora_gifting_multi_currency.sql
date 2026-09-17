-- V10__diaspora_gifting_multi_currency.sql
-- Add multi-currency support, exchange rates, and diaspora gifting fields to orders

ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10, 4) DEFAULT 1.0000;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS foreign_amount NUMERIC(12, 2);
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(30) DEFAULT 'TELEBIRR';
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS gift_recipient_name VARCHAR(100);
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS gift_recipient_phone VARCHAR(20);
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS gift_message TEXT;
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS purchaser_email VARCHAR(150);
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS purchaser_country VARCHAR(50);
ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_orders_gift_recipient_phone ON orders(gift_recipient_phone);
CREATE INDEX IF NOT EXISTS idx_orders_payment_gateway ON orders(payment_gateway);
