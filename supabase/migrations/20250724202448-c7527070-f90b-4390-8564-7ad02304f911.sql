-- Add generation_count column to user_projects table
ALTER TABLE public.user_projects 
ADD COLUMN generation_count integer NOT NULL DEFAULT 0;