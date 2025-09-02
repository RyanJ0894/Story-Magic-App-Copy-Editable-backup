import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  plan_selected: boolean;
  plan_type: string | null;
  account_status: string;
  trial_end_date: string | null;
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
          .select('plan_selected, plan_type, account_status, trial_end_date')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Profile fetch error:', error);
          // If no profile exists, create one and redirect to pricing
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({ user_id: user.id });
          
          if (!insertError && mounted) {
            navigate('/pricing?newuser=true');
          }
          return;
        }

        if (mounted) {
          setProfile(profileData);
          
          // Check if user has selected a plan
          if (!profileData.plan_selected) {
            navigate('/pricing?newuser=true');
            return;
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

  const selectPlan = async (planType: string, accountStatus: string = 'active', trialEndDate?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const updateData: any = {
        plan_selected: true,
        plan_type: planType,
        account_status: accountStatus,
        selection_date: new Date().toISOString()
      };

      if (trialEndDate) {
        updateData.trial_end_date = trialEndDate;
      }

      // Try to update first, if no rows affected then insert
      const { data: updateResult, error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('user_id', user.id)
        .select();

      if (updateError) throw updateError;

      // If no rows were updated, insert a new profile
      if (!updateResult || updateResult.length === 0) {
        const insertData = {
          user_id: user.id,
          ...updateData
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert(insertData);

        if (insertError) throw insertError;
      }

      // Update local state
      setProfile({
        plan_selected: true,
        plan_type: planType,
        account_status: accountStatus,
        trial_end_date: trialEndDate || null
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
    isTrialActive: profile?.account_status === 'trial' && profile?.trial_end_date ? new Date(profile.trial_end_date) > new Date() : false,
    isPending: profile?.account_status?.includes('pending') || false
  };
}