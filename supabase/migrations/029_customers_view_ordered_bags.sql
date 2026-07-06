-- Customers need bag/partner details for past orders (review, history)
-- even when bags are sold_out and partners are inactive.
--
-- Use SECURITY DEFINER helpers so partner/bag policies do not recursively
-- re-enter orders RLS (which itself references partners for partner users).

CREATE OR REPLACE FUNCTION public.customer_order_partner_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT DISTINCT partner_id
  FROM public.orders
  WHERE customer_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.customer_order_bag_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT DISTINCT bag_id
  FROM public.orders
  WHERE customer_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.customer_order_partner_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_order_partner_ids() TO authenticated;

REVOKE ALL ON FUNCTION public.customer_order_bag_ids() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.customer_order_bag_ids() TO authenticated;

DROP POLICY IF EXISTS "Customers can view bags from their orders" ON public.rescue_bags;

CREATE POLICY "Customers can view bags from their orders"
  ON public.rescue_bags
  FOR SELECT
  USING (id IN (SELECT public.customer_order_bag_ids()));

DROP POLICY IF EXISTS "Customers can view partners from their orders" ON public.partners;

CREATE POLICY "Customers can view partners from their orders"
  ON public.partners
  FOR SELECT
  USING (id IN (SELECT public.customer_order_partner_ids()));
