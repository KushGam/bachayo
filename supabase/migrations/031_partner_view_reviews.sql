-- Partners must read reviews left for their restaurant.
-- Customers need public read on approved partners for partner detail pages.
-- Rating aggregation must bypass RLS (customer only sees own review row).

DROP POLICY IF EXISTS "Partners can view reviews for their restaurant" ON public.reviews;

CREATE POLICY "Partners can view reviews for their restaurant"
  ON public.reviews
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can view reviews for active partners" ON public.reviews;

CREATE POLICY "Anyone can view reviews for active partners"
  ON public.reviews
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM public.partners
      WHERE is_active = true AND approval_status = 'approved'
    )
  );

CREATE OR REPLACE FUNCTION public.recalculate_partner_rating(p_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total integer;
  v_avg real;
BEGIN
  SELECT count(*)::integer, coalesce(round(avg(rating)::numeric, 1), 0)::real
  INTO v_total, v_avg
  FROM public.reviews
  WHERE partner_id = p_partner_id;

  UPDATE public.partners
  SET
    rating = v_avg,
    total_reviews = v_total
  WHERE id = p_partner_id;
END;
$$;

REVOKE ALL ON FUNCTION public.recalculate_partner_rating(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.recalculate_partner_rating(uuid) TO authenticated;

DROP POLICY IF EXISTS "Partners can view customer profiles for their business" ON public.profiles;

CREATE POLICY "Partners can view customer profiles for their business"
  ON public.profiles
  FOR SELECT
  USING (
    id IN (
      SELECT customer_id FROM public.orders
      WHERE partner_id IN (
        SELECT id FROM public.partners WHERE user_id = auth.uid()
      )
    )
  );
