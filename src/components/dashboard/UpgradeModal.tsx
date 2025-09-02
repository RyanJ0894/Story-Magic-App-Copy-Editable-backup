import { useState } from "react";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_CONFIGS, type PlanTier } from "@/types/plans";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: PlanTier;
  targetPlan: PlanTier | null;
  onUpgradeSuccess: (newPlan: PlanTier) => void;
}

export function UpgradeModal({ isOpen, onClose, currentPlan, targetPlan, onUpgradeSuccess }: UpgradeModalProps) {
  const [isUpgrading, setIsUpgrading] = useState(false);
  const { toast } = useToast();
  
  if (!targetPlan) return null;

  const currentConfig = PLAN_CONFIGS[currentPlan];
  const targetConfig = PLAN_CONFIGS[targetPlan];

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ 
          plan_type: targetPlan,
          account_status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Upgrade Successful!",
        description: `You've been upgraded to ${targetConfig.name}. You now have access to all ${targetConfig.name} features.`,
      });

      onUpgradeSuccess(targetPlan);
      onClose();
    } catch (error) {
      console.error('Upgrade error:', error);
      toast({
        title: "Upgrade Failed",
        description: "There was an error upgrading your plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Upgrade to {targetConfig.name}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Plan */}
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">{currentConfig.name}</h3>
                <Badge variant="outline">Current</Badge>
              </div>
              <div className="text-2xl font-bold mb-2">
                {currentConfig.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /{currentConfig.period}
                </span>
              </div>
              <ul className="space-y-1 text-sm">
                {currentConfig.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="text-muted-foreground">• {feature}</li>
                ))}
              </ul>
            </div>

            {/* Target Plan */}
            <div className="border-2 border-primary rounded-lg p-4 bg-primary/5">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold">{targetConfig.name}</h3>
                <Badge variant="default">Upgrade</Badge>
              </div>
              <div className="text-2xl font-bold mb-2 text-primary">
                {targetConfig.price}
                <span className="text-sm font-normal text-muted-foreground">
                  /{targetConfig.period}
                </span>
              </div>
              <ul className="space-y-1 text-sm">
                {targetConfig.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="text-foreground">• {feature}</li>
                ))}
                <li className="text-muted-foreground text-xs">
                  +{targetConfig.features.length - 4} more features
                </li>
              </ul>
            </div>
          </div>

          {/* What You'll Gain */}
          <div>
            <h4 className="font-semibold mb-3">What you'll gain with {targetConfig.name}:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {targetConfig.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1" 
              size="lg"
              onClick={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? "Upgrading..." : "Upgrade Now"}
            </Button>
            <Button variant="outline" size="lg" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {/* Additional Info */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Questions about upgrading? Contact our sales team for a personalized demo.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}