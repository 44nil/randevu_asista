-- 1. Create Staff Schedules Table
CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0 = Sunday, 1 = Monday, etc.
  start_time TIME WITHOUT TIME ZONE NOT NULL DEFAULT '09:00:00',
  end_time TIME WITHOUT TIME ZONE NOT NULL DEFAULT '18:00:00',
  is_working_day BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, day_of_week)
);

-- 2. Create Staff Time Offs Table
CREATE TABLE IF NOT EXISTS public.staff_time_offs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS: Enable security
ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_time_offs ENABLE ROW LEVEL SECURITY;

-- Staff schedules policies
CREATE POLICY "Staff can view schedules of their organization" 
  ON public.staff_schedules FOR SELECT 
  USING ( organization_id = public.get_my_org_id() );

CREATE POLICY "Owners and Staff can manage schedules" 
  ON public.staff_schedules FOR ALL
  USING ( 
    organization_id = public.get_my_org_id() 
    AND 
    public.get_my_role() IN ('owner', 'admin')
  );

-- Staff time offs policies
CREATE POLICY "Staff can view time offs of their organization" 
  ON public.staff_time_offs FOR SELECT 
  USING ( organization_id = public.get_my_org_id() );

CREATE POLICY "Owners and Staff can manage time offs" 
  ON public.staff_time_offs FOR ALL
  USING ( 
    organization_id = public.get_my_org_id() 
    AND 
    public.get_my_role() IN ('owner', 'admin')
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_schedules_org ON public.staff_schedules(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_user ON public.staff_schedules(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_time_offs_org ON public.staff_time_offs(organization_id);
CREATE INDEX IF NOT EXISTS idx_staff_time_offs_user ON public.staff_time_offs(user_id);