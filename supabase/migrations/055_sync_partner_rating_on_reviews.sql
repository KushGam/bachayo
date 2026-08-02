-- Keep partners.rating / total_reviews in sync with live reviews.
-- Fixes stale "5.0 ★" after reviews were CASCADE-deleted with a customer.

CREATE OR REPLACE FUNCTION public.trg_reviews_recalculate_partner_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_partner_id uuid;
BEGIN
  target_partner_id := COALESCE(NEW.partner_id, OLD.partner_id);
  IF target_partner_id IS NOT NULL THEN
    PERFORM public.recalculate_partner_rating(target_partner_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reviews_recalculate_partner_rating ON public.reviews;

CREATE TRIGGER trg_reviews_recalculate_partner_rating
  AFTER INSERT OR UPDATE OF rating, partner_id OR DELETE
  ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_reviews_recalculate_partner_rating();

-- One-time repair for already-stale partner rows.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.partners LOOP
    PERFORM public.recalculate_partner_rating(r.id);
  END LOOP;
END $$;
