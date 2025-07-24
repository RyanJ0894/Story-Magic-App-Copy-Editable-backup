-- Add voice_style and mood columns to user_projects table
ALTER TABLE public.user_projects 
ADD COLUMN voice_style TEXT,
ADD COLUMN mood TEXT;