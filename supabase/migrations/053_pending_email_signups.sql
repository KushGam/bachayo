-- Pending email signups: OTP must be verified BEFORE any auth.users row is created.
CREATE TABLE IF NOT EXISTS public.pending_email_signups (
  email text PRIMARY KEY,
  password_cipher text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  expires_at timestamptz NOT NULL,
  last_sent_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pending_email_signups_expires_at_idx
  ON public.pending_email_signups (expires_at);

ALTER TABLE public.pending_email_signups ENABLE ROW LEVEL SECURITY;

-- No policies for anon/authenticated — only service role accesses this table.

COMMENT ON TABLE public.pending_email_signups IS
  'Temporary email+password+OTP for signup. Auth user is created only after OTP verify.';
