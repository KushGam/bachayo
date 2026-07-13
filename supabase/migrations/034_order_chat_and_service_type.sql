-- Feature set: service type, review replies, per-order chat

ALTER TABLE public.rescue_bags
  ADD COLUMN IF NOT EXISTS service_type text
    DEFAULT 'both'
    CHECK (service_type IN ('takeaway', 'dinein', 'both')),
  ADD COLUMN IF NOT EXISTS dinein_extra_charge int
    DEFAULT 0;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS service_type text
    DEFAULT 'takeaway'
    CHECK (service_type IN ('takeaway', 'dinein'));

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS partner_reply text,
  ADD COLUMN IF NOT EXISTS partner_replied_at timestamptz;

CREATE TABLE IF NOT EXISTS public.order_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id),
  sender_role text CHECK (sender_role IN ('customer', 'partner')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_order
  ON public.order_messages(order_id, created_at);

ALTER TABLE public.order_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'order_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;
  END IF;
END $$;

ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "order participants can read messages" ON public.order_messages;
CREATE POLICY "order participants can read messages"
  ON public.order_messages FOR SELECT
  USING (
    auth.uid() = sender_id
    OR auth.uid() IN (
      SELECT customer_id FROM public.orders WHERE id = order_id
      UNION
      SELECT user_id
      FROM public.partners p
      JOIN public.orders o ON o.partner_id = p.id
      WHERE o.id = order_id
    )
  );

DROP POLICY IF EXISTS "order participants can send messages" ON public.order_messages;
CREATE POLICY "order participants can send messages"
  ON public.order_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND auth.uid() IN (
      SELECT customer_id FROM public.orders WHERE id = order_id
      UNION
      SELECT user_id
      FROM public.partners p
      JOIN public.orders o ON o.partner_id = p.id
      WHERE o.id = order_id
    )
  );
