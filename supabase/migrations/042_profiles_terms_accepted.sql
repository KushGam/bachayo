-- Terms acceptance on profiles (signup + Google + legacy gate).
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version text DEFAULT 'v1.0';

CREATE INDEX IF NOT EXISTS idx_profiles_terms_accepted
  ON profiles(terms_accepted_at)
  WHERE terms_accepted_at IS NOT NULL;
