-- Add missing columns to user_projects table if they don't exist
ALTER TABLE public.user_projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- Update any existing rows to have a default status
UPDATE public.user_projects SET status = 'draft' WHERE status IS NULL;