-- Fix error-level security issues: Enable RLS on tables and fix overly permissive policies

-- 1. Fix director_json overly permissive SELECT policy
-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can read own director_json" ON public.director_json;

-- Create a proper policy that validates project ownership via TEXT project_id
-- Note: director_json.project_id is TEXT while projects.id is UUID, 
-- so we need to cast for comparison
CREATE POLICY "Users can view director_json for their projects"
ON public.director_json
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id::text = director_json.project_id 
    AND projects.user_id = auth.uid()
  )
);

-- 2. Enable RLS on timelines table and add policies
ALTER TABLE public.timelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view timelines for their projects"
ON public.timelines
FOR SELECT
TO authenticated
USING (owns_project(project_id));

CREATE POLICY "Users can create timelines for their projects"
ON public.timelines
FOR INSERT
TO authenticated
WITH CHECK (owns_project(project_id));

CREATE POLICY "Users can update timelines for their projects"
ON public.timelines
FOR UPDATE
TO authenticated
USING (owns_project(project_id));

CREATE POLICY "Users can delete timelines for their projects"
ON public.timelines
FOR DELETE
TO authenticated
USING (owns_project(project_id));

CREATE POLICY "Service role has full access to timelines"
ON public.timelines
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 3. Enable RLS on other project-related tables
ALTER TABLE public.alignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cue_choices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mix_manifests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tts_stems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voice_map ENABLE ROW LEVEL SECURITY;

-- Add policies for alignments
CREATE POLICY "Users can view alignments for their projects"
ON public.alignments FOR SELECT TO authenticated
USING (owns_project(project_id));

CREATE POLICY "Service role has full access to alignments"
ON public.alignments FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Add policies for cue_choices
CREATE POLICY "Users can view cue_choices for their projects"
ON public.cue_choices FOR SELECT TO authenticated
USING (owns_project(project_id));

CREATE POLICY "Service role has full access to cue_choices"
ON public.cue_choices FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Add policies for mix_manifests
CREATE POLICY "Users can view mix_manifests for their projects"
ON public.mix_manifests FOR SELECT TO authenticated
USING (owns_project(project_id));

CREATE POLICY "Service role has full access to mix_manifests"
ON public.mix_manifests FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Add policies for renders
CREATE POLICY "Users can view renders for their projects"
ON public.renders FOR SELECT TO authenticated
USING (owns_project(project_id));

CREATE POLICY "Service role has full access to renders"
ON public.renders FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Add policies for tts_stems
CREATE POLICY "Users can view tts_stems for their projects"
ON public.tts_stems FOR SELECT TO authenticated
USING (owns_project(project_id));

CREATE POLICY "Service role has full access to tts_stems"
ON public.tts_stems FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Add policies for voice_map
CREATE POLICY "Users can view voice_map for their projects"
ON public.voice_map FOR SELECT TO authenticated
USING (owns_project(project_id));

CREATE POLICY "Service role has full access to voice_map"
ON public.voice_map FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- 4. Enable RLS on dead_letter_queue (system table, service role only)
ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access dead_letter_queue"
ON public.dead_letter_queue
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);