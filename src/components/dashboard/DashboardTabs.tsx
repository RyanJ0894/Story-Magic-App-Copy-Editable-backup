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
  availablePackages: PlanTier[];
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  onBulkDeleteProjects?: (ids: string[]) => Promise<number>;
  deletingId: string | null;
  isBulkDeleting?: boolean;
}

const TAB_ICONS = {
  'individual': Users,
  'starter-enterprise': Building,
  'professional-enterprise': Crown,
  'studio-enterprise': Building,
  'enterprise-unlimited': Crown,
  'university-academic': GraduationCap
};

export function DashboardTabs({ currentPlan, availablePackages, projects, onDeleteProject, onBulkDeleteProjects, deletingId, isBulkDeleting = false }: DashboardTabsProps) {
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState<PlanTier | null>(null);
  const [userCurrentPlan, setUserCurrentPlan] = useState<PlanTier>(currentPlan);

  console.log('DashboardTabs - currentPlan:', currentPlan);
  console.log('DashboardTabs - availablePackages:', availablePackages);
  
  const isTabUnlocked = (planTier: PlanTier): boolean => {
    return availablePackages.includes(planTier);
  };

  const handleUpgradeSuccess = (newPlan: PlanTier) => {
    setUserCurrentPlan(newPlan);
    // Force page reload to refresh available packages from database
    window.location.reload();
  };

  const handleTabClick = (planTier: PlanTier) => {
    // Allow clicking any tab - will show upgrade/switch modal
    if (planTier !== userCurrentPlan) {
      setSelectedUpgradePlan(planTier);
      setUpgradeModalOpen(true);
    }
  };

  const renderTabContent = (planTier: PlanTier) => {
    const tabProps = { projects, onDeleteProject, onBulkDeleteProjects, deletingId, isBulkDeleting };
    
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
      <Tabs value={userCurrentPlan} className="w-full">
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
                disabled={false}
                onClick={() => handleTabClick(planTier)}
                className={`
                  relative flex flex-col items-center gap-1 p-3 text-xs font-medium transition-all cursor-pointer
                  ${isUnlocked 
                    ? 'text-foreground hover:bg-background hover:text-foreground' 
                    : 'text-muted-foreground opacity-75 hover:opacity-90 hover:bg-muted/50'
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
                  <h3 className="text-lg font-semibold">Plan Access Required</h3>
                  <p className="text-muted-foreground">
                    Switch to {PLAN_CONFIGS[planTier].name} to access these features.
                  </p>
                  <Button onClick={() => handleTabClick(planTier)}>
                    View Plan Options
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