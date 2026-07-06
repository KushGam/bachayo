-- Release reserved bag slots when an order is picked up (fulfilled).
-- Mirrors cancel release logic so quantity_reserved stays accurate.

CREATE OR REPLACE FUNCTION public.release_bag_on_order_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    UPDATE public.rescue_bags rb
    SET
      quantity_reserved = GREATEST(0, rb.quantity_reserved - NEW.quantity),
      status = CASE
        WHEN rb.status = 'sold_out'
          AND GREATEST(0, rb.quantity_reserved - NEW.quantity) < rb.quantity_available
        THEN 'active'::public.rescue_bag_status
        ELSE rb.status
      END
    WHERE rb.id = NEW.bag_id;
  ELSIF NEW.status = 'picked_up' AND OLD.status IS DISTINCT FROM 'picked_up' THEN
    UPDATE public.rescue_bags rb
    SET
      quantity_reserved = GREATEST(0, rb.quantity_reserved - NEW.quantity),
      status = CASE
        WHEN rb.status = 'sold_out'
          AND GREATEST(0, rb.quantity_reserved - NEW.quantity) < rb.quantity_available
        THEN 'active'::public.rescue_bag_status
        ELSE rb.status
      END
    WHERE rb.id = NEW.bag_id;
  END IF;

  RETURN NEW;
END;
$$;
