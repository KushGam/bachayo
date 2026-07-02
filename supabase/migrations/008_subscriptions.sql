DO $$ BEGIN
  CREATE TYPE public.subscription_tier AS ENUM ('small', 'medium', 'large');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('trial', 'active', 'past_due', 'paused', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS subscription_tier public.subscription_tier DEFAULT 'small';
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS subscription_status public.subscription_status DEFAULT 'trial';
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS trial_started_at timestamptz DEFAULT now();
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT (now() + interval '30 days');
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS avg_daily_meals int;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS current_period_start timestamptz;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS current_period_end timestamptz;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS payment_method_on_file boolean DEFAULT false;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS payment_method_type text;
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS payment_method_mask text;

CREATE TABLE IF NOT EXISTS public.subscription_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE,
  tier public.subscription_tier NOT NULL,
  amount int NOT NULL,
  status text NOT NULL,
  payment_method text,
  payment_ref text,
  period_start date,
  period_end date,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subscription_tier_pricing (
  tier public.subscription_tier PRIMARY KEY,
  monthly_price_npr int NOT NULL,
  max_bags_per_month int,
  label text NOT NULL
);

INSERT INTO public.subscription_tier_pricing (tier, monthly_price_npr, max_bags_per_month, label) VALUES
  ('small', 800, 300, 'Small — dhaba, cafe, home bakery'),
  ('medium', 1800, NULL, 'Medium — restaurant, bakery, cafe chain'),
  ('large', 3500, NULL, 'Large — hotel, supermarket, multi-branch')
ON CONFLICT (tier) DO UPDATE SET
  monthly_price_npr = EXCLUDED.monthly_price_npr,
  max_bags_per_month = EXCLUDED.max_bags_per_month,
  label = EXCLUDED.label;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_partners_subscription_status ON public.partners(subscription_status);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_partner ON public.subscription_payments(partner_id);

-- Row Level Security --------------------------------------------------------

ALTER TABLE public.subscription_tier_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Public tier pricing (read-only reference data)
DROP POLICY IF EXISTS "Anyone can view subscription tier pricing" ON public.subscription_tier_pricing;
CREATE POLICY "Anyone can view subscription tier pricing"
  ON public.subscription_tier_pricing
  FOR SELECT
  USING (true);

-- Partners can view and record their own subscription payments
DROP POLICY IF EXISTS "Partners can view own subscription payments" ON public.subscription_payments;
CREATE POLICY "Partners can view own subscription payments"
  ON public.subscription_payments
  FOR SELECT
  USING (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Partners can insert own subscription payments" ON public.subscription_payments;
CREATE POLICY "Partners can insert own subscription payments"
  ON public.subscription_payments
  FOR INSERT
  WITH CHECK (
    partner_id IN (
      SELECT id FROM public.partners WHERE user_id = auth.uid()
    )
  );
