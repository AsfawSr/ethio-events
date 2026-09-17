package com.ethioevents.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

/**
 * Ensures that all necessary database columns, constraints, and indexes
 * are safely applied to PostgreSQL before Hibernate JPA or repository queries run.
 */
@Component
public class DatabaseSchemaInitializer implements BeanPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSchemaInitializer.class);
    private boolean initialized = false;

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof DataSource dataSource && !initialized) {
            initialized = true;
            repairAndInitializeSchema(dataSource);
        }
        return bean;
    }

    private void repairAndInitializeSchema(DataSource dataSource) {
        log.info("╔════════════════════════════════════════════════════════════════════╗");
        log.info("║ [DatabaseSchemaInitializer] Verifying & Healing PostgreSQL Schema  ║");
        log.info("╚════════════════════════════════════════════════════════════════════╝");

        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            // 1. Ensure events table columns exist with appropriate defaults
            stmt.execute("ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'MUSIC_CONCERT'");
            stmt.execute("ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(50) DEFAULT 'BOLE'");
            stmt.execute("ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false");
            stmt.execute("ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS tags VARCHAR(255) DEFAULT ''");
            stmt.execute("ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION");
            stmt.execute("ALTER TABLE IF EXISTS events ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION");

            // Backfill nulls
            stmt.execute("UPDATE events SET featured = false WHERE featured IS NULL");
            stmt.execute("UPDATE events SET category = 'MUSIC_CONCERT' WHERE category IS NULL");
            stmt.execute("UPDATE events SET neighborhood = 'BOLE' WHERE neighborhood IS NULL");
            stmt.execute("UPDATE events SET tags = '' WHERE tags IS NULL");
            stmt.execute("UPDATE events SET latitude = 9.0012, longitude = 38.7853 WHERE latitude IS NULL AND (venue_name ILIKE '%Millennium%' OR neighborhood = 'BOLE')");
            stmt.execute("UPDATE events SET latitude = 9.0145, longitude = 38.7634 WHERE latitude IS NULL AND (venue_name ILIKE '%UNECA%' OR neighborhood = 'KAZANCHIS')");
            stmt.execute("UPDATE events SET latitude = 9.0182, longitude = 38.7523 WHERE latitude IS NULL AND (venue_name ILIKE '%Theatre%' OR neighborhood = 'PIASSA')");
            stmt.execute("UPDATE events SET latitude = 9.0105, longitude = 38.7612 WHERE latitude IS NULL");

            // Safe indexes
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_events_category ON events(category)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_events_neighborhood ON events(neighborhood)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured)");

            // 2. Ensure orders table columns exist
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS affiliate_code VARCHAR(50)");
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC(10, 4) DEFAULT 1.0000");
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS foreign_amount NUMERIC(12, 2)");
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(30) DEFAULT 'TELEBIRR'");
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT false");
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS gift_recipient_name VARCHAR(100)");
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS gift_recipient_phone VARCHAR(20)");
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS gift_message TEXT");
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS purchaser_email VARCHAR(150)");
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS purchaser_country VARCHAR(50)");
            stmt.execute("ALTER TABLE IF EXISTS orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(100)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_orders_gift_recipient_phone ON orders(gift_recipient_phone)");

            // 3. Ensure gate_crew_pins table exists
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS gate_crew_pins (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id UUID,
                    user_id UUID,
                    pin_code VARCHAR(10) NOT NULL,
                    crew_name VARCHAR(100) NOT NULL,
                    role_title VARCHAR(50) DEFAULT 'GATE_CREW',
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """);

            // 4. Ensure promo_codes table exists
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS promo_codes (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id UUID,
                    code VARCHAR(30) NOT NULL,
                    discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
                    discount_value NUMERIC(10, 2) NOT NULL,
                    min_order_amount NUMERIC(10, 2) DEFAULT 0.00,
                    max_discount_amount NUMERIC(10, 2),
                    max_uses INT DEFAULT 100,
                    times_used INT DEFAULT 0,
                    valid_from TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                    valid_until TIMESTAMP WITH TIME ZONE,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """);

            // 5. Ensure affiliates and referral tables exist
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS affiliates (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    organizer_id UUID,
                    event_id UUID,
                    name VARCHAR(100) NOT NULL,
                    code VARCHAR(50) NOT NULL,
                    phone_number VARCHAR(20),
                    commission_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
                    total_clicks INT NOT NULL DEFAULT 0,
                    total_sales_count INT NOT NULL DEFAULT 0,
                    total_revenue_generated NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
                    total_commission_earned NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """);

            // 6. Ensure ticket transfers table exists
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS ticket_transfers (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    ticket_id UUID,
                    sender_phone VARCHAR(20) NOT NULL,
                    recipient_phone VARCHAR(20) NOT NULL,
                    sender_name VARCHAR(100),
                    recipient_name VARCHAR(100),
                    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
                    transfer_token VARCHAR(100) NOT NULL,
                    ed25519_signature TEXT,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    completed_at TIMESTAMP WITH TIME ZONE
                )
            """);

            // 7. Ensure seating section & seat tables exist
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS seating_sections (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id UUID,
                    ticket_type_id UUID,
                    name VARCHAR(100) NOT NULL,
                    section_code VARCHAR(20) NOT NULL,
                    type VARCHAR(30) NOT NULL DEFAULT 'RESERVED_SEAT',
                    total_rows INT NOT NULL DEFAULT 5,
                    seats_per_row INT NOT NULL DEFAULT 10,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS seats (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    section_id UUID,
                    event_id UUID,
                    ticket_type_id UUID,
                    row_identifier VARCHAR(10) NOT NULL,
                    seat_number INT NOT NULL,
                    label VARCHAR(20) NOT NULL,
                    status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
                    locked_until_utc TIMESTAMP WITH TIME ZONE,
                    assigned_order_id UUID,
                    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
                )
            """);

            // 8. Ensure event_broadcast_campaigns and event_automated_reminders tables exist
            stmt.execute("""
                CREATE TABLE IF NOT EXISTS event_broadcast_campaigns (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id UUID NOT NULL,
                    organizer_id UUID,
                    title VARCHAR(255) NOT NULL,
                    target_filter VARCHAR(50) NOT NULL DEFAULT 'ALL_ATTENDEES',
                    target_ticket_type_id UUID,
                    message_content TEXT NOT NULL,
                    language VARCHAR(10) DEFAULT 'en',
                    recipient_count INT NOT NULL DEFAULT 0,
                    delivered_count INT NOT NULL DEFAULT 0,
                    failed_count INT NOT NULL DEFAULT 0,
                    status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
                    scheduled_at TIMESTAMP WITH TIME ZONE,
                    sent_at TIMESTAMP WITH TIME ZONE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """);

            stmt.execute("""
                CREATE TABLE IF NOT EXISTS event_automated_reminders (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    event_id UUID NOT NULL,
                    reminder_type VARCHAR(50) NOT NULL,
                    enabled BOOLEAN NOT NULL DEFAULT true,
                    sent_at TIMESTAMP WITH TIME ZONE,
                    total_sent INT NOT NULL DEFAULT 0,
                    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                )
            """);

            log.info("✓ [DatabaseSchemaInitializer] PostgreSQL schema verified and healed successfully.");
        } catch (Exception e) {
            log.warn("⚠ [DatabaseSchemaInitializer] Schema healing encountered warning (will rely on Hibernate ddl-auto): {}", e.getMessage());
        }
    }
}
