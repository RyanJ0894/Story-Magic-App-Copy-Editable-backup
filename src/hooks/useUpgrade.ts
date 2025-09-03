import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type PlanTier } from '@/types/plans';
import { useToast } from '@/hooks/use-toast';

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

      // Use upsert to handle both insert and update scenarios
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
        description: `You've been upgraded to ${newPlan}. You now have access to all features.`,
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