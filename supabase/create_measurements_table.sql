-- Temiz başlangıç için önce sil (Henüz veri yoksa güvenli)
drop table if exists public.measurements cascade;

-- Create Measurements Table
create table public.measurements (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  date date default current_date not null,
  weight numeric(5,2), -- Kilo
  height numeric(5,2), -- Boy
  chest numeric(5,2), -- Göğüs
  waist numeric(5,2), -- Bel
  hip numeric(5,2), -- Basen
  arm_right numeric(5,2), -- Sağ Kol
  arm_left numeric(5,2), -- Sol Kol
  leg_right numeric(5,2), -- Sağ Bacak
  leg_left numeric(5,2), -- Sol Bacak
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.measurements enable row level security;

create policy "Users can view measurements of their organization"
  on public.measurements for select
  using (organization_id in (
    select organization_id from public.users
    where users.clerk_id = auth.uid()::text -- DÜZELTME: UUID -> TEXT cast
  ));

create policy "Users can insert measurements for their organization"
  on public.measurements for insert
  with check (organization_id in (
    select organization_id from public.users
    where users.clerk_id = auth.uid()::text -- DÜZELTME
  ));

create policy "Users can update measurements for their organization"
  on public.measurements for update
  using (organization_id in (
    select organization_id from public.users
    where users.clerk_id = auth.uid()::text -- DÜZELTME
  ));

create policy "Users can delete measurements for their organization"
  on public.measurements for delete
  using (organization_id in (
    select organization_id from public.users
    where users.clerk_id = auth.uid()::text -- DÜZELTME
  ));
