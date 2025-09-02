import { useState } from "react";
import { Lock, Crown, Users, Building, GraduationCap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PLAN_CONFIGS, PLAN_HIERARCHY, type PlanTier } from "@/types/plans";
import { UpgradeModal } from "./UpgradeModal";
import { IndividualTab } from "./tabs/IndividualTab";
import { StarterEnterpriseTab } from "./tabs/StarterEnterpriseTab";
import { ProfessionalEnterpriseTab } from "./tabs/ProfessionalEnterpriseTab";
import { StudioEnterpriseTab } from "./tabs/StudioEnterpriseTab";
import { EnterpriseUnlimitedTab } from "./tabs/EnterpriseUnlimitedTab";
import { UniversityTab } from "./tabs/UniversityTab";

interface DashboardTabsProps {
  currentPlan: PlanTier;
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  deletingId: string | null;
}

const TAB_ICONS = {
  'individual': Users,
  'starter-enterprise': Building,
  'professional-enterprise': Crown,
  'studio-enterprise': Building,
  'enterprise-unlimited': Crown,
  'university-academic': GraduationCap
};

export function DashboardTabs({ currentPlan, projects, onDeleteProject, deletingId }: DashboardTabsProps) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<PlanTier | null>(null);
  const [userCurrentPlan, setUserCurrentPlan] = useState<PlanTier>(currentPlan);

  const currentPlanIndex = PLAN_HIERARCHY.indexOf(userCurrentPlan);
  
  const isTabUnlocked = (planTier: PlanTier): boolean => {
    const planIndex = PLAN_HIERARCHY.indexOf(planTier);
    return planIndex <= currentPlanIndex || planTier === userCurrentPlan;
  };

  const handleUpgradeSuccess = (newPlan: PlanTier) => {
    setUserCurrentPlan(newPlan);
  };

  const handleLockedTabClick = (planTier: PlanTier) => {
    setSelectedUpgradePlan(planTier);
    setUpgradeModalOpen(true);
  };

  const renderTabContent = (planTier: PlanTier) => {
    const tabProps = { projects, onDeleteProject, deletingId };
    
    switch (planTier) {
      case 'individual':
        return <IndividualTab {...tabProps} />;
      case 'starter-enterprise':
        return <StarterEnterpriseTab {...tabProps} />;
      case 'professional-enterprise':
        return <ProfessionalEnterpriseTab {...tabProps} />;
      case 'studio-enterprise':
        return <StudioEnterpriseTab {...tabProps} />;
      case 'enterprise-unlimited':
        return <EnterpriseUnlimitedTab {...tabProps} />;
      case 'university-academic':
        return <UniversityTab {...tabProps} />;
      default:
        return <div>Plan not found</div>;
    }
  };

  return (
    <>
      <Tabs defaultValue={userCurrentPlan} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full h-auto p-1 bg-muted">
          {PLAN_HIERARCHY.map((planTier) => {
            const config = PLAN_CONFIGS[planTier];
            const Icon = TAB_ICONS[planTier];
            const isUnlocked = isTabUnlocked(planTier);
            const isCurrent = planTier === userCurrentPlan;
            
            return (
              <TabsTrigger
                key={planTier}
                value={planTier}
                disabled={!isUnlocked}
                onClick={!isUnlocked ? () => handleLockedTabClick(planTier) : undefined}
                className={`
                  relative flex flex-col items-center gap-1 p-3 text-xs font-medium transition-all
                  ${isUnlocked 
                    ? 'text-foreground hover:bg-background hover:text-foreground' 
                    : 'text-muted-foreground opacity-50 cursor-pointer hover:opacity-75'
                  }
                  ${isCurrent ? 'bg-background text-foreground ring-2 ring-primary' : ''}
                `}
              >
                <div className="flex items-center gap-1">
                  <Icon className="h-3 w-3" />
                  {!isUnlocked && <Lock className="h-3 w-3" />}
                </div>
                <span className="text-center leading-tight">{config.name}</span>
                {isCurrent && (
                  <Badge variant="default" className="absolute -top-1 -right-1 text-xs px-1 py-0">
                    Current
                  </Badge>
                )}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-md flex items-center justify-center">
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {PLAN_HIERARCHY.map((planTier) => {
          const isUnlocked = isTabUnlocked(planTier);
          
          return (
            <TabsContent key={planTier} value={planTier} className="mt-6">
              {isUnlocked ? (
                renderTabContent(planTier)
              ) : (
                <div className="text-center py-12 space-y-4">
                  <Lock className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Upgrade Required</h3>
                  <p className="text-muted-foreground">
                    Upgrade to {PLAN_CONFIGS[planTier].name} to access these features.
                  </p>
                  <Button onClick={() => handleLockedTabClick(planTier)}>
                    View Upgrade Options
                  </Button>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        currentPlan={userCurrentPlan}
        targetPlan={selectedUpgradePlan}
        onUpgradeSuccess={handleUpgradeSuccess}
      />
    </>
  );
}