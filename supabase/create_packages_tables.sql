-- Enable UUID extension if not exists
create extension if not exists "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. PACKAGES TABLE (Templates)
-- -----------------------------------------------------------------------------
create table if not exists public.packages (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id),
  name text not null,
  description text,
  price decimal(10,2) not null,
  credits integer not null, -- How many classes
  validity_days integer, -- How many days valid
  service_type text, -- Optional: restrict to specific service types
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Only accessible by Owner/Staff
alter table public.packages enable row level security;

create policy "Org members can view packages" 
  on public.packages for select 
  using (
    organization_id = (select organization_id from public.users where clerk_id = auth.uid()::text limit 1)
  );

create policy "Org members can manage packages" 
  on public.packages for all
  using (
    organization_id = (select organization_id from public.users where clerk_id = auth.uid()::text limit 1)
    AND
    (select role from public.users where clerk_id = auth.uid()::text limit 1) IN ('owner', 'staff', 'super_admin')
  );


-- -----------------------------------------------------------------------------
-- 2. CUSTOMER PACKAGES TABLE (Sales/Active Packages)
-- -----------------------------------------------------------------------------
create table if not exists public.customer_packages (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id),
  customer_id uuid not null references public.customers(id),
  package_id uuid references public.packages(id),
  package_name text, -- Snapshot of name in case package is deleted
  initial_credits integer not null,
  remaining_credits integer not null,
  price_paid decimal(10,2),
  start_date timestamp with time zone default timezone('utc'::text, now()),
  expiry_date timestamp with time zone,
  status text default 'active' check (status in ('active', 'expired', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_customer_packages_customer on public.customer_packages(customer_id);
create index idx_customer_packages_status on public.customer_packages(status);

-- RLS
alter table public.customer_packages enable row level security;

create policy "Org members can view customer packages" 
  on public.customer_packages for select 
  using (
    organization_id = (select organization_id from public.users where clerk_id = auth.uid()::text limit 1)
  );

create policy "Org members can manage customer packages" 
  on public.customer_packages for all
  using (
    organization_id = (select organization_id from public.users where clerk_id = auth.uid()::text limit 1)
    AND
    (select role from public.users where clerk_id = auth.uid()::text limit 1) IN ('owner', 'staff', 'super_admin')
  );
