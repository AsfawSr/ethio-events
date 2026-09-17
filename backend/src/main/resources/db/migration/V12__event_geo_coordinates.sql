-- V12: Add latitude and longitude to events table for Addis Ababa interactive map exploration
ALTER TABLE events ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE events ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

-- Populate default coordinates for existing seed events
UPDATE events 
SET latitude = 9.0012, longitude = 38.7853 
WHERE venue_name ILIKE '%Millennium%' OR neighborhood = 'BOLE';

UPDATE events 
SET latitude = 9.0145, longitude = 38.7634 
WHERE venue_name ILIKE '%UNECA%' OR venue_name ILIKE '%InterLuxury%' OR neighborhood = 'KAZANCHIS';

UPDATE events 
SET latitude = 9.0182, longitude = 38.7523 
WHERE venue_name ILIKE '%National Theatre%' OR venue_name ILIKE '%Hager Fikir%' OR neighborhood = 'PIASSA';

UPDATE events 
SET latitude = 9.0105, longitude = 38.7612 
WHERE venue_name ILIKE '%Meskel%' OR venue_name ILIKE '%Exhibition%' OR neighborhood = 'MESKEL_SQUARE';

UPDATE events 
SET latitude = 8.9950, longitude = 38.7350 
WHERE venue_name ILIKE '%Golf%' OR venue_name ILIKE '%African Union%' OR neighborhood = 'SARBET';

UPDATE events 
SET latitude = 9.0820, longitude = 38.7621 
WHERE venue_name ILIKE '%Entoto%' OR neighborhood = 'ENTOTO';

UPDATE events 
SET latitude = 9.0250, longitude = 38.8350 
WHERE venue_name ILIKE '%Century%' OR venue_name ILIKE '%Summit%' OR neighborhood = 'CMC';

UPDATE events 
SET latitude = 9.0020, longitude = 38.8050 
WHERE venue_name ILIKE '%Imperial%' OR neighborhood = 'GERJI';

UPDATE events 
SET latitude = 8.7520, longitude = 38.9850 
WHERE venue_name ILIKE '%Kuriftu%' OR venue_name ILIKE '%Bishoftu%' OR neighborhood = 'BISHOFTU';
