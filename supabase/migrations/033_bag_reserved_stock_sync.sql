-- Keep rescue_bags.quantity_reserved accurate from active orders (source of truth for "X left").
-- Fixes stale counts when the insert trigger was missing or orders pre-dated the trigger.

CREATE OR REPLACE FUNCTION public.get_bags_reserved_counts(bag_ids uuid[])
RETURNS TABLE(bag_id uuid, reserved_quantity integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT
    o.bag_id,
    COALESCE(SUM(o.quantity), 0)::integer AS reserved_quantity
  FROM public.orders o
  WHERE o.bag_id = ANY(bag_ids)
    AND o.status IN ('pending'::public.order_status, 'confirmed'::public.order_status)
  GROUP BY o.bag_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_bags_reserved_counts(uuid[]) TO authenticated, anon;

CREATE OR REPLACE FUNCTION public.sync_rescue_bag_reserved_quantity(target_bag_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reserved_qty integer;
BEGIN
  SELECT COALESCE(SUM(o.quantity), 0)::integer
  INTO reserved_qty
  FROM public.orders o
  WHERE o.bag_id = target_bag_id
    AND o.status IN ('pending'::public.order_status, 'confirmed'::public.order_status);

  UPDATE public.rescue_bags rb
  SET
    quantity_reserved = reserved_qty,
    status = CASE
      WHEN reserved_qty >= rb.quantity_available AND rb.status = 'active' THEN 'sold_out'::public.rescue_bag_status
      WHEN reserved_qty < rb.quantity_available AND rb.status = 'sold_out' THEN 'active'::public.rescue_bag_status
      ELSE rb.status
    END
  WHERE rb.id = target_bag_id;
END;
$$;

-- Ensure reserve trigger exists (idempotent with 018).
CREATE OR REPLACE FUNCTION public.reserve_bag_on_order_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_id uuid;
BEGIN
  UPDATE public.rescue_bags
  SET quantity_reserved = quantity_reserved + NEW.quantity
  WHERE id = NEW.bag_id
    AND status IN ('active', 'sold_out')
    AND (quantity_available - quantity_reserved) >= NEW.quantity
  RETURNING id INTO updated_id;

  IF updated_id IS NULL THEN
    RAISE EXCEPTION 'bag_sold_out' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reserve_bag_on_order_insert ON public.orders;
CREATE TRIGGER trg_reserve_bag_on_order_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.reserve_bag_on_order_insert();

-- Backfill all bags from current active orders.
UPDATE public.rescue_bags rb
SET quantity_reserved = COALESCE((
  SELECT SUM(o.quantity)
  FROM public.orders o
  WHERE o.bag_id = rb.id
    AND o.status IN ('pending'::public.order_status, 'confirmed'::public.order_status)
), 0);

UPDATE public.rescue_bags rb
SET status = 'sold_out'
WHERE rb.status = 'active'
  AND rb.quantity_reserved >= rb.quantity_available
  AND rb.quantity_available > 0;

UPDATE public.rescue_bags rb
SET status = 'active'
WHERE rb.status = 'sold_out'
  AND rb.quantity_reserved < rb.quantity_available;
