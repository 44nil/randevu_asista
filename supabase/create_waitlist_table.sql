-- Create waitlist table for managing class session waitlists
-- This allows customers to join a waitlist when a class is full

CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL REFERENCES public.class_sessions(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  position integer NOT NULL, -- Queue position (1 = first in line)
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  notified boolean DEFAULT false, -- Has customer been notified of availability?
  
  -- Prevent duplicate entries
  CONSTRAINT unique_session_customer UNIQUE(session_id, customer_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_waitlist_session_id ON public.waitlist(session_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_customer_id ON public.waitlist(customer_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_organization_id ON public.waitlist(organization_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_position ON public.waitlist(session_id, position);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for waitlist

-- Owner/Staff can view all waitlist entries in their organization
CREATE POLICY "Org members can view waitlist" 
  ON public.waitlist FOR SELECT 
  USING (
    organization_id = public.get_my_org_id()
    AND
    public.get_my_role() IN ('owner', 'staff')
  );

-- Customers can view their own waitlist entries
CREATE POLICY "Customers can view own waitlist entries" 
  ON public.waitlist FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      INNER JOIN public.customers c ON c.email = u.email OR c.phone = u.email
      WHERE u.clerk_id = auth.uid()::text
      AND c.id = waitlist.customer_id
    )
  );

-- Customers can add themselves to waitlist
CREATE POLICY "Customers can join waitlist" 
  ON public.waitlist FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      INNER JOIN public.customers c ON c.email = u.email OR c.phone = u.email
      WHERE u.clerk_id = auth.uid()::text
      AND c.id = customer_id
    )
  );

-- Customers can remove themselves from waitlist
CREATE POLICY "Customers can leave waitlist" 
  ON public.waitlist FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      INNER JOIN public.customers c ON c.email = u.email OR c.phone = u.email
      WHERE u.clerk_id = auth.uid()::text
      AND c.id = waitlist.customer_id
    )
  );

-- Owner/Staff can manage waitlist (insert/update/delete)
CREATE POLICY "Org members can manage waitlist" 
  ON public.waitlist FOR ALL 
  USING (
    organization_id = public.get_my_org_id()
    AND
    public.get_my_role() IN ('owner', 'staff')
  );

-- Function to automatically update positions when someone leaves the waitlist
CREATE OR REPLACE FUNCTION public.reorder_waitlist_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- When a waitlist entry is deleted, update positions of remaining entries
  IF TG_OP = 'DELETE' THEN
    UPDATE public.waitlist
    SET position = position - 1
    WHERE session_id = OLD.session_id
    AND position > OLD.position;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to reorder positions after deletion
CREATE TRIGGER reorder_waitlist_after_delete
  AFTER DELETE ON public.waitlist
  FOR EACH ROW
  EXECUTE FUNCTION public.reorder_waitlist_positions();

-- Function to get next position for a session's waitlist
CREATE OR REPLACE FUNCTION public.get_next_waitlist_position(p_session_id uuid)
RETURNS integer AS $$
  SELECT COALESCE(MAX(position), 0) + 1
  FROM public.waitlist
  WHERE session_id = p_session_id;
$$ LANGUAGE sql;

-- Comments for documentation
COMMENT ON TABLE public.waitlist IS 'Manages waitlist for full class sessions';
COMMENT ON COLUMN public.waitlist.position IS 'Queue position - 1 is first in line';
COMMENT ON COLUMN public.waitlist.notified IS 'Whether customer has been notified of spot availability';
