-- Drop the overly permissive policies on projects table
DROP POLICY IF EXISTS "allow all select on projects" ON public.projects;
DROP POLICY IF EXISTS "allow all insert on projects" ON public.projects;
DROP POLICY IF EXISTS "allow all update on projects" ON public.projects;

-- Create secure policies that restrict access to project owners only
CREATE POLICY "Users can view their own projects"
ON public.projects
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects"
ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
ON public.projects
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Service role retains full access for backend operations
CREATE POLICY "Service role has full access to projects"
ON public.projects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);