-- Create packages table
create table if not exists public.packages (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) not null,
  name text not null,
  price decimal(10,2) not null,
  sessions integer not null, -- Number of sessions in package
  duration_days integer, -- Validity in days
  active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.packages enable row level security;

-- Policies
create policy "Users can view their organization's packages"
  on public.packages for select
  using (organization_id = (select organization_id from public.users where clerk_id = current_setting('request.jwt.claim.sub', true)));

create policy "Owners and staff can manage packages"
  on public.packages for all
  using (organization_id = (select organization_id from public.users where clerk_id = current_setting('request.jwt.claim.sub', true)));

-- Create sales table
create table if not exists public.sales (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) not null,
  customer_id uuid references public.customers(id) not null,
  package_id uuid references public.packages(id),
  amount decimal(10,2) not null,
  sale_date timestamptz default now()
);

-- Enable RLS
alter table public.sales enable row level security;

-- Policies
create policy "Users can view their organization's sales"
  on public.sales for select
  using (organization_id = (select organization_id from public.users where clerk_id = current_setting('request.jwt.claim.sub', true)));

create policy "Owners and staff can create sales"
  on public.sales for insert
  with check (organization_id = (select organization_id from public.users where clerk_id = current_setting('request.jwt.claim.sub', true)));
