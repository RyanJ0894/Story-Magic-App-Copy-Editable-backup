import { useProjects, useDeleteProject, useBulkDeleteProjects } from "../projects";
import { useToast } from "@/components/ui/use-toast";

export const useDashboard = () => {
  const { toast } = useToast();
  
  const { data: projects, isLoading, error } = useProjects();
  const deleteProjectMutation = useDeleteProject();
  const bulkDeleteMutation = useBulkDeleteProjects();

  const handleDeleteProject = async (projectId: string, projectTitle: string) => {
    try {
      const deletedProject = await deleteProjectMutation.mutateAsync(projectId);
      
      if (deletedProject) {
      toast({
        title: "Project deleted",
          description: `"${projectTitle}" has been successfully deleted.`,
        });
      }
      return deletedProject;
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBulkDeleteProjects = async (projectIds: string[]): Promise<number> => {
    try {
      const count = await bulkDeleteMutation.mutateAsync(projectIds);
      toast({
        title: "Projects deleted",
        description: `Successfully deleted ${count} project${count !== 1 ? 's' : ''}.`,
      });
      return count;
    } catch (error: any) {
      console.error("Bulk delete error:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete some projects. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    projects: projects || [],
    isLoading,
    error,
    isDeleting: deleteProjectMutation.isPending,
    isBulkDeleting: bulkDeleteMutation.isPending,
    handleDeleteProject,
    handleBulkDeleteProjects,
  };
};
