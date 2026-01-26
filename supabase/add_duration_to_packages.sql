-- Add duration_minutes to packages table
ALTER TABLE public.packages ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;
