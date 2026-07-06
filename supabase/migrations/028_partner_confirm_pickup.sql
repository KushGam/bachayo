-- Partners must be able to mark confirmed reservations as picked up.
-- Without this policy, client updates return 0 rows and pickup appears to fail.

DROP POLICY IF EXISTS "Partners can confirm pickup on their orders" ON public.orders;

CREATE POLICY "Partners can confirm pickup on their orders"
  ON public.orders
  FOR UPDATE
  USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
    AND status IN (
      'confirmed'::public.order_status,
      'pending'::public.order_status
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
    AND status = 'picked_up'::public.order_status
  );
