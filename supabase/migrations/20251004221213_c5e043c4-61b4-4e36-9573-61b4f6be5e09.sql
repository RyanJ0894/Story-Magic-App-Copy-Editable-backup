-- Enable RLS on mix_jobs table
ALTER TABLE public.mix_jobs ENABLE ROW LEVEL SECURITY;

-- Add user_id column to track job ownership
ALTER TABLE public.mix_jobs ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_mix_jobs_user_id ON public.mix_jobs(user_id);

-- Policy: Users can view their own jobs
CREATE POLICY "Users can view their own mix jobs"
ON public.mix_jobs
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can insert their own jobs
CREATE POLICY "Users can create their own mix jobs"
ON public.mix_jobs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own jobs
CREATE POLICY "Users can update their own mix jobs"
ON public.mix_jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Service role has full access (for edge functions)
CREATE POLICY "Service role has full access to mix jobs"
ON public.mix_jobs
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);