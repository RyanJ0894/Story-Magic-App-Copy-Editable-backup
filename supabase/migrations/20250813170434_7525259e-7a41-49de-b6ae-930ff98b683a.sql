-- Fix the security warning by setting search_path
CREATE OR REPLACE FUNCTION public.create_user_project(p_title TEXT, p_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_project_id UUID;
BEGIN
  INSERT INTO public.user_projects (project_name, user_id)
  VALUES (p_title, p_user_id)
  RETURNING id INTO new_project_id;
  
  RETURN new_project_id;
END;
$$;