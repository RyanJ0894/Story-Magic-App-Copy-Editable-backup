-- Add ai_director_json field to user_projects table
ALTER TABLE public.user_projects 
ADD COLUMN ai_director_json text;