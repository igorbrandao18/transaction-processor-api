-- Fix missing defaults for id and updated_at columns
-- Only apply if table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transactions') THEN
    ALTER TABLE "transactions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
    ALTER TABLE "transactions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

