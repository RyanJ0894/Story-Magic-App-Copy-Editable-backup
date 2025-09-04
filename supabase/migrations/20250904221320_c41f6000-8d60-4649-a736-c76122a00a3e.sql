-- Add package persistence fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS package_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS upgrade_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS available_packages JSONB DEFAULT '["individual"]'::jsonb;

-- Create function to update available packages based on plan hierarchy
CREATE OR REPLACE FUNCTION public.update_available_packages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    plan_hierarchy TEXT[] := ARRAY['individual', 'starter-enterprise', 'professional-enterprise', 'studio-enterprise', 'enterprise-unlimited', 'university-academic'];
    current_plan_index INTEGER;
    available_plans JSONB := '[]'::jsonb;
    plan TEXT;
BEGIN
    -- Find current plan index in hierarchy
    current_plan_index := array_position(plan_hierarchy, NEW.plan_type);
    
    -- If plan not found in hierarchy, default to individual
    IF current_plan_index IS NULL THEN
        current_plan_index := 1;
    END IF;
    
    -- Add all plans up to and including current plan to available packages
    FOR i IN 1..current_plan_index LOOP
        plan := plan_hierarchy[i];
        -- Skip university-academic unless it's the current plan
        IF plan != 'university-academic' OR NEW.plan_type = 'university-academic' THEN
            available_plans := available_plans || to_jsonb(plan);
        END IF;
    END LOOP;
    
    -- Update available packages
    NEW.available_packages := available_plans;
    
    -- Add to package history if plan changed
    IF OLD.plan_type IS NULL OR OLD.plan_type != NEW.plan_type THEN
        NEW.package_history := COALESCE(OLD.package_history, '[]'::jsonb) || 
            to_jsonb(jsonb_build_object(
                'plan', NEW.plan_type,
                'date', now(),
                'previous_plan', OLD.plan_type
            ));
        NEW.upgrade_date := now();
    END IF;
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically update available packages
DROP TRIGGER IF EXISTS update_available_packages_trigger ON public.profiles;
CREATE TRIGGER update_available_packages_trigger
    BEFORE INSERT OR UPDATE OF plan_type ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_available_packages();

-- Update existing profiles with correct available packages
UPDATE public.profiles 
SET plan_type = plan_type; -- This will trigger the function