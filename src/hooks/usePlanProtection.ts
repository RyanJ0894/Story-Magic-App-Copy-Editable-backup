import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { type PlanTier } from '@/types/plans';

interface UserProfile {
  plan_type: PlanTier;
  account_status: string;
}

export function usePlanProtection() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const checkPlanStatus = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          navigate('/auth');
          return;
        }

        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('plan_type, account_status')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          // If no profile exists, it will be created automatically by the trigger
          // Just redirect to pricing for new users
          if (mounted) {
            navigate('/pricing?newuser=true');
          }
          return;
        }

        if (mounted) {
          setProfile(profileData as UserProfile);
        }
      } catch (error) {
        console.error('Plan protection error:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    checkPlanStatus();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const selectPlan = async (planType: PlanTier, accountStatus: string = 'active') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          plan_type: planType,
          account_status: accountStatus
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setProfile({
        plan_type: planType,
        account_status: accountStatus
      });

      return true;
    } catch (error) {
      console.error('Plan selection error:', error);
      return false;
    }
  };

  return {
    profile,
    loading,
    selectPlan,
    currentPlan: profile?.plan_type || 'individual',
    isTrialActive: profile?.account_status === 'trial',
    isPending: profile?.account_status?.includes('pending') || false
  };
}