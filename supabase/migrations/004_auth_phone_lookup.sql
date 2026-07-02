-- Allow auth screens to check if a phone is registered (boolean only).
CREATE OR REPLACE FUNCTION public.phone_profile_exists(p_phone text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE phone = p_phone
  );
$$;

GRANT EXECUTE ON FUNCTION public.phone_profile_exists(text) TO anon, authenticated;
