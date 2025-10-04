-- Create security definer function to check project ownership
CREATE OR REPLACE FUNCTION public.owns_project(project_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.projects
    WHERE id = project_uuid
      AND user_id = auth.uid()
  )
$$;

-- Drop the overly permissive policies on project_chunks table
DROP POLICY IF EXISTS "allow all select on project_chunks" ON public.project_chunks;
DROP POLICY IF EXISTS "allow all insert on project_chunks" ON public.project_chunks;
DROP POLICY IF EXISTS "allow all update on project_chunks" ON public.project_chunks;

-- Create secure policies that restrict access to project owners only
CREATE POLICY "Users can view chunks of their own projects"
ON public.project_chunks
FOR SELECT
TO authenticated
USING (public.owns_project(project_id));

CREATE POLICY "Users can create chunks for their own projects"
ON public.project_chunks
FOR INSERT
TO authenticated
WITH CHECK (public.owns_project(project_id));

CREATE POLICY "Users can update chunks of their own projects"
ON public.project_chunks
FOR UPDATE
TO authenticated
USING (public.owns_project(project_id));

CREATE POLICY "Users can delete chunks of their own projects"
ON public.project_chunks
FOR DELETE
TO authenticated
USING (public.owns_project(project_id));

-- Service role retains full access for backend operations
CREATE POLICY "Service role has full access to project_chunks"
ON public.project_chunks
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);