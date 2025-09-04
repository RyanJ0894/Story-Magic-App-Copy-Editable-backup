-- Update project visibility policies for role-based hierarchy
DROP POLICY IF EXISTS "Enable select for own projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON public.user_projects;

-- Create new project visibility policy based on role hierarchy
CREATE POLICY "Users can view projects based on role hierarchy" 
ON public.user_projects 
FOR SELECT 
USING (
    -- Master can see all projects
    public.get_user_role() = 'Master' OR
    -- Team Lead can see projects from users they invited
    (public.get_user_role() = 'Team Lead' AND 
     EXISTS (
         SELECT 1 FROM public.profiles 
         WHERE user_id = user_projects.user_id 
         AND invited_by = auth.uid()
     )) OR
    -- Users can see their own projects
    user_id = auth.uid()
);

-- Update other project policies to work with hierarchy
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.user_projects;
DROP POLICY IF EXISTS "Users can create their own projects" ON public.user_projects;

CREATE POLICY "Users can create projects" 
ON public.user_projects 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- Update existing projects to have proper user_id (in case some are missing)
UPDATE public.user_projects 
SET user_id = (
    SELECT user_id FROM public.profiles 
    WHERE role = 'Master' 
    LIMIT 1
) 
WHERE user_id IS NULL;