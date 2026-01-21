-- Add contact info columns to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS logo_url text;

-- Ensure settings column has default JSON structure if null (though schema sets default)
-- No action needed if default is set, but helpful for migration if data exists.
