-- Fix search_path security issues in functions
CREATE OR REPLACE FUNCTION public.get_user_role(user_id_param uuid DEFAULT NULL)
RETURNS text AS $$
BEGIN
    RETURN (
        SELECT role FROM public.profiles 
        WHERE user_id = COALESCE(user_id_param, auth.uid())
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

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
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;