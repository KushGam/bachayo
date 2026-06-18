-- Push notifications: device tokens + scheduled notification queue

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS push_token text;

CREATE TABLE public.scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  send_at timestamptz NOT NULL,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_scheduled_notifications_pending
  ON public.scheduled_notifications (send_at)
  WHERE sent_at IS NULL;

ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- Only service role (Edge Functions) accesses scheduled_notifications.
