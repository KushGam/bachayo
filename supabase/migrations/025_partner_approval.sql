ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'partners_approval_status_check'
  ) THEN
    ALTER TABLE public.partners
      ADD CONSTRAINT partners_approval_status_check
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_partners_approval ON public.partners(approval_status);

-- Existing partners stay approved; only new signups start as pending.
UPDATE public.partners
SET
  approval_status = 'approved',
  approved_at = COALESCE(approved_at, created_at, now())
WHERE approval_status IS NULL OR approval_status = 'pending';
