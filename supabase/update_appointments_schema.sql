-- Add notes column to appointments table
alter table public.appointments add column if not exists notes text;
-- Add title column if we want to store class title separately, strictly speaking the user used notes for this
alter table public.appointments add column if not exists title text;

-- Check if we need to enable RLS again or if policies cover new columns (they usually do for 'all')
