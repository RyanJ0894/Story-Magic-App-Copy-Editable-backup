-- Remove insecure temporary policies that expose user content to anonymous users
DROP POLICY IF EXISTS "temporary SELECT policy for anon" ON public.user_projects;
DROP POLICY IF EXISTS "allow anon temporarily" ON public.user_projects;
DROP POLICY IF EXISTS "Temp allow insert for authenticated" ON public.user_projects;

-- Ensure we have proper secure policies (these should already exist but let's verify)
-- Users can only view their own projects
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_projects' 
        AND policyname = 'Users can view their own projects'
    ) THEN
        CREATE POLICY "Users can view their own projects" 
        ON public.user_projects 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can only create projects for themselves
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_projects' 
        AND policyname = 'Users can create their own projects'
    ) THEN
        CREATE POLICY "Users can create their own projects" 
        ON public.user_projects 
        FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Users can only update their own projects
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_projects' 
        AND policyname = 'Users can update their own projects'
    ) THEN
        CREATE POLICY "Users can update their own projects" 
        ON public.user_projects 
        FOR UPDATE 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Users can only delete their own projects
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_projects' 
        AND policyname = 'Users can delete their own projects'
    ) THEN
        CREATE POLICY "Users can delete their own projects" 
        ON public.user_projects 
        FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END $$;