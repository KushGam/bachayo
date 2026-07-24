-- Rename Bharatpur → Bhaktapur across city_id references
UPDATE partners
SET city_id = 'bhaktapur'
WHERE city_id = 'bharatpur';

UPDATE profiles
SET city_id = 'bhaktapur'
WHERE city_id = 'bharatpur';

-- If a cities table exists in your project, also run:
-- UPDATE cities
--   SET name = 'Bhaktapur',
--       name_np = 'भक्तपुर'
-- WHERE name = 'Bharatpur';
