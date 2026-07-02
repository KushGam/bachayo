-- In-app notification inbox
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL,
  data jsonb,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications(user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users see own notifications" ON public.notifications;
CREATE POLICY "users see own notifications"
  ON public.notifications FOR ALL
  USING (auth.uid() = user_id);

-- Per-user notification preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_prefs jsonb
  DEFAULT '{
    "new_bags": true,
    "pickup_reminders": true,
    "review_requests": true,
    "cancellations": true,
    "new_reservations": true,
    "bag_expiring": true,
    "subscription_reminders": true,
    "cancellation_alerts": true
  }'::jsonb;
