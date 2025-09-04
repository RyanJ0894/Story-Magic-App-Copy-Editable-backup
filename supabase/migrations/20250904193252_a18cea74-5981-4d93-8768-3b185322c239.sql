-- Add role and hierarchy columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN role text NOT NULL DEFAULT 'Staff' CHECK (role IN ('Master', 'Team Lead', 'Staff', 'Client')),
ADD COLUMN invited_by uuid REFERENCES public.profiles(user_id);

-- Create team_invitations table to track invitation process
CREATE TABLE public.team_invitations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invited_by uuid NOT NULL REFERENCES public.profiles(user_id),
    email text NOT NULL,
    role text NOT NULL CHECK (role IN ('Team Lead', 'Staff', 'Client')),
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    token text NOT NULL UNIQUE,
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    accepted_at timestamp with time zone
);

-- Enable RLS on team_invitations
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

-- Create policies for team_invitations
CREATE POLICY "Users can view invitations they sent" 
ON public.team_invitations 
FOR SELECT 
USING (invited_by = auth.uid());

CREATE POLICY "Users can create invitations based on their role" 
ON public.team_invitations 
FOR INSERT 
WITH CHECK (
    invited_by = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE user_id = auth.uid() 
        AND role IN ('Master', 'Team Lead')
    )
);

CREATE POLICY "Users can update invitations they sent" 
ON public.team_invitations 
FOR UPDATE 
USING (invited_by = auth.uid());

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid DEFAULT NULL)
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT role FROM public.profiles 
        WHERE user_id = COALESCE(user_id_param, auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create function to check if user can see another user (hierarchy)
CREATE OR REPLACE FUNCTION public.can_see_user(target_user_id uuid)
RETURNS boolean AS $$
DECLARE
    current_user_role text;
    current_user_id uuid;
BEGIN
    current_user_id := auth.uid();
    current_user_role := public.get_user_role(current_user_id);
    
    -- Master can see everyone
    IF current_user_role = 'Master' THEN
        RETURN true;
    END IF;
    
    -- Team Lead can see users they invited
    IF current_user_role = 'Team Lead' THEN
        RETURN EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = target_user_id 
            AND invited_by = current_user_id
        ) OR target_user_id = current_user_id;
    END IF;
    
    -- Staff and Client can only see themselves
    RETURN target_user_id = current_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Update profiles policies to use hierarchy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view profiles based on hierarchy" 
ON public.profiles 
FOR SELECT 
USING (public.can_see_user(user_id));

-- Create index for better performance
CREATE INDEX idx_profiles_invited_by ON public.profiles(invited_by);
CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_team_invitations_invited_by ON public.team_invitations(invited_by);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);

-- Update existing users to Master role (assuming current user is the master)
UPDATE public.profiles SET role = 'Master' WHERE user_id IN (
    SELECT user_id FROM public.profiles LIMIT 1
);