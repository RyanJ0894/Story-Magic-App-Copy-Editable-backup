-- Enable RLS on tables that are missing it
ALTER TABLE public.raw_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_logs ENABLE ROW LEVEL SECURITY;

-- Add basic policies for raw_webhooks (service role only access)
CREATE POLICY "Service role full access on raw_webhooks" 
ON public.raw_webhooks 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Add basic policies for agent_logs (service role only access)
CREATE POLICY "Service role full access on agent_logs" 
ON public.agent_logs 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);