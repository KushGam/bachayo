-- Ensure waitlist.city exists (already present in 024; safe no-op if applied).
ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS city text;
