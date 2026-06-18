-- Payment session storage for gateway redirects (eSewa signed form payloads)

CREATE TABLE public.payment_sessions (
  order_id uuid PRIMARY KEY REFERENCES public.orders (id) ON DELETE CASCADE,
  gateway text NOT NULL CHECK (gateway IN ('esewa', 'khalti')),
  transaction_ref text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_sessions ENABLE ROW LEVEL SECURITY;

-- No client policies: only service role (Edge Functions) accesses this table.
