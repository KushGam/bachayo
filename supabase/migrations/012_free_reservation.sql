-- Free reservation model: remove payment fields, add customer details, simplify order_status

ALTER TABLE public.orders
  DROP COLUMN IF EXISTS payment_method,
  DROP COLUMN IF EXISTS payment_ref,
  ADD COLUMN IF NOT EXISTS customer_name text,
  ADD COLUMN IF NOT EXISTS customer_phone text,
  ADD COLUMN IF NOT EXISTS customer_note text;

-- Partial indexes on status must be dropped before enum ↔ text churn
DROP INDEX IF EXISTS public.unique_active_reservation;

-- Migrate enum via text (avoids: operator does not exist: order_status = order_status_old)
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
