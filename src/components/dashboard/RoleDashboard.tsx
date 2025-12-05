import { useState } from "react";
import { Users, BarChart3, FolderOpen, Settings } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ROLE_PERMISSIONS, type UserRole, type DashboardTab } from "@/types/roles";
import { IndividualTab } from "./tabs/IndividualTab";
import { TeamManagementTab } from "./tabs/TeamManagementTab";
import { ProjectsTab } from "./tabs/ProjectsTab";
import { AnalyticsTab } from "./tabs/AnalyticsTab";
import { OverviewTab } from "./tabs/OverviewTab";

interface RoleDashboardProps {
  userRole: UserRole;
  projects: any[];
  onDeleteProject: (id: string, title: string) => void;
  deletingId: string | null;
}

const TAB_ICONS = {
  'individual': Users,
  'overview': BarChart3,
  'team': Users,
  'projects': FolderOpen,
  'analytics': BarChart3
};

const TAB_LABELS = {
  'individual': 'Individual',
  'overview': 'Overview', 
  'team': 'Team',
  'projects': 'Projects',
  'analytics': 'Analytics'
};

export function RoleDashboard({ userRole, projects, onDeleteProject, deletingId }: RoleDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>('individual');
  
  const permissions = ROLE_PERMISSIONS[userRole];
  const availableTabs = permissions.availableTabs;

  // Ensure active tab is available for user role
  if (!availableTabs.includes(activeTab)) {
    setActiveTab(availableTabs[0]);
  }

  const renderTabContent = (tab: DashboardTab) => {
    const tabProps = { 
      projects, 
      onDeleteProject, 
      deletingId,
      userRole,
      permissions
    };
    
    switch (tab) {
      case 'individual':
        return <IndividualTab {...tabProps} />;
      case 'overview':
        return <OverviewTab {...tabProps} />;
      case 'team':
        return <TeamManagementTab {...tabProps} />;
      case 'projects':
        return <ProjectsTab {...tabProps} />;
      case 'analytics':
        return <AnalyticsTab {...tabProps} />;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-semibold">{userRole} Dashboard</h1>
            <Badge 
              variant="outline" 
              className="text-xs font-medium"
            >
              {userRole}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {userRole === 'Master' && 'Full organizational access and management'}
            {userRole === 'Team Lead' && 'Manage your team and projects'}  
            {userRole === 'Staff' && 'Individual access to your projects'}
            {userRole === 'Client' && 'Client access to assigned projects'}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DashboardTab)} className="w-full">
        <TabsList className="grid w-full h-auto p-1 bg-muted" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
          {availableTabs.map((tab) => {
            const Icon = TAB_ICONS[tab];
            
            return (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex flex-col items-center gap-1 p-3 text-xs font-medium transition-all"
              >
                <Icon className="h-4 w-4" />
                <span className="text-center leading-tight">{TAB_LABELS[tab]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {availableTabs.map((tab) => (
          <TabsContent key={tab} value={tab} className="mt-6">
            {renderTabContent(tab)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}