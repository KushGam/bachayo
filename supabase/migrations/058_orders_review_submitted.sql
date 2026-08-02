-- Optional denormalized flag for review prompts / Past-tab CTAs.
-- Source of truth for "has reviewed" remains the unique reviews.order_id row.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS review_submitted boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN orders.review_submitted IS
  'True after the customer submits a review for this order. Kept in sync by the app on insert.';

-- Backfill from existing reviews
UPDATE orders o
SET review_submitted = true
WHERE EXISTS (
  SELECT 1 FROM reviews r WHERE r.order_id = o.id
)
AND o.review_submitted = false;
