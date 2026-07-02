-- Run in Supabase SQL editor if 012_free_reservation.sql failed halfway.
-- Safe to re-run: drops status-dependent indexes, migrates via text, recreates index.

ALTER TABLE public.orders
  DROP COLUMN IF EXISTS payment_method,
  DROP COLUMN IF EXISTS payment_ref,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_note text;

DROP INDEX IF EXISTS public.unique_active_reservation;

ALTER TABLE public.orders
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE public.orders
  ALTER COLUMN status TYPE text USING status::text;

DROP TYPE IF EXISTS public.order_status CASCADE;
DROP TYPE IF EXISTS public.order_status_old CASCADE;

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'picked_up',
  'cancelled'
);

ALTER TABLE public.orders
  ALTER COLUMN status TYPE public.order_status
  USING (
    CASE status::text
      WHEN 'paid' THEN 'confirmed'
      WHEN 'refunded' THEN 'cancelled'
      WHEN 'pending' THEN 'pending'
      WHEN 'confirmed' THEN 'confirmed'
      WHEN 'picked_up' THEN 'picked_up'
      WHEN 'cancelled' THEN 'cancelled'
      ELSE 'pending'
    END
  )::public.order_status;

ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'pending'::public.order_status;

-- Backfill: free reservations should be confirmed, not left as pending
UPDATE public.orders
SET status = 'confirmed'::public.order_status
WHERE status = 'pending'::public.order_status
  AND customer_name IS NOT NULL
  AND customer_phone IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_reservation
  ON public.orders (customer_id, bag_id)
  WHERE status IN ('confirmed'::public.order_status, 'pending'::public.order_status);
