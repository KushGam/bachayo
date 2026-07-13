-- Allow partners to post/edit replies on reviews for their restaurant.
-- Customers already have SELECT on own reviews + public SELECT for approved partners.

DROP POLICY IF EXISTS "Partners can reply to reviews for their restaurant" ON public.reviews;

CREATE POLICY "Partners can reply to reviews for their restaurant"
  ON public.reviews
  FOR UPDATE
  USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );

-- Partners may only change reply fields; preserve the customer's review content.
CREATE OR REPLACE FUNCTION public.protect_review_content_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_partner_owner boolean;
  is_customer_owner boolean;
BEGIN
  is_customer_owner := (auth.uid() = OLD.customer_id);
  is_partner_owner := EXISTS (
    SELECT 1
    FROM public.partners p
    WHERE p.id = OLD.partner_id
      AND p.user_id = auth.uid()
  );

  IF is_partner_owner AND NOT is_customer_owner THEN
    NEW.order_id := OLD.order_id;
    NEW.customer_id := OLD.customer_id;
    NEW.partner_id := OLD.partner_id;
    NEW.rating := OLD.rating;
    NEW.comment := OLD.comment;
    NEW.quantity_feedback := OLD.quantity_feedback;
    NEW.value_feedback := OLD.value_feedback;
    NEW.would_return := OLD.would_return;
    NEW.photo_url := OLD.photo_url;
    NEW.created_at := OLD.created_at;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_review_content_on_update ON public.reviews;
CREATE TRIGGER trg_protect_review_content_on_update
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_review_content_on_update();
