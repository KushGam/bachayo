-- Fix max-per-customer false reject when reserving the full allowed quantity.
-- Trigger is AFTER INSERT, so SUM already includes NEW; previously we added
-- NEW.quantity again (qty 3 + max 3 → treated as 6).

CREATE OR REPLACE FUNCTION public.reserve_bag_on_order_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_id uuid;
  customer_reserved_qty integer;
BEGIN
  -- Only other active reservations for this customer+bag (exclude NEW).
  SELECT COALESCE(SUM(o.quantity), 0)::integer
  INTO customer_reserved_qty
  FROM public.orders o
  WHERE o.bag_id = NEW.bag_id
    AND o.customer_id = NEW.customer_id
    AND o.id IS DISTINCT FROM NEW.id
    AND o.status IN (
      'pending'::public.order_status,
      'confirmed'::public.order_status
    );

  UPDATE public.rescue_bags
  SET
    quantity_reserved = quantity_reserved + NEW.quantity,
    status = CASE
      WHEN quantity_reserved + NEW.quantity >= quantity_available
        THEN 'sold_out'::public.rescue_bag_status
      ELSE status
    END
  WHERE id = NEW.bag_id
    AND status = 'active'::public.rescue_bag_status
    AND customer_reserved_qty + NEW.quantity <= max_per_customer
    AND (quantity_available - quantity_reserved) >= NEW.quantity
  RETURNING id INTO updated_id;

  IF updated_id IS NULL THEN
    IF EXISTS (
      SELECT 1
      FROM public.rescue_bags
      WHERE id = NEW.bag_id
        AND customer_reserved_qty + NEW.quantity > max_per_customer
    ) THEN
      RAISE EXCEPTION 'bag_customer_limit' USING ERRCODE = 'P0001';
    END IF;
    RAISE EXCEPTION 'bag_sold_out' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;
