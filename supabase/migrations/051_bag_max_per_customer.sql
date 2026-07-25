-- Partners choose how many bags a single customer may reserve from a listing.
ALTER TABLE public.rescue_bags
ADD COLUMN IF NOT EXISTS max_per_customer integer;

UPDATE public.rescue_bags
SET max_per_customer = LEAST(3, quantity_available)
WHERE max_per_customer IS NULL;

ALTER TABLE public.rescue_bags
ALTER COLUMN max_per_customer SET DEFAULT 1,
ALTER COLUMN max_per_customer SET NOT NULL;

ALTER TABLE public.rescue_bags
DROP CONSTRAINT IF EXISTS rescue_bags_max_per_customer_check;

ALTER TABLE public.rescue_bags
ADD CONSTRAINT rescue_bags_max_per_customer_check
CHECK (max_per_customer >= 1 AND max_per_customer <= quantity_available);

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
  SELECT COALESCE(SUM(o.quantity), 0)::integer
  INTO customer_reserved_qty
  FROM public.orders o
  WHERE o.bag_id = NEW.bag_id
    AND o.customer_id = NEW.customer_id
    AND o.status IN (
      'pending'::public.order_status,
      'confirmed'::public.order_status,
      'picked_up'::public.order_status
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
