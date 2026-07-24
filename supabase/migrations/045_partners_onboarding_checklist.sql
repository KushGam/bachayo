-- Partner dashboard first-run checklist
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS onboarding_checklist jsonb
  DEFAULT '{
    "profile_photo": false,
    "business_description": false,
    "first_bag_listed": false,
    "bank_details": false
  }'::jsonb;

COMMENT ON COLUMN partners.onboarding_checklist IS
  'Partner setup checklist: profile_photo, business_description, first_bag_listed, bank_details';
