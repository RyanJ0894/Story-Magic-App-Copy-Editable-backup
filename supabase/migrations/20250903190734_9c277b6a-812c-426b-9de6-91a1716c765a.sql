-- Create table for storing user's curated voice selections
CREATE TABLE public.user_voice_selections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  voice_id TEXT NOT NULL,
  voice_name TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, voice_id)
);

-- Enable RLS
ALTER TABLE public.user_voice_selections ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own voice selections" 
ON public.user_voice_selections 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own voice selections" 
ON public.user_voice_selections 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);