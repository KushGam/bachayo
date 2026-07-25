-- Picked-up bags must keep consuming capacity so listings don't reopen ("relist")
-- after customers collect. Cancel still frees slots; pickup does not.

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
    AND o.status IN (
      'pending'::public.order_status,
      'confirmed'::public.order_status,
      'picked_up'::public.order_status
    )
  GROUP BY o.bag_id;
$$;

CREATE OR REPLACE FUNCTION public.sync_rescue_bag_reserved_quantity(target_bag_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  occupied_qty integer;
BEGIN
  -- Slots consumed = still reserved OR already picked up (not cancelled/missed).
  SELECT COALESCE(SUM(o.quantity), 0)::integer
  INTO occupied_qty
  FROM public.orders o
  WHERE o.bag_id = target_bag_id
    AND o.status IN (
      'pending'::public.order_status,
      'confirmed'::public.order_status,
      'picked_up'::public.order_status
    );

  UPDATE public.rescue_bags rb
  SET
    quantity_reserved = occupied_qty,
    status = CASE
      WHEN rb.status IN (
        'expired'::public.rescue_bag_status,
        'cancelled'::public.rescue_bag_status
      ) THEN rb.status
      WHEN occupied_qty >= rb.quantity_available AND rb.quantity_available > 0
        THEN 'sold_out'::public.rescue_bag_status
      WHEN occupied_qty < rb.quantity_available
        AND rb.status = 'sold_out'::public.rescue_bag_status
        THEN 'active'::public.rescue_bag_status
      ELSE rb.status
    END
  WHERE rb.id = target_bag_id;
END;
$$;

-- New reservations only on active bags with free capacity (sold_out stays closed).
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
  SET
    quantity_reserved = quantity_reserved + NEW.quantity,
    status = CASE
      WHEN quantity_reserved + NEW.quantity >= quantity_available
        THEN 'sold_out'::public.rescue_bag_status
      ELSE status
    END
  WHERE id = NEW.bag_id
    AND status = 'active'::public.rescue_bag_status
    AND (quantity_available - quantity_reserved) >= NEW.quantity
  RETURNING id INTO updated_id;

  IF updated_id IS NULL THEN
    RAISE EXCEPTION 'bag_sold_out' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

-- Backfill: bags that were wrongly reopened after full pickup.
SELECT public.sync_rescue_bag_reserved_quantity(id)
FROM public.rescue_bags
WHERE status IN (
  'active'::public.rescue_bag_status,
  'sold_out'::public.rescue_bag_status
)
AND available_date >= (timezone('Asia/Kathmandu', now()))::date - 7;
