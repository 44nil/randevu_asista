-- Row Level Security (RLS) Modernization Script
-- This script ensures all data is strictly compartmentalized by organization_id

-- 1. Enable RLS on all key tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing restrictive policies to rebuild them
DROP POLICY IF EXISTS "Org members can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Staff and Owners can view their org customers" ON public.customers;

-- 3. Create a powerful helper function to get current user organization securely
-- This needs to work with Clerk JWTs
CREATE OR REPLACE FUNCTION public.get_auth_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM public.users WHERE clerk_id = auth.uid()::text LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER;

-- 4. APPOINTMENTS Policies
CREATE POLICY "Users can only see appointments from their organization"
ON public.appointments
FOR ALL -- Covers SELECT, INSERT, UPDATE, DELETE
USING (organization_id = public.get_auth_org_id())
WITH CHECK (organization_id = public.get_auth_org_id());

-- 5. CUSTOMERS Policies
CREATE POLICY "Users can only see customers from their organization"
ON public.customers
FOR ALL
USING (organization_id = public.get_auth_org_id())
WITH CHECK (organization_id = public.get_auth_org_id());

-- 6. CLASS_SESSIONS Policies
CREATE POLICY "Users can only see sessions from their organization"
ON public.class_sessions
FOR ALL
USING (organization_id = public.get_auth_org_id())
WITH CHECK (organization_id = public.get_auth_org_id());

-- 7. USERS Policies (Self-view and Org-view for Admins)
CREATE POLICY "Users can view members of their own organization"
ON public.users
FOR SELECT
USING (organization_id = public.get_auth_org_id() OR clerk_id = auth.uid()::text);
