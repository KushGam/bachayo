-- Extended profile fields for multi-step signup flows

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS date_of_birth date;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_area text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_address text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_latitude float8;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS home_longitude float8;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS food_preferences text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;
