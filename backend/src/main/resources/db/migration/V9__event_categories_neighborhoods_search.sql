-- V9__event_categories_neighborhoods_search.sql
-- Add category, neighborhood, featured flag, and tags to events

ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'MUSIC_CONCERT';
ALTER TABLE events ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(50) DEFAULT 'BOLE';
ALTER TABLE events ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS tags VARCHAR(255) DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_neighborhood ON events(neighborhood);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);

-- Update existing seeds
UPDATE events 
SET category = 'MUSIC_CONCERT', neighborhood = 'BOLE', featured = true, tags = 'EDM,Electronic,Rophnan,Millennium Hall,Live'
WHERE id = 'e1111111-1111-1111-1111-111111111111';

UPDATE events 
SET category = 'TECH_SUMMIT', neighborhood = 'BOLE', featured = true, tags = 'AI,Fintech,Skylight,Startup,Innovation'
WHERE id = 'e2222222-2222-2222-2222-222222222222';

UPDATE events 
SET category = 'COMEDY_THEATRE', neighborhood = 'PIASSA', featured = false, tags = 'Standup,Ethio-Jazz,Ghion,Comedy'
WHERE id = 'e3333333-3333-3333-3333-333333333333';

-- Seed Additional Diverse Addis Ababa Events
INSERT INTO events (id, organizer_id, title, slug, description, venue_name, venue_address, start_time_utc, end_time_utc, banner_image_url, status, category, neighborhood, featured, tags)
VALUES 
    ('e4444444-4444-4444-4444-444444444444', 
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
     'Addis Cultural Coffee & Culinary Expo 2026', 
     'addis-cultural-coffee-culinary-expo-2026', 
     'Celebrating Ethiopian coffee heritage (Buna ceremony), regional cuisines from Tigray, Oromia, Amhara, and Sidama, plus barista championships at Friendship Park.', 
     'Friendship Park (ወዳጅነት ፓርክ)', 
     'Kazanchis, Addis Ababa', 
     '2026-10-24 07:00:00+00', 
     '2026-10-25 16:00:00+00', 
     'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=1200&auto=format&fit=crop', 
     'PUBLISHED',
     'CULTURE_FESTIVAL',
     'KAZANCHIS',
     true,
     'Buna,Coffee,Cuisine,Cultural,Friendship Park,Tasting'),

    ('e5555555-5555-5555-5555-555555555555', 
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
     'Meskel Square Midnight 10K Marathon & Fitness Fest', 
     'meskel-square-midnight-10k-marathon', 
     'The ultimate illuminated night run across Churchill Avenue and Meskel Square with live DJ stations, hydration points, and medal ceremonies.', 
     'Meskel Square (መስቀል አደባባይ)', 
     'Meskel Square, Addis Ababa', 
     '2026-10-17 17:00:00+00', 
     '2026-10-17 22:00:00+00', 
     'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=1200&auto=format&fit=crop', 
     'PUBLISHED',
     'SPORTS_FITNESS',
     'MESKEL_SQUARE',
     false,
     'Marathon,Running,NightRun,Fitness,Meskel Square,Athletics'),

    ('e6666666-6666-6666-6666-666666666666', 
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
     'Entoto Sunset Afro-House & Acoustic Sessions', 
     'entoto-sunset-afro-house-sessions', 
     'Intimate open-air acoustic music and Afro-house beats overlooking panoramic views of Addis Ababa from the pine forests of Entoto Park.', 
     'Kuriftu Resort Entoto Park', 
     'Entoto Hills, Northern Addis Ababa', 
     '2026-11-14 13:00:00+00', 
     '2026-11-14 19:30:00+00', 
     'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=1200&auto=format&fit=crop', 
     'PUBLISHED',
     'NIGHTLIFE_PARTY',
     'ENTOTO',
     false,
     'AfroHouse,Sunset,Acoustic,Entoto,Kuriftu,Electronic'),

    ('e7777777-7777-7777-7777-777777777777', 
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 
     'Sarbet Ethio-Jazz & Contemporary Art Exhibition', 
     'sarbet-ethio-jazz-art-exhibition', 
     'Fine art gallery showcase featuring Ethiopian painters and sculptors alongside live brass quartet performances.', 
     'Alliance Ethio-Française', 
     'Sarbet, Near Old Airport, Addis Ababa', 
     '2026-10-30 14:00:00+00', 
     '2026-10-30 20:00:00+00', 
     'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=1200&auto=format&fit=crop', 
     'PUBLISHED',
     'ART_EXHIBITION',
     'SARBET',
     false,
     'Art,Jazz,Exhibition,Painting,Alliance,Culture')
ON CONFLICT (id) DO UPDATE 
SET category = EXCLUDED.category, neighborhood = EXCLUDED.neighborhood, featured = EXCLUDED.featured, tags = EXCLUDED.tags;

-- Seed Ticket Tiers for new events
INSERT INTO ticket_types (id, event_id, name, description, price, total_capacity, available_capacity, reserved_capacity, max_per_user, sales_start_utc, sales_end_utc)
VALUES 
    -- Tickets for Coffee Expo
    ('b7777777-7777-7777-7777-777777777777', 'e4444444-4444-4444-4444-444444444444', 'Day Pass & Buna Tasting', 'Access to tasting pavilion, coffee ceremonies, and culinary stands', 300.00, 2000, 1920, 0, 8, '2026-09-01 00:00:00+00', '2026-10-24 06:00:00+00'),
    ('b8888888-8888-8888-8888-888888888888', 'e4444444-4444-4444-4444-444444444444', 'VIP Masterclass & Cupping Table', 'Exclusive Ethiopian specialty coffee cupping workshop with master roasters', 1200.00, 150, 130, 0, 4, '2026-09-01 00:00:00+00', '2026-10-24 06:00:00+00'),

    -- Tickets for Midnight Marathon
    ('b9999999-9999-9999-9999-999999999999', 'e5555555-5555-5555-5555-555555555555', '10K Runner Bib & Kit', 'Official race bib with timing chip, dri-fit shirt, and finisher medal', 450.00, 3000, 2840, 0, 5, '2026-09-01 00:00:00+00', '2026-10-17 15:00:00+00'),

    -- Tickets for Entoto Sunset
    ('baaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'e6666666-6666-6666-6666-666666666666', 'General Forest Access', 'Access to open lawn concert area with sunset view', 600.00, 800, 750, 0, 4, '2026-09-01 00:00:00+00', '2026-11-14 12:00:00+00'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'e6666666-6666-6666-6666-666666666666', 'VIP Bonfire Deck', 'Reserved wooden deck seating with heated bonfire and 2 complimentary cocktails', 1800.00, 100, 92, 0, 2, '2026-09-01 00:00:00+00', '2026-11-14 12:00:00+00'),

    -- Tickets for Sarbet Art & Jazz
    ('bccccccc-cccc-cccc-cccc-cccccccccccc', 'e7777777-7777-7777-7777-777777777777', 'Exhibition & Concert Entry', 'Full gallery admission + live jazz courtyard access', 350.00, 500, 470, 0, 6, '2026-09-01 00:00:00+00', '2026-10-30 13:00:00+00')
ON CONFLICT (id) DO NOTHING;
