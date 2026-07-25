-- When a customer reduces order quantity (partial cancel), recompute bag reserved stock.

CREATE OR REPLACE FUNCTION public.sync_bag_on_order_quantity_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.quantity IS DISTINCT FROM OLD.quantity
     AND NEW.status IN ('pending'::public.order_status, 'confirmed'::public.order_status) THEN
    PERFORM public.sync_rescue_bag_reserved_quantity(NEW.bag_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_bag_on_order_quantity_change ON public.orders;
CREATE TRIGGER trg_sync_bag_on_order_quantity_change
  AFTER UPDATE OF quantity ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_bag_on_order_quantity_change();

-- Allow client to force a stock resync after partial cancel (idempotent).
GRANT EXECUTE ON FUNCTION public.sync_rescue_bag_reserved_quantity(uuid) TO authenticated;
