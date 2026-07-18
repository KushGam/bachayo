-- Allow order participants to mark the other party's messages as read.
-- Without this, is_read stays false forever and the tab badge never clears.

DROP POLICY IF EXISTS "order participants can mark messages read" ON public.order_messages;

CREATE POLICY "order participants can mark messages read"
  ON public.order_messages
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT customer_id FROM public.orders WHERE id = order_id
      UNION
      SELECT user_id
      FROM public.partners p
      JOIN public.orders o ON o.partner_id = p.id
      WHERE o.id = order_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT customer_id FROM public.orders WHERE id = order_id
      UNION
      SELECT user_id
      FROM public.partners p
      JOIN public.orders o ON o.partner_id = p.id
      WHERE o.id = order_id
    )
  );

-- Clear stuck unread badges on finished orders (picked up / cancelled / missed).
UPDATE public.order_messages m
SET is_read = true
FROM public.orders o
WHERE m.order_id = o.id
  AND m.is_read = false
  AND o.status IN (
    'picked_up'::public.order_status,
    'cancelled'::public.order_status,
    'missed'::public.order_status
  );
