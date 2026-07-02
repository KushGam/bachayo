-- Remap legacy categories before enum swap
UPDATE public.partners
SET category = 'restaurant'
WHERE category::text IN ('dhaba', 'supermarket');

ALTER TYPE public.partner_category RENAME TO partner_category_old;

CREATE TYPE public.partner_category AS ENUM (
  'restaurant',
  'cafe',
  'bakery',
  'mart',
  'hotel'
);

ALTER TABLE public.partners
  ALTER COLUMN category TYPE public.partner_category
  USING category::text::public.partner_category;

DROP TYPE public.partner_category_old;
