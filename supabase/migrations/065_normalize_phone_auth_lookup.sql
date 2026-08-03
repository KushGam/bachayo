-- Normalize Nepal mobiles to 10-digit local (97/98…) for auth lookups.
CREATE OR REPLACE FUNCTION public.normalize_np_phone(p_phone text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN length(digits) >= 10 THEN right(digits, 10)
    ELSE digits
  END
  FROM (
    SELECT regexp_replace(coalesce(p_phone, ''), '\D', '', 'g') AS digits
  ) s;
$$;

CREATE OR REPLACE FUNCTION public.phone_profile_exists(p_phone text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE public.normalize_np_phone(phone) = public.normalize_np_phone(p_phone)
      AND length(public.normalize_np_phone(p_phone)) = 10
  );
$$;

-- Returns role when a profile owns this phone (any common storage format).
CREATE OR REPLACE FUNCTION public.phone_profile_role(p_phone text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::text
  FROM public.profiles
  WHERE public.normalize_np_phone(phone) = public.normalize_np_phone(p_phone)
    AND length(public.normalize_np_phone(p_phone)) = 10
  ORDER BY created_at ASC NULLS LAST
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.normalize_np_phone(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.phone_profile_exists(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.phone_profile_role(text) TO anon, authenticated;
