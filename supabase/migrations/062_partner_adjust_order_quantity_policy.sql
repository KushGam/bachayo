-- Allow partners to change quantity/total on active reservations
-- without forcing status to cancelled or picked_up.
-- Existing partner UPDATE policies only WITH CHECK those two statuses,
-- which blocked Edit qty (RLS: "new row violates row-level security policy").

DROP POLICY IF EXISTS "Partners can adjust quantity on their orders" ON public.orders;

CREATE POLICY "Partners can adjust quantity on their orders"
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
    AND status IN (
      'confirmed'::public.order_status,
      'pending'::public.order_status
    )
  );
