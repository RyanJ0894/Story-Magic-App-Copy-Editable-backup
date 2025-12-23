import { useMemo } from "react";
import { Link } from "react-router-dom";
import { usePlanProtection } from "@/hooks/usePlanProtection";
import { DashboardTabs } from "@/components/dashboard/DashboardTabs";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { useDashboard } from "@/features/projects/hooks/useDashboard";
import { RoleDebugPanel } from "@/components/dashboard/RoleDebugPanel";
import { useUserRole } from "@/hooks/useUserRole";

export default function Dashboard() {
  // Memoized shimmer particles for magical background
  const shimmerParticles = useMemo(() => {
    return Array.from({ length: 35 }, (_, i) => ({
      id: i,
      x: (i * 17 + 7) % 100,
      y: (i * 23 + 11) % 100,
      delay: (i * 0.3) % 3,
      duration: 1.5 + (i % 5) * 0.5,
      opacity: 0.3 + (i % 7) * 0.1,
    }));
  }, []);
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
    <div className="min-h-screen bg-background relative">
      {/* Magical Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        {/* Illuminated gradient spots - gold on left, blue on right */}
        <div className="absolute -top-20 -left-[100px] sm:left-[10%] w-[350px] sm:w-[600px] h-[350px] sm:h-[600px] bg-amber-500/60 sm:bg-amber-500/50 rounded-full blur-[100px] sm:blur-[120px]" />
        <div className="absolute top-1/3 -right-[50px] sm:right-[5%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-blue-500/55 sm:bg-blue-500/45 rounded-full blur-[80px] sm:blur-[100px]" />
        <div className="absolute bottom-1/4 -left-[80px] sm:left-[20%] w-[280px] sm:w-[450px] h-[280px] sm:h-[450px] bg-blue-400/50 sm:bg-blue-400/40 rounded-full blur-[90px] sm:blur-[110px]" />
        
        {/* Shimmer particles - fixed positions with glow */}
        {shimmerParticles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1.5 h-1.5 bg-white rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              opacity: particle.opacity + 0.2,
              boxShadow: '0 0 6px 2px rgba(255, 255, 255, 0.6)',
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Role Debug Panel - only visible in development */}
        {import.meta.env.DEV && currentRole && (
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
    </div>
  );
}
