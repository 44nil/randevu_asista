-- Step 1: Rename organizations table to businesses and add slug column
-- This is a safe operation that preserves all existing data

-- Rename the table
ALTER TABLE organizations RENAME TO businesses;

-- Add slug column (nullable for now, we'll populate it later)
ALTER TABLE businesses ADD COLUMN slug VARCHAR(50) UNIQUE;

-- Update RLS policies to use new table name
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Users can update their organization" ON organizations;

CREATE POLICY "Users can view businesses they belong to" ON businesses
  FOR SELECT USING (id IN (
    SELECT organization_id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

CREATE POLICY "Users can update their business" ON businesses
  FOR UPDATE USING (id IN (
    SELECT organization_id FROM users WHERE clerk_id = auth.jwt() ->> 'sub'
  ));

-- Update foreign key references in other tables
ALTER TABLE users RENAME COLUMN organization_id TO business_id;
ALTER TABLE customers RENAME COLUMN organization_id TO business_id;
ALTER TABLE services RENAME COLUMN organization_id TO business_id;
ALTER TABLE packages RENAME COLUMN organization_id TO business_id;
ALTER TABLE customer_packages RENAME COLUMN organization_id TO business_id;
ALTER TABLE appointments RENAME COLUMN organization_id TO business_id;
ALTER TABLE class_sessions RENAME COLUMN organization_id TO business_id;
ALTER TABLE staff_schedules RENAME COLUMN organization_id TO business_id;
ALTER TABLE measurements RENAME COLUMN organization_id TO business_id;

-- Update RLS policies for other tables to use business_id
-- Users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (clerk_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (clerk_id = auth.jwt() ->> 'sub');

-- Update other table policies to use business_id instead of organization_id
-- (We'll update these in the application code as well)

COMMENT ON COLUMN businesses.slug IS 'URL-friendly identifier for public booking page: asista.com/[slug]';