ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS suspension_reason text,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

ALTER TABLE public.partners DROP CONSTRAINT IF EXISTS partners_approval_status_check;

ALTER TABLE public.partners
  ADD CONSTRAINT partners_approval_status_check
  CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended', 'deleted'));
