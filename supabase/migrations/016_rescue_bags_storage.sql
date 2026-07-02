-- Public bucket for rescue bag listing photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('rescue-bags', 'rescue-bags', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read rescue bag images" ON storage.objects;
CREATE POLICY "Public read rescue bag images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rescue-bags');

DROP POLICY IF EXISTS "Authenticated upload rescue bag images" ON storage.objects;
CREATE POLICY "Authenticated upload rescue bag images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'rescue-bags'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.partners WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated update rescue bag images" ON storage.objects;
CREATE POLICY "Authenticated update rescue bag images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'rescue-bags'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.partners WHERE user_id = auth.uid()
    )
  );
