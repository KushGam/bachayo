-- Allow partners to cancel active reservations on their bags
-- (e.g. when deleting/cancelling a listing after a race, or future force-cancel).

DROP POLICY IF EXISTS "Partners can cancel reservations on their orders" ON public.orders;

CREATE POLICY "Partners can cancel reservations on their orders"
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
    AND status = 'cancelled'::public.order_status
  );
