-- Customer cancellation metadata on orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;
