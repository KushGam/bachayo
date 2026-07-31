-- Enforce daily rescue-bag listing limits by subscription tier.
-- Also refresh seed pricing to match current plans.

UPDATE public.subscription_tier_pricing AS t
SET
  monthly_price_npr = v.monthly_price_npr,
  max_bags_per_month = v.max_bags_per_month,
  label = v.label
FROM (
  VALUES
    ('small'::public.subscription_tier, 1000, NULL::int, 'Small — café, dhaba, home bakery'),
    ('medium'::public.subscription_tier, 1500, NULL::int, 'Medium — restaurant, bakery, café'),
    ('large'::public.subscription_tier, 3500, NULL::int, 'Large — hotel, mart, multi-branch')
) AS v(tier, monthly_price_npr, max_bags_per_month, label)
WHERE t.tier = v.tier;

CREATE OR REPLACE FUNCTION public.check_daily_listing_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  today_count integer;
  max_allowed integer;
  partner_tier text;
BEGIN
  SELECT subscription_tier::text
  INTO partner_tier
  FROM public.partners
  WHERE id = NEW.partner_id;

  SELECT COUNT(*)
  INTO today_count
  FROM public.rescue_bags
  WHERE partner_id = NEW.partner_id
    AND available_date = NEW.available_date
    AND id IS DISTINCT FROM NEW.id;

  max_allowed := CASE partner_tier
    WHEN 'small' THEN 5
    WHEN 'medium' THEN 15
    WHEN 'large' THEN NULL
    ELSE 5
  END;

  IF max_allowed IS NOT NULL AND today_count >= max_allowed THEN
    RAISE EXCEPTION
      'Daily listing limit reached for % plan (% / %)',
      COALESCE(partner_tier, 'small'),
      today_count,
      max_allowed;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_listing_limit ON public.rescue_bags;

CREATE TRIGGER enforce_listing_limit
  BEFORE INSERT ON public.rescue_bags
  FOR EACH ROW
  EXECUTE FUNCTION public.check_daily_listing_limit();
