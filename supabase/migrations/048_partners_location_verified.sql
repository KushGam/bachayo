-- Partner GPS verification flag + location lookup index
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS location_verified boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_partners_location
  ON partners(latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
