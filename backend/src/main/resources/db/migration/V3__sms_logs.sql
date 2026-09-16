-- V3__sms_logs.sql
-- Table for tracking outgoing SMS delivery and gateway audit logs

CREATE TABLE IF NOT EXISTS sms_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(25) NOT NULL,
    message_type VARCHAR(30) NOT NULL,
    provider VARCHAR(30) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'SENT',
    content TEXT NOT NULL,
    external_message_id VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_logs_phone ON sms_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_sms_logs_created_at ON sms_logs(created_at DESC);
