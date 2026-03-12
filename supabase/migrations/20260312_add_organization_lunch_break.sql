-- Add lunch break settings to organization
-- Simple approach: one lunch break time for entire organization

ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS lunch_break_start TIME DEFAULT '12:00:00',
ADD COLUMN IF NOT EXISTS lunch_break_end TIME DEFAULT '13:00:00',
ADD COLUMN IF NOT EXISTS lunch_break_enabled BOOLEAN DEFAULT true;

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.lunch_break_start IS 'Global lunch break start time for all staff';
COMMENT ON COLUMN public.organizations.lunch_break_end IS 'Global lunch break end time for all staff';
COMMENT ON COLUMN public.organizations.lunch_break_enabled IS 'Whether lunch break is enabled for the organization';

-- Example usage:
-- lunch_break_start: '12:00:00'
-- lunch_break_end: '13:00:00'
-- lunch_break_enabled: true