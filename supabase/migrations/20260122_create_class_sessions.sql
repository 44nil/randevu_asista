-- 1. Create Class Sessions Table
create table if not exists public.class_sessions (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id),
  instructor_id uuid not null references public.users(id),
  service_id text not null, -- 'reformer', 'private', 'group'
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  capacity int default 1 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS: Organizations can view/edit their own sessions
alter table public.class_sessions enable row level security;

create policy "Org members can view all sessions" 
  on public.class_sessions for select 
  using ( organization_id = public.get_my_org_id() );

create policy "Staff can manage sessions" 
  on public.class_sessions for all
  using ( 
    organization_id = public.get_my_org_id() 
    AND 
    public.get_my_role() IN ('owner', 'staff')
  );

-- 2. Add foreign key to Appointments
alter table public.appointments
add column if not exists session_id uuid references public.class_sessions(id);

-- Optional: Index for performance
create index if not exists idx_sessions_org_time on public.class_sessions(organization_id, start_time);
