-- Track when a partner adjusts an active order's quantity (customer badge).
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS quantity_adjusted_at timestamptz;

COMMENT ON COLUMN public.orders.quantity_adjusted_at IS
  'Set when a partner changes quantity on a pending/confirmed order.';
