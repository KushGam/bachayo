-- Link profiles to Firebase Auth for phone OTP signup/login.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS firebase_uid text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid
  ON profiles(firebase_uid);

CREATE INDEX IF NOT EXISTS idx_profiles_phone
  ON profiles(phone);
