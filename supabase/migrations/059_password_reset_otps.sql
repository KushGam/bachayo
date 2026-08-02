-- One-time codes for password reset (service-role only).
CREATE TABLE IF NOT EXISTS public.password_reset_otps (
  email text PRIMARY KEY,
  user_id uuid NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_otps_expires_at_idx
  ON public.password_reset_otps (expires_at);

ALTER TABLE public.password_reset_otps ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.password_reset_otps IS
  'Temporary email OTP for password reset. Only the service role may access this table.';
