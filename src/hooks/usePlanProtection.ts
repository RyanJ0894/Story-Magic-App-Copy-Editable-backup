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
          // If profile doesn't exist, create it with default values
          if (error.code === 'PGRST116') {
            try {
              const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                  user_id: user.id,
                  plan_type: 'individual',
                  account_status: 'active'
                });
              
              if (!insertError && mounted) {
                // Profile created successfully, set default values
                setProfile({
                  plan_type: 'individual',
                  account_status: 'active'
                });
              }
            } catch (insertErr) {
              console.error('Failed to create profile:', insertErr);
            }
          } else {
            // For other errors, set a default profile to prevent infinite loading
            if (mounted) {
              setProfile({
                plan_type: 'individual',
                account_status: 'active'
              });
            }
          }
        } else {
          // No error, set the profile data
          if (mounted) {
            setProfile(profileData as UserProfile);
          }
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

      // Only allow plan selection if user hasn't selected a plan yet or is upgrading
      const currentProfile = await supabase
        .from('profiles')
        .select('plan_type, account_status')
        .eq('user_id', user.id)
        .single();

      // Prevent downgrading or repeated selection of the same plan
      if (currentProfile.data && 
          currentProfile.data.plan_type !== 'individual' && 
          currentProfile.data.account_status === 'active') {
        console.log('User already has an active plan, preventing change');
        return false;
      }

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