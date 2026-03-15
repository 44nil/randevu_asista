-- Safe Migration Plan for organizations -> businesses
-- This script will be executed manually in Supabase SQL Editor

-- Step 1: First, add the slug column to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug VARCHAR(50);

-- Step 2: Add unique constraint later after populating data
-- ALTER TABLE organizations ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);

-- Step 3: Populate slug values based on existing subdomain or name
-- We'll do this manually for each organization to ensure uniqueness

-- Example updates (replace with actual data):
-- UPDATE organizations SET slug = 'ornek-berber' WHERE id = 'actual-uuid-here';
-- UPDATE organizations SET slug = 'deneme-pilates' WHERE id = 'actual-uuid-here';

-- Step 4: After verifying all slugs are populated, add the unique constraint:
-- ALTER TABLE organizations ADD CONSTRAINT organizations_slug_unique UNIQUE (slug);

-- Step 5: Then we can rename the table (this will be done in a separate step)
-- ALTER TABLE organizations RENAME TO businesses;

-- For now, we'll just add the slug column and populate it
-- The table rename will come later after we ensure everything works