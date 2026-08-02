-- Pre-launch security hardening for orders + partners RLS

-- 1) Customers may cancel or reduce quantity, but cannot mark pickup themselves.
DROP POLICY IF EXISTS "Customers can update own orders" ON public.orders;

DROP POLICY IF EXISTS "Customers can cancel own orders" ON public.orders;
CREATE POLICY "Customers can cancel own orders"
  ON public.orders
  FOR UPDATE
  USING (
    customer_id = auth.uid()
    AND status IN (
      'confirmed'::public.order_status,
      'pending'::public.order_status
    )
  )
  WITH CHECK (
    customer_id = auth.uid()
    AND status = 'cancelled'::public.order_status
  );

DROP POLICY IF EXISTS "Customers can adjust own order quantity" ON public.orders;
CREATE POLICY "Customers can adjust own order quantity"
  ON public.orders
  FOR UPDATE
  USING (
    customer_id = auth.uid()
    AND status IN (
      'confirmed'::public.order_status,
      'pending'::public.order_status
    )
  )
  WITH CHECK (
    customer_id = auth.uid()
    AND status IN (
      'confirmed'::public.order_status,
      'pending'::public.order_status
    )
  );

-- 2) Public partner browse only shows approved + active partners.
-- Own-record policy already covers pending partners reading themselves.
DROP POLICY IF EXISTS "Anyone can view active partners" ON public.partners;
CREATE POLICY "Anyone can view active partners"
  ON public.partners
  FOR SELECT
  USING (
    is_active = true
    AND COALESCE(approval_status, 'approved') = 'approved'
  );

-- 3) Partners cannot self-approve or change billing via the client.
CREATE OR REPLACE FUNCTION public.protect_partner_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role / backend admin may change anything.
  IF coalesce(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    NEW.approval_status := OLD.approval_status;
    NEW.is_active := OLD.is_active;
    NEW.subscription_tier := OLD.subscription_tier;
    NEW.subscription_status := OLD.subscription_status;
    NEW.trial_started_at := OLD.trial_started_at;
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.current_period_start := OLD.current_period_start;
    NEW.current_period_end := OLD.current_period_end;
    NEW.payment_method_on_file := OLD.payment_method_on_file;
    NEW.payment_method_type := OLD.payment_method_type;
    NEW.payment_method_mask := OLD.payment_method_mask;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_partner_sensitive_columns ON public.partners;
CREATE TRIGGER trg_protect_partner_sensitive_columns
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_partner_sensitive_columns();
