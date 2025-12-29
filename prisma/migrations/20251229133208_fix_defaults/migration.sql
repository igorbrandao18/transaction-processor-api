-- Fix missing defaults for id and updated_at columns
ALTER TABLE "transactions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "transactions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

