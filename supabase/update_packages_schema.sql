-- Add type column to packages table
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS type text CHECK (type IN ('private', 'group', 'duo')) DEFAULT 'group';

-- Add unique constraint to prevent duplicate package names within an organization (optional but good practice)
-- ALTER TABLE public.packages ADD CONSTRAINT unique_package_name_per_org UNIQUE (organization_id, name);

-- RLS policies should already cover the new column as they cover the whole table usually.
