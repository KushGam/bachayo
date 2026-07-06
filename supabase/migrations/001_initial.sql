-- LastBag food rescue app — initial schema

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

CREATE TYPE public.user_role AS ENUM ('customer', 'partner', 'admin');

CREATE TYPE public.partner_category AS ENUM (
  'restaurant',
  'bakery',
  'hotel',
  'dhaba',
  'cafe',
  'supermarket'
);

CREATE TYPE public.rescue_bag_status AS ENUM (
  'active',
  'sold_out',
  'expired',
  'cancelled'
);

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'paid',
  'picked_up',
  'cancelled',
  'refunded'
);

CREATE TYPE public.payment_method AS ENUM ('esewa', 'khalti', 'cash');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name text,
  phone text UNIQUE,
  avatar_url text,
  role public.user_role NOT NULL DEFAULT 'customer',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles (id) ON DELETE CASCADE,
  name text NOT NULL,
  name_np text,
  description text,
  address text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  category public.partner_category NOT NULL,
  cover_image_url text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  rating real NOT NULL DEFAULT 0,
  total_reviews integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.rescue_bags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners (id) ON DELETE CASCADE,
  title text NOT NULL,
  title_np text,
  description text,
  original_price integer NOT NULL CHECK (original_price >= 0),
  rescue_price integer NOT NULL CHECK (rescue_price >= 0),
  quantity_available integer NOT NULL CHECK (quantity_available >= 0),
  quantity_reserved integer NOT NULL DEFAULT 0 CHECK (quantity_reserved >= 0),
  pickup_start time NOT NULL,
  pickup_end time NOT NULL,
  available_date date NOT NULL,
  status public.rescue_bag_status NOT NULL DEFAULT 'active',
  image_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (pickup_end > pickup_start),
  CHECK (quantity_reserved <= quantity_available)
);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  bag_id uuid NOT NULL REFERENCES public.rescue_bags (id) ON DELETE RESTRICT,
  partner_id uuid NOT NULL REFERENCES public.partners (id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price integer NOT NULL CHECK (total_price >= 0),
  status public.order_status NOT NULL DEFAULT 'pending',
  qr_code text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  payment_method public.payment_method,
  payment_ref text,
  picked_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE REFERENCES public.orders (id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners (id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX idx_rescue_bags_partner_date_status
  ON public.rescue_bags (partner_id, available_date, status);

CREATE INDEX idx_partners_location
  ON public.partners (latitude, longitude);

-- Supports geo queries for active bags via partners join, e.g.:
-- SELECT rb.* FROM rescue_bags rb
-- JOIN partners p ON p.id = rb.partner_id
-- WHERE rb.status = 'active' AND p.latitude BETWEEN ... AND p.longitude BETWEEN ...
CREATE INDEX idx_orders_customer_status
  ON public.orders (customer_id, status);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_bags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- profiles ------------------------------------------------------------------

CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- partners ------------------------------------------------------------------

CREATE POLICY "Anyone can view active partners"
  ON public.partners
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Partners can view own partner record"
  ON public.partners
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Partners can insert own partner record"
  ON public.partners
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Partners can update own partner record"
  ON public.partners
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- rescue_bags ---------------------------------------------------------------

CREATE POLICY "Anyone can view active rescue bags"
  ON public.rescue_bags
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Partners can view own rescue bags"
  ON public.rescue_bags
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can insert own rescue bags"
  ON public.rescue_bags
  FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can update own rescue bags"
  ON public.rescue_bags
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

CREATE POLICY "Partners can delete own rescue bags"
  ON public.rescue_bags
  FOR DELETE
  USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );

-- orders --------------------------------------------------------------------

CREATE POLICY "Customers can view own orders"
  ON public.orders
  FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create own orders"
  ON public.orders
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own orders"
  ON public.orders
  FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Partners can view orders for their bags"
  ON public.orders
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );

-- reviews -------------------------------------------------------------------

CREATE POLICY "Customers can view own reviews"
  ON public.reviews
  FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Customers can create own reviews"
  ON public.reviews
  FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can update own reviews"
  ON public.reviews
  FOR UPDATE
  USING (customer_id = auth.uid())
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Customers can delete own reviews"
  ON public.reviews
  FOR DELETE
  USING (customer_id = auth.uid());
