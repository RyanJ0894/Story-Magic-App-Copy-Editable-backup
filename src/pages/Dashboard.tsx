import { Link } from "react-router-dom";
import { usePlanProtection } from "@/hooks/usePlanProtection";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useDashboard } from "@/features/projects/hooks/useDashboard";
import { RoleDebugPanel } from "@/components/dashboard/RoleDebugPanel";
import { useUserRole } from "@/hooks/useUserRole";

export default function Dashboard() {
  const {
    currentPlan,
    availablePackages,
    profile,
    loading: planLoading
  } = usePlanProtection();
  
  const { currentRole, loading: roleLoading } = useUserRole();
  
  console.log("🎯 Dashboard: Current role from useUserRole:", currentRole);
  console.log("🎯 Dashboard: Profile role from usePlanProtection:", (profile as any)?.role);

  const {
    projects,
    isLoading,
    error,
    isDeleting,
    isBulkDeleting,
    handleDeleteProject,
    handleBulkDeleteProjects,
  } = useDashboard();

  const handleRoleChange = () => {
    // Force a reload of the page to update all components
    window.location.reload();
  };

  if (isLoading || planLoading || roleLoading) return <DashboardSkeleton />;
  if (error) return <div className="min-h-screen flex items-center justify-center text-destructive">{error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Role Debug Panel */}
      {currentRole && (
        <div className="mb-6">
          <RoleDebugPanel 
            profile={{ ...(profile as any), role: currentRole }} 
            onRoleChange={handleRoleChange} 
          />
        </div>
      )}

      {/* Status Banners */}
      {profile?.account_status === 'trial' && (
        <div className="mb-6 p-4 bg-cinema-gold/10 border border-cinema-gold/20 rounded-lg">
          <p className="text-center text-foreground">
            <strong>Free Trial Active!</strong>
            <Link to="/pricing" className="ml-2 text-cinema-gold hover:underline">
              Upgrade anytime →
            </Link>
          </p>
        </div>
      )}

      {profile?.account_status === 'pending_enterprise_setup' && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-center text-foreground">
            <strong>Enterprise setup in progress</strong> - we'll contact you within 24 hours to finalize your account.
          </p>
        </div>
      )}

      {profile?.account_status === 'pending_academic_verification' && (
        <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-center text-foreground">
            <strong>Academic verification in progress</strong> - we'll review your status within 48 hours.
          </p>
        </div>
      )}

      <DashboardTabs
        currentPlan={currentPlan}
        availablePackages={availablePackages}
        projects={projects}
        onDeleteProject={handleDeleteProject}
        onBulkDeleteProjects={handleBulkDeleteProjects}
        deletingId={null}
        isBulkDeleting={isBulkDeleting}
      />
    </div>
  );
}
