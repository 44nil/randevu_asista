
-- 1. Fix PACKAGES Table (Add missing columns)
alter table public.packages 
add column if not exists credits integer default 1 not null;

alter table public.packages 
add column if not exists validity_days integer;

-- 2. Create CUSTOMER_PACKAGES Table (drop if exists to be clean or create if not exists)
-- Since user had error, let's play safe and create if not exists
create table if not exists public.customer_packages (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id),
  customer_id uuid not null references public.customers(id),
  package_id uuid references public.packages(id),
  package_name text,
  initial_credits integer not null,
  remaining_credits integer not null,
  price_paid decimal(10,2),
  start_date timestamp with time zone default timezone('utc'::text, now()),
  expiry_date timestamp with time zone,
  status text default 'active' check (status in ('active', 'expired', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index if not exists idx_customer_packages_customer on public.customer_packages(customer_id);
create index if not exists idx_customer_packages_status on public.customer_packages(status);

-- RLS
alter table public.customer_packages enable row level security;

-- Policies (Drop first to avoid duplicates if re-running)
drop policy if exists "Org members can view customer packages" on public.customer_packages;
create policy "Org members can view customer packages" 
  on public.customer_packages for select 
  using (
    organization_id = (select organization_id from public.users where clerk_id = auth.uid()::text limit 1)
  );

drop policy if exists "Org members can manage customer packages" on public.customer_packages;
create policy "Org members can manage customer packages" 
  on public.customer_packages for all
  using (
    organization_id = (select organization_id from public.users where clerk_id = auth.uid()::text limit 1)
    AND
    (select role from public.users where clerk_id = auth.uid()::text limit 1) IN ('owner', 'staff', 'super_admin')
  );
