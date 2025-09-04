import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

  const upgradeUserPlan = async (newPlan: PlanTier): Promise<boolean> => {
    setIsUpgrading(true);
    
    try {
      // Get current session to ensure we have valid auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      // Check current plan to ensure we only allow upgrades
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('plan_type, account_status')
        .eq('user_id', session.user.id)
        .single();

      if (currentProfile?.plan_type && currentProfile?.account_status === 'active') {
        // If user already has the same plan, don't allow "re-upgrade"
        if (currentProfile.plan_type === newPlan) {
          toast({
            title: "Already Active",
            description: `You already have the ${newPlan} plan active. No action needed!`,
            variant: "default",
          });
          return true;
        }
        
        // Prevent downgrades - only allow upgrades to better plans
        if (!isPlanBetter(newPlan, currentProfile.plan_type as PlanTier)) {
          toast({
            title: "Invalid Upgrade",
            description: `You already have ${currentProfile.plan_type}. You can only upgrade to higher tier plans.`,
            variant: "destructive",
          });
          return false;
        }
      }

      // Proceed with upgrade to higher tier
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
        console.error('Upgrade error:', error);
        throw error;
      }

      toast({
        title: "Upgrade Successful!",
        description: `Congratulations! You've been upgraded to ${newPlan}. This upgrade is permanent.`,
      });

      return true;
    } catch (error: any) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: error.message || "There was an error upgrading your plan. Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsUpgrading(false);
    }
  };

  return {
    upgradeUserPlan,
    isUpgrading
  };
}