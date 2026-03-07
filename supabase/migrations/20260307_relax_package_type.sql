
-- Migration: Relax package type constraint to support all industries
DO $$ 
BEGIN
    -- Drop the specific check constraint if it exists
    ALTER TABLE public.packages DROP CONSTRAINT IF EXISTS packages_type_check;
    
    -- Ensure the column exists (it should, but just in case)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packages' AND column_name = 'type') THEN
        ALTER TABLE public.packages ADD COLUMN type text DEFAULT 'standard';
    END IF;
END $$;

-- Optional: If we want to keep some safety but allow more types
-- ALTER TABLE public.packages ADD CONSTRAINT packages_type_check CHECK (type IN ('private', 'group', 'duo', 'treatment', 'hair_cut', 'standard', 'package_deal'));
-- Better to keep it open for SaaS flexibility.
