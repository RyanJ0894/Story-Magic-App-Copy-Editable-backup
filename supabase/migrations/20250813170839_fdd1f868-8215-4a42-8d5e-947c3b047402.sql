-- Add title column to match what the client expects
ALTER TABLE public.user_projects ADD COLUMN IF NOT EXISTS title TEXT;

-- Update existing rows to copy project_name to title
UPDATE public.user_projects SET title = project_name WHERE title IS NULL;