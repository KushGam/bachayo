-- Align daily bag-listing caps with published plans:
-- small 5 / medium 15 / large unlimited.
-- Also block inserts when subscription is not listable.

ALTER TABLE public.subscription_tier_pricing
  ADD COLUMN IF NOT EXISTS max_bags_per_day integer;

UPDATE public.subscription_tier_pricing AS t
SET
  monthly_price_npr = v.monthly_price_npr,
  max_bags_per_day = v.max_bags_per_day,
  max_bags_per_month = NULL,
  label = v.label
FROM (
  VALUES
    ('small'::public.subscription_tier, 1000, 5, 'Small — café, dhaba, home bakery'),
    ('medium'::public.subscription_tier, 1500, 15, 'Medium — restaurant, bakery, café'),
    ('large'::public.subscription_tier, 3500, NULL::int, 'Large — hotel, mart, multi-branch')
) AS v(tier, monthly_price_npr, max_bags_per_day, label)
WHERE t.tier = v.tier;

COMMENT ON COLUMN public.subscription_tier_pricing.max_bags_per_day IS
  'Max rescue-bag listings allowed per calendar day for this tier. NULL = unlimited.';

CREATE OR REPLACE FUNCTION public.check_daily_listing_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  today_count integer;
  max_allowed integer;
  partner_tier text;
  partner_status text;
  partner_active boolean;
BEGIN
  -- Editing fields other than listing date/partner must not re-check capacity.
  IF TG_OP = 'UPDATE'
     AND NEW.available_date IS NOT DISTINCT FROM OLD.available_date
     AND NEW.partner_id IS NOT DISTINCT FROM OLD.partner_id THEN
    RETURN NEW;
  END IF;

  SELECT
    p.subscription_tier::text,
    COALESCE(p.subscription_status::text, 'trial'),
    COALESCE(p.is_active, false)
  INTO partner_tier, partner_status, partner_active
  FROM public.partners p
  WHERE p.id = NEW.partner_id;

  IF partner_tier IS NULL THEN
    RAISE EXCEPTION 'partner_not_found' USING ERRCODE = 'P0001';
  END IF;

  -- Only trial/active partners may create listings for a day.
  IF partner_status NOT IN ('trial', 'active') OR partner_active IS NOT TRUE THEN
    RAISE EXCEPTION 'subscription_inactive'
      USING ERRCODE = 'P0001',
            MESSAGE = format(
              'Subscription is %s — renew to list bags',
              partner_status
            );
  END IF;

  SELECT stp.max_bags_per_day
  INTO max_allowed
  FROM public.subscription_tier_pricing stp
  WHERE stp.tier::text = partner_tier;

  IF NOT FOUND THEN
    max_allowed := CASE partner_tier
      WHEN 'small' THEN 5
      WHEN 'medium' THEN 15
      WHEN 'large' THEN NULL
      ELSE 5
    END;
  END IF;

  SELECT COUNT(*)::integer
  INTO today_count
  FROM public.rescue_bags rb
  WHERE rb.partner_id = NEW.partner_id
    AND rb.available_date = NEW.available_date
    AND rb.id IS DISTINCT FROM NEW.id;

  IF max_allowed IS NOT NULL AND today_count >= max_allowed THEN
    RAISE EXCEPTION 'listing_limit_reached'
      USING ERRCODE = 'P0001',
            MESSAGE = format(
              'Daily listing limit reached for %s plan (%s / %s)',
              partner_tier,
              today_count,
              max_allowed
            );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_listing_limit ON public.rescue_bags;

CREATE TRIGGER enforce_listing_limit
  BEFORE INSERT OR UPDATE OF available_date, partner_id
  ON public.rescue_bags
  FOR EACH ROW
  EXECUTE FUNCTION public.check_daily_listing_limit();
