-- Add missed order status (must commit before use in later statements / next migration).
-- PG 15+: ADD VALUE is transactional, but the new label cannot be referenced until after commit.

ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'missed';
