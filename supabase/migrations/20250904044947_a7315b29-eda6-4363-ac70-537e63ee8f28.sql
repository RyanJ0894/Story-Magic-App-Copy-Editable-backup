-- Fix security vulnerability: Remove overly permissive policy and replace with service-role only access
-- The current policy allows ALL users to access AI events data, which is a serious security risk

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "service-role-full" ON public.ai_events;

-- Create a new policy that only allows service role access
-- This ensures AI events data is only accessible by backend services, not regular users
CREATE POLICY "Service role only access" 
ON public.ai_events 
FOR ALL 
TO service_role
USING (true)
WITH CHECK (true);

-- Ensure no regular users can access this sensitive system data
-- Only service roles (backend functions) should be able to read/write AI events