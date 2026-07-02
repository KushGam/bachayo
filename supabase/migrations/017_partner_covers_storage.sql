-- Public bucket for partner profile cover photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('partner-covers', 'partner-covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read partner cover images" ON storage.objects;
CREATE POLICY "Public read partner cover images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'partner-covers');

DROP POLICY IF EXISTS "Users upload own partner cover" ON storage.objects;
CREATE POLICY "Users upload own partner cover"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'partner-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users update own partner cover" ON storage.objects;
CREATE POLICY "Users update own partner cover"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'partner-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users delete own partner cover" ON storage.objects;
CREATE POLICY "Users delete own partner cover"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'partner-covers'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
