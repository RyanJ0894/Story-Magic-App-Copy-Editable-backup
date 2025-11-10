import { Link } from "react-router-dom";
import { usePlanProtection } from "@/hooks/usePlanProtection";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useDashboard } from "@/features/projects/hooks/useDashboard";
import { RoleDebugPanel } from "@/components/dashboard/RoleDebugPanel";

export default function Dashboard() {
  const {
    currentPlan,
    availablePackages,
    profile,
    loading: planLoading
  } = usePlanProtection();

  const {
    projects,
    isLoading,
    error,
    isDeleting,
    handleDeleteProject,
  } = useDashboard();

  if (isLoading || planLoading) return <DashboardSkeleton />;
  if (error) return <div className="min-h-screen flex items-center justify-center text-destructive">{error.message}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Role Debug Panel */}
      <div className="mb-6">
        <RoleDebugPanel />
      </div>

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
        deletingId={null}
      />
    </div>
  );
}
