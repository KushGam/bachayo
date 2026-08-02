-- Keep partner performance (orders + reviews) when a customer account is deleted.
-- Snapshot display name onto orders, strip phone PII, then SET NULL FKs.

-- ---------------------------------------------------------------------------
-- orders.customer_id → nullable, ON DELETE SET NULL
-- ---------------------------------------------------------------------------
ALTER TABLE public.orders
  ALTER COLUMN customer_id DROP NOT NULL;

DO $$
DECLARE
  con_name text;
BEGIN
  SELECT tc.constraint_name INTO con_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'orders'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'customer_id'
  LIMIT 1;

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.orders DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_customer_id_fkey
  FOREIGN KEY (customer_id)
  REFERENCES public.profiles (id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- reviews.customer_id → nullable, ON DELETE SET NULL (keep ratings)
-- ---------------------------------------------------------------------------
ALTER TABLE public.reviews
  ALTER COLUMN customer_id DROP NOT NULL;

DO $$
DECLARE
  con_name text;
BEGIN
  SELECT tc.constraint_name INTO con_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'reviews'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'customer_id'
  LIMIT 1;

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.reviews DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_customer_id_fkey
  FOREIGN KEY (customer_id)
  REFERENCES public.profiles (id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- order_messages.sender_id → ON DELETE SET NULL
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  con_name text;
BEGIN
  SELECT tc.constraint_name INTO con_name
  FROM information_schema.table_constraints AS tc
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
   AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'order_messages'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'sender_id'
  LIMIT 1;

  IF con_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.order_messages DROP CONSTRAINT %I', con_name);
  END IF;
END $$;

ALTER TABLE public.order_messages
  ADD CONSTRAINT order_messages_sender_id_fkey
  FOREIGN KEY (sender_id)
  REFERENCES public.profiles (id)
  ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- Before a customer profile is removed: keep a display name on orders,
-- strip phone PII. Partner sales/revenue/reviews stay intact.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prepare_customer_profile_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.role IS DISTINCT FROM 'customer'::public.user_role THEN
    RETURN OLD;
  END IF;

  UPDATE public.orders
  SET
    customer_name = COALESCE(
      NULLIF(btrim(customer_name), ''),
      NULLIF(btrim(OLD.full_name), ''),
      'Customer'
    ),
    customer_phone = NULL
  WHERE customer_id = OLD.id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_prepare_customer_profile_delete ON public.profiles;

CREATE TRIGGER trg_prepare_customer_profile_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prepare_customer_profile_delete();

COMMENT ON FUNCTION public.prepare_customer_profile_delete() IS
  'On customer delete: snapshot name onto orders and clear phone so partner history remains.';
