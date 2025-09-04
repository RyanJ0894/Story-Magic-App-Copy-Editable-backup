import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { type PlanTier, PLAN_HIERARCHY } from '@/types/plans';

interface UserProfile {
  plan_type: PlanTier;
  account_status: string;
}

// Helper function to get plan hierarchy level (higher number = better plan)
const getPlanLevel = (plan: PlanTier): number => {
  return PLAN_HIERARCHY.indexOf(plan);
};

// Helper function to check if plan A is better than plan B
const isPlanBetter = (planA: PlanTier, planB: PlanTier): boolean => {
  return getPlanLevel(planA) > getPlanLevel(planB);
};

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

      // Get current profile to check existing plan
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('plan_type, account_status')
        .eq('user_id', user.id)
        .single();

      // Allow plan selection only if:
      // 1. No existing profile (first time)
      // 2. Current plan is 'individual' (initial state)
      // 3. New plan is better than current plan (upgrade only)
      if (currentProfile) {
        const current = currentProfile.plan_type as PlanTier;
        const currentStatus = currentProfile.account_status;
        
        // If user has an active non-individual plan, only allow upgrades
        if (current !== 'individual' && currentStatus === 'active') {
          if (current === planType) {
            console.log('User already has this plan');
            return true; // Already have the plan
          }
          
          if (!isPlanBetter(planType, current)) {
            console.log('Cannot downgrade from', current, 'to', planType);
            return false; // Prevent downgrades
          }
        }
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