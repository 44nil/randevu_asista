-- Create class_sessions table
-- This table stores group class sessions that can have multiple appointments linked to them

CREATE TABLE IF NOT EXISTS public.class_sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_id text NOT NULL, -- Type of class: 'reformer', 'mat', 'private'
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  capacity integer NOT NULL DEFAULT 1, -- Maximum number of participants
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add session_id to appointments table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' 
    AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.appointments 
    ADD COLUMN session_id uuid REFERENCES public.class_sessions(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_class_sessions_org_id ON public.class_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_instructor_id ON public.class_sessions(instructor_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_start_time ON public.class_sessions(start_time);
CREATE INDEX IF NOT EXISTS idx_class_sessions_service_id ON public.class_sessions(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_session_id ON public.appointments(session_id);

-- Enable RLS
ALTER TABLE public.class_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for class_sessions
-- Owner/Staff can view all sessions in their organization
CREATE POLICY "Org members can view class sessions" 
  ON public.class_sessions FOR SELECT 
  USING (
    organization_id = public.get_my_org_id()
    AND
    public.get_my_role() IN ('owner', 'staff')
  );

-- Owner/Staff can create sessions in their organization
CREATE POLICY "Org members can create class sessions" 
  ON public.class_sessions FOR INSERT 
  WITH CHECK (
    organization_id = public.get_my_org_id()
    AND
    public.get_my_role() IN ('owner', 'staff')
  );

-- Owner/Staff can update sessions in their organization
CREATE POLICY "Org members can update class sessions" 
  ON public.class_sessions FOR UPDATE 
  USING (
    organization_id = public.get_my_org_id()
    AND
    public.get_my_role() IN ('owner', 'staff')
  );

-- Owner/Staff can delete sessions in their organization
CREATE POLICY "Org members can delete class sessions" 
  ON public.class_sessions FOR DELETE 
  USING (
    organization_id = public.get_my_org_id()
    AND
    public.get_my_role() IN ('owner', 'staff')
  );

-- Customers can view class sessions (for booking)
CREATE POLICY "Customers can view class sessions" 
  ON public.class_sessions FOR SELECT 
  USING (
    public.get_my_role() = 'customer'
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_class_sessions_updated_at
  BEFORE UPDATE ON public.class_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE public.class_sessions IS 'Stores group class sessions that can have multiple appointments';
COMMENT ON COLUMN public.class_sessions.capacity IS 'Maximum number of participants allowed in this session';
COMMENT ON COLUMN public.class_sessions.service_id IS 'Type of class: reformer, mat, or private';
