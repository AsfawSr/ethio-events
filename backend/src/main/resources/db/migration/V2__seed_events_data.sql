-- V2__seed_events_data.sql
-- Seed data for Addis Ababa events, organizers, and ticket tiers

-- 1. Create Default Organizers & Users
INSERT INTO users (id, phone_number, full_name, email, role, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '+251911000001', 'EthioEvents Admin', 'admin@ethioevents.com', 'ADMIN', true),
    ('22222222-2222-2222-2222-222222222222', '+251911000002', 'Admas Entertainment', 'admas@ethioevents.com', 'ORGANIZER', true),
    ('33333333-3333-3333-3333-333333333333', '+251911000003', 'Addis Gate Crew Lead', 'gate@ethioevents.com', 'GATE_CREW', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO organizers (id, user_id, organization_name, business_license_no, bank_name, bank_account_no, bank_account_name, status)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Admas Events & Entertainment', 'BL-AA-2024-9981', 'Commercial Bank of Ethiopia', '1000123456789', 'Admas Entertainment PLC', 'VERIFIED')
ON CONFLICT (id) DO NOTHING;

-- 2. Seed Realistic Addis Ababa Events
-- Event 1: Rophnan Live at Millennium Hall
INSERT INTO events (id, organizer_id, title, slug, description, venue_name, venue_address, start_time_utc, end_time_utc, banner_image_url, status)
VALUES 
    ('e1111111-1111-1111-1111-111111111111', 
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
     'ROPHNAN - SOST (፫) LIVE in Addis Ababa', 
     'rophnan-sost-live-millennium-hall', 
     'The ultimate electronic-folk spectacle by ROPHNAN. Featuring an immersive 360 audio-visual stage at Millennium Hall with special guest traditional instrumentalists from across Ethiopia.', 
     'Millennium Hall', 
     'Bole Sub-City, Africa Avenue, Addis Ababa', 
     '2026-10-10 15:00:00+00', 
     '2026-10-10 21:00:00+00', 
     'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1200&auto=format&fit=crop', 
     'PUBLISHED'),
    
    ('e2222222-2222-2222-2222-222222222222', 
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
     'Addis Tech Summit & AI Expo 2026', 
     'addis-tech-summit-2026', 
     'Ethiopia’s premier tech, fintech, and AI summit bringing together 2,000+ software engineers, founders, venture capitalists, and policy makers from across the Horn of Africa.', 
     'Ethiopian Skylight Hotel', 
     'Bole Airport Road, Addis Ababa', 
     '2026-11-05 06:00:00+00', 
     '2026-11-06 14:00:00+00', 
     'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=1200&auto=format&fit=crop', 
     'PUBLISHED'),

    ('e3333333-3333-3333-3333-333333333333', 
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
     'Habesha Stand-Up Comedy Night & Jazz', 
     'habesha-comedy-night-ghion', 
     'An evening of premier Ethiopian stand-up comedy and live Ethio-Jazz under the historic trees of Ghion Hotel Addis Ababa.', 
     'Ghion Hotel Gardens', 
     'Ras Desta Damtew St, Addis Ababa', 
     '2026-09-25 15:30:00+00', 
     '2026-09-25 20:00:00+00', 
     'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=1200&auto=format&fit=crop', 
     'PUBLISHED')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Ticket Tiers
-- Tickets for Rophnan
INSERT INTO ticket_types (id, event_id, name, description, price, total_capacity, available_capacity, reserved_capacity, max_per_user, sales_start_utc, sales_end_utc)
VALUES 
    ('t1111111-1111-1111-1111-111111111111', 'e1111111-1111-1111-1111-111111111111', 'Early Bird General', 'Standing area access with standard stage view', 800.00, 5000, 4820, 0, 5, '2026-09-01 00:00:00+00', '2026-10-10 12:00:00+00'),
    ('t2222222-2222-2222-2222-222222222222', 'e1111111-1111-1111-1111-111111111111', 'VIP Front Stage', 'Front circle priority access + fast-track gate entry', 2500.00, 1500, 1420, 0, 4, '2026-09-01 00:00:00+00', '2026-10-10 12:00:00+00'),
    ('t3333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111', 'VVIP Lounge & Drinks', 'Elevated lounge with free welcome drinks & artist backstage meetup', 6000.00, 200, 185, 0, 2, '2026-09-01 00:00:00+00', '2026-10-10 12:00:00+00'),

-- Tickets for Tech Summit
    ('t4444444-4444-4444-4444-444444444444', 'e2222222-2222-2222-2222-222222222222', 'Standard Pass (2 Days)', 'Full access to keynotes, exhibitions, and networking lounges', 1500.00, 1000, 950, 0, 5, '2026-09-01 00:00:00+00', '2026-11-05 05:00:00+00'),
    ('t5555555-5555-5555-5555-555555555555', 'e2222222-2222-2222-2222-222222222222', 'Executive VIP & Gala Dinner', 'Includes Executive VIP Lounge + Gala Dinner at Ethiopian Skylight Hotel', 5000.00, 300, 280, 0, 2, '2026-09-01 00:00:00+00', '2026-11-05 05:00:00+00'),

-- Tickets for Comedy Night
    ('t6666666-6666-6666-6666-666666666666', 'e3333333-3333-3333-3333-333333333333', 'Regular Seat', 'Table seating in garden amphitheater', 500.00, 400, 360, 0, 6, '2026-09-01 00:00:00+00', '2026-09-25 14:00:00+00')
ON CONFLICT (id) DO NOTHING;

-- 4. Assign Gate Crew
INSERT INTO gate_crew_assignments (user_id, event_id)
VALUES ('33333333-3333-3333-3333-333333333333', 'e1111111-1111-1111-1111-111111111111')
ON CONFLICT DO NOTHING;
