-- Optional review feedback fields and photo URL
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS quantity_feedback text,
  ADD COLUMN IF NOT EXISTS value_feedback text,
  ADD COLUMN IF NOT EXISTS would_return text,
  ADD COLUMN IF NOT EXISTS photo_url text;
