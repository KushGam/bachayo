-- App Help & Support → Contact Us messages for the admin inbox.

CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject text NOT NULL,
  message text NOT NULL,
  email text NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  role text,
  status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'open', 'resolved')),
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_support_messages_status_created
  ON public.support_messages (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_messages_created
  ON public.support_messages (created_at DESC);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Service role (admin API / contact route) bypasses RLS.
-- No authenticated policies: users submit via backend API only.
