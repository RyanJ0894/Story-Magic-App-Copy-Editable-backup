-- Fix security vulnerability in raw_webhooks table
-- Remove the current overly permissive policy and replace with more restrictive ones

-- Drop the existing policy that might be too permissive
DROP POLICY IF EXISTS "Service role full access on raw_webhooks" ON public.raw_webhooks;

-- Create a policy that explicitly denies access to regular users
CREATE POLICY "Deny access to regular users on raw_webhooks" 
ON public.raw_webhooks 
FOR ALL 
TO authenticated 
USING (false);

-- Create a policy that allows only service role access
CREATE POLICY "Service role only access on raw_webhooks" 
ON public.raw_webhooks 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create a policy that allows Master users to view webhook data for debugging/admin purposes
CREATE POLICY "Master users can read raw_webhooks" 
ON public.raw_webhooks 
FOR SELECT 
TO authenticated 
USING (public.get_user_role() = 'Master');

-- Ensure RLS is enabled
ALTER TABLE public.raw_webhooks ENABLE ROW LEVEL SECURITY;