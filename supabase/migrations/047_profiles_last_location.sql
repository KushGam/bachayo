-- Customer last-known GPS for reservation distance checks
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_latitude double precision,
  ADD COLUMN IF NOT EXISTS last_longitude double precision,
  ADD COLUMN IF NOT EXISTS last_location_updated timestamptz;
