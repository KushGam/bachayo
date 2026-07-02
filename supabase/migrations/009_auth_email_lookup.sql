-- Allow auth screens to check if an email is registered (boolean only).
CREATE OR REPLACE FUNCTION public.email_profile_exists(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(email) = lower(trim(p_email))
  );
$$;

GRANT EXECUTE ON FUNCTION public.email_profile_exists(text) TO anon, authenticated;
