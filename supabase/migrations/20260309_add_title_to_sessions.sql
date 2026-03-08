-- Add title column to class_sessions table
alter table public.class_sessions
add column if not exists title text;
