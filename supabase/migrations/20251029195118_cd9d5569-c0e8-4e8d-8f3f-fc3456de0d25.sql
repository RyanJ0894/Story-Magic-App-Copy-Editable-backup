-- Create director_json table (if not exists) to store AI Director analysis results
-- Note: project_id is TEXT to match the format expected by external webhooks
CREATE TABLE IF NOT EXISTS public.director_json (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  json_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Enable RLS
ALTER TABLE public.director_json ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read own director_json" ON public.director_json;
DROP POLICY IF EXISTS "Allow service_role insert" ON public.director_json;

-- Policy: Users can view director_json (allow all authenticated users to read)
CREATE POLICY "Users can read own director_json"
  ON public.director_json
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow service role to insert director_json (for webhook callbacks)
CREATE POLICY "Allow service_role insert"
  ON public.director_json
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Create indexes for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_director_json_project_id ON public.director_json(project_id);
CREATE INDEX IF NOT EXISTS idx_director_json_created_at ON public.director_json(created_at DESC);