ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS public.admin_notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL,
  target_label text,
  title text NOT NULL,
  body text NOT NULL,
  recipients_count int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_notification_log_created ON public.admin_notification_log(created_at DESC);
