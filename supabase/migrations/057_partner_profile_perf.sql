-- Speed partner profile / detail loads: indexes + server-side aggregates.

CREATE INDEX IF NOT EXISTS idx_orders_partner_status
  ON public.orders (partner_id, status);

CREATE INDEX IF NOT EXISTS idx_reviews_partner_id
  ON public.reviews (partner_id);

CREATE INDEX IF NOT EXISTS idx_reviews_partner_rating
  ON public.reviews (partner_id, rating);

-- Aggregate picked-up sales without downloading every order row.
CREATE OR REPLACE FUNCTION public.get_partner_sales_stats(p_partner_id uuid)
RETURNS TABLE(bags_sold bigint, total_revenue bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(SUM(GREATEST(1, o.quantity)), 0)::bigint AS bags_sold,
    COALESCE(SUM(o.total_price), 0)::bigint AS total_revenue
  FROM public.orders o
  WHERE o.partner_id = p_partner_id
    AND o.status = 'picked_up'::public.order_status;
$$;

REVOKE ALL ON FUNCTION public.get_partner_sales_stats(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_partner_sales_stats(uuid) TO authenticated;

-- Star breakdown without shipping every review row to the client.
CREATE OR REPLACE FUNCTION public.get_partner_rating_breakdown(p_partner_id uuid)
RETURNS TABLE(stars integer, review_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    r.rating::integer AS stars,
    COUNT(*)::bigint AS review_count
  FROM public.reviews r
  WHERE r.partner_id = p_partner_id
    AND r.rating BETWEEN 1 AND 5
  GROUP BY r.rating
  ORDER BY r.rating DESC;
$$;

REVOKE ALL ON FUNCTION public.get_partner_rating_breakdown(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_partner_rating_breakdown(uuid) TO authenticated, anon;
