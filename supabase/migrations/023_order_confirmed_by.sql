ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS confirmed_by text;

COMMENT ON COLUMN public.orders.confirmed_by IS
  'partner_qr | partner_manual | customer';
