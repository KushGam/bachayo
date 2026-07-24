-- Customer privacy settings: what partners can see about a customer.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS privacy_settings jsonb
  DEFAULT '{
    "show_phone": true,
    "show_full_name": true,
    "name_display": "full"
  }'::jsonb;

COMMENT ON COLUMN profiles.privacy_settings IS
  'Customer privacy prefs. name_display: full | first | initials | anonymous';
