-- Create services table
create table if not exists public.services (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) not null,
  name text not null, -- Hizmet Adı (Saç Kesimi, Reformer vb.)
  duration_minutes integer not null default 60, -- Varsayılan süre
  price decimal(10,2) not null default 0, -- Fiyat
  color text default '#3b82f6', -- Takvimde görünecek renk
  category text, -- Kategori (Saç, Bakım, Ders)
  active boolean default true,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.services enable row level security;

-- Policies

-- Okuma: Herkes kendi organizasyonunun hizmetlerini görebilir
create policy "Users can view their organization's services"
  on public.services for select
  using (organization_id = (select organization_id from public.users where clerk_id = current_setting('request.jwt.claim.sub', true)));

-- Yazma: Sadece Owner ve Staff hizmet ekleyebilir/düzenleyebilir
create policy "Owners and staff can manage services"
  on public.services for all
  using (
    organization_id = (select organization_id from public.users where clerk_id = current_setting('request.jwt.claim.sub', true))
    AND 
    (select role from public.users where clerk_id = current_setting('request.jwt.claim.sub', true)) IN ('owner', 'staff')
  );

-- Indexes
create index idx_services_org_id on public.services(organization_id);
create index idx_services_active on public.services(active);
