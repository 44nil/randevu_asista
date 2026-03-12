-- Add breaks column to staff_schedules table for daily break periods
-- This allows defining lunch breaks, coffee breaks, and other recurring breaks

ALTER TABLE public.staff_schedules 
ADD COLUMN IF NOT EXISTS breaks JSONB DEFAULT '[]'::JSONB;

-- Add comment for documentation
COMMENT ON COLUMN public.staff_schedules.breaks IS 'Array of daily break periods in format: [{"start": "12:00:00", "end": "13:00:00", "name": "Lunch Break"}]';

-- Example breaks structure:
-- [
--   {"start": "12:00:00", "end": "13:00:00", "name": "Lunch Break"},
--   {"start": "15:00:00", "end": "15:15:00", "name": "Coffee Break"}
-- ]