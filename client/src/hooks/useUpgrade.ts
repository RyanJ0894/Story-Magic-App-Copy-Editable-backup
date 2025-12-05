import { useState } from 'react';
import { supabase } from '../../../supabase/client';
import { type PlanTier, PLAN_HIERARCHY } from '@/types/plans';
import { useToast } from '@/hooks/use-toast';

// Helper function to get plan hierarchy level (higher number = better plan)
const getPlanLevel = (plan: PlanTier): number => {
  return PLAN_HIERARCHY.indexOf(plan);
};

// Helper function to check if plan A is better than plan B
const isPlanBetter = (planA: PlanTier, planB: PlanTier): boolean => {
  return getPlanLevel(planA) > getPlanLevel(planB);
};

export function useUpgrade() {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast();

  const switchUserPlan = async (newPlan: PlanTier): Promise<boolean> => {
    setIsUpgrading(true);
    
    try {
      // Get current session to ensure we have valid auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      // Check current plan
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('plan_type, account_status')
        .eq('user_id', session.user.id)
        .single();

      if (currentProfile?.plan_type && currentProfile?.account_status === 'active') {
        // If user already has the same plan, don't allow switching to same plan
        if (currentProfile.plan_type === newPlan) {
          toast({
            title: "Already Active",
            description: `You already have the ${newPlan} plan active. No action needed!`,
            variant: "default",
          });
          return true;
        }
      }

      // Allow switching to any plan (upgrade or downgrade)
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
          user_id: session.user.id,
          plan_type: newPlan,
          account_status: 'active',
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Plan switch error:', error);
        throw error;
      }

      const isUpgrade = currentProfile?.plan_type ? isPlanBetter(newPlan, currentProfile.plan_type as PlanTier) : true;
      
      toast({
        title: "Plan Changed Successfully!",
        description: `You've successfully ${isUpgrade ? 'upgraded to' : 'switched to'} ${newPlan}.`,
      });

      return true;
    } catch (error: any) {
      console.error('Plan switch error:', error);
      toast({
        title: "Plan Change Failed",
        description: error.message || "There was an error changing your plan. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpgrading(false);
    }
  };

  // Keep the old method name for backward compatibility
  const upgradeUserPlan = switchUserPlan;

  return {
    upgradeUserPlan,
    switchUserPlan,
    isUpgrading
  };
}