-- Enable realtime UPDATE events for rescue bag stock (quantity_reserved, status).
ALTER TABLE public.rescue_bags REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'rescue_bags'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rescue_bags;
  END IF;
END $$;
