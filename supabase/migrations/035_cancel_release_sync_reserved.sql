-- On cancel/pickup, recompute reserved stock from active orders (source of truth).
-- Ensures sold_out bags reactivate when a slot is freed.

CREATE OR REPLACE FUNCTION public.release_bag_on_order_cancel()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    NEW.status = 'cancelled'
    AND OLD.status IS DISTINCT FROM 'cancelled'
  ) OR (
    NEW.status = 'picked_up'
    AND OLD.status IS DISTINCT FROM 'picked_up'
  ) THEN
    PERFORM public.sync_rescue_bag_reserved_quantity(NEW.bag_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_release_bag_on_order_cancel ON public.orders;
CREATE TRIGGER trg_release_bag_on_order_cancel
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.release_bag_on_order_cancel();
