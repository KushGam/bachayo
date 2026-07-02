ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city_id text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area_id text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS city_id text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS area_id text;

CREATE INDEX IF NOT EXISTS idx_partners_city ON public.partners(city_id);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city_id);
