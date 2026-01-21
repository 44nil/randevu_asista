-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ORGANIZATIONS TABLE
-- -----------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subdomain text unique not null,
  industry_type text not null check (industry_type in ('hair', 'dental', 'pilates', 'general')),
  settings jsonb default '{"sms_enabled": false, "currency": "TRY", "working_hours": []}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Organizations are public readable for subdomain checks, but writable only by admins (initially)
alter table public.organizations enable row level security;

create policy "Organizations are viewable by everyone" 
  on public.organizations for select using (true);


-- -----------------------------------------------------------------------------
-- 2. USERS TABLE (Synced with Clerk)
-- -----------------------------------------------------------------------------
create table public.users (
  id uuid primary key default uuid_generate_v4(),
  clerk_id text unique not null,
  email text not null,
  full_name text,
  role text not null check (role in ('super_admin', 'owner', 'staff', 'customer')),
  organization_id uuid references public.organizations(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Users can view their own data. 
-- Staff/Owner can view users in their organization.
alter table public.users enable row level security;

create policy "Users can view their own data" 
  on public.users for select using ( auth.uid()::text = clerk_id );

-- Helper function to get current user role
create or replace function public.get_my_role()
returns text as $$
  select role from public.users where clerk_id = auth.uid()::text limit 1;
$$ language sql security definer;

-- Helper function to get current user organization
create or replace function public.get_my_org_id()
returns uuid as $$
  select organization_id from public.users where clerk_id = auth.uid()::text limit 1;
$$ language sql security definer;


-- -----------------------------------------------------------------------------
-- 3. CUSTOMERS TABLE (Polymorphic Data)
-- -----------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  phone text,
  email text,
  metadata jsonb default '{}'::jsonb, -- Industry specific data
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Only accessible by Owner/Staff of the same Organization
alter table public.customers enable row level security;

create policy "Staff and Owners can view their org customers" 
  on public.customers for select 
  using ( 
    organization_id = public.get_my_org_id() 
    AND 
    public.get_my_role() IN ('owner', 'staff')
  );

create policy "Staff and Owners can insert customers" 
  on public.customers for insert 
  with check ( 
    organization_id = public.get_my_org_id() 
    AND 
    public.get_my_role() IN ('owner', 'staff')
  );
  
create policy "Staff and Owners can update customers" 
  on public.customers for update 
  using ( 
    organization_id = public.get_my_org_id() 
    AND 
    public.get_my_role() IN ('owner', 'staff')
  );


-- -----------------------------------------------------------------------------
-- 4. APPOINTMENTS TABLE
-- -----------------------------------------------------------------------------
create table public.appointments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id),
  customer_id uuid references public.customers(id),
  staff_id uuid references public.users(id), -- Assigned staff
  service_id text, -- Placeholder for service relation if needed later
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  status text check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS:
-- Owner/Staff: Can view/create/edit all appointments in their org.
-- Customer: Can view ONLY their own appointments.

alter table public.appointments enable row level security;

create policy "Org members can view all appointments" 
  on public.appointments for select 
  using (
    organization_id = public.get_my_org_id()
    AND
    public.get_my_role() IN ('owner', 'staff')
  );

-- For customers (assuming they query by their customer_id matching their user record somehow, 
-- or strictly viewing own if we link customer to user. For now, let's keep it simple for Staff usage primarily as requested.)
-- Note: The request focuses on Staff/Owner managing appointments mostly, but Customers can "see past appointments".
-- We might need to link Users table to Customers table or store customer_user_id in appointments.
-- For simpler SaaS structure where Customer is flexible (walk-in vs online):
-- We will assume online customers have a record in `users` table with role 'customer', and we match email/phone.
-- OR we add `user_id` to appointments. For now, sticking to request "Customer: Randevu alır, geçmiş randevularını görür."

-- Function to handle new user from Clerk (Webhook will call this or we use direct insert)
-- Actually, Webhook usually inserts into `users` table.

