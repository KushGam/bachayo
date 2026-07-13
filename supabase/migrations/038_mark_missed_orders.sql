-- Mark no-show reservations after pickup window ends; expire closed bags; release reserved stock.

CREATE OR REPLACE FUNCTION public.release_bag_on_order_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    NEW.status = 'cancelled'::public.order_status
    AND OLD.status IS DISTINCT FROM 'cancelled'::public.order_status
  ) OR (
    NEW.status = 'picked_up'::public.order_status
    AND OLD.status IS DISTINCT FROM 'picked_up'::public.order_status
  ) OR (
    NEW.status = 'missed'::public.order_status
    AND OLD.status IS DISTINCT FROM 'missed'::public.order_status
  ) THEN
    PERFORM public.sync_rescue_bag_reserved_quantity(NEW.bag_id);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_missed_orders_after_pickup()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer := 0;
  nepal_today date;
  nepal_now time;
BEGIN
  nepal_today := (timezone('Asia/Kathmandu', now()))::date;
  nepal_now := (timezone('Asia/Kathmandu', now()))::time;

  WITH closed AS (
    SELECT o.id
    FROM public.orders o
    INNER JOIN public.rescue_bags b ON b.id = o.bag_id
    WHERE o.status IN (
      'pending'::public.order_status,
      'confirmed'::public.order_status
    )
      AND (
        b.available_date < nepal_today
        OR (
          b.available_date = nepal_today
          AND b.pickup_end::time < nepal_now
        )
      )
  )
  UPDATE public.orders o
  SET status = 'missed'::public.order_status
  FROM closed
  WHERE o.id = closed.id;

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  UPDATE public.rescue_bags b
  SET status = 'expired'::public.rescue_bag_status
  WHERE b.status IN (
      'active'::public.rescue_bag_status,
      'sold_out'::public.rescue_bag_status
    )
    AND (
      b.available_date < nepal_today
      OR (
        b.available_date = nepal_today
        AND b.pickup_end::time < nepal_now
      )
    );

  RETURN updated_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_missed_orders_after_pickup() TO authenticated, service_role;

-- One-shot backfill for stuck active reservations.
SELECT public.mark_missed_orders_after_pickup();
