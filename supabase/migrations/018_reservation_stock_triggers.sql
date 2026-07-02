-- Reserve / release bag stock when customers create or cancel orders.
-- Client-side updates to rescue_bags are blocked by RLS for customers.

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
    AND status = 'active'
    AND (quantity_available - quantity_reserved) >= NEW.quantity
  RETURNING id INTO updated_id;

  IF updated_id IS NULL THEN
    RAISE EXCEPTION 'bag_sold_out' USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

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
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reserve_bag_on_order_insert ON public.orders;
CREATE TRIGGER trg_reserve_bag_on_order_insert
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.reserve_bag_on_order_insert();

DROP TRIGGER IF EXISTS trg_release_bag_on_order_cancel ON public.orders;
CREATE TRIGGER trg_release_bag_on_order_cancel
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.release_bag_on_order_cancel();
