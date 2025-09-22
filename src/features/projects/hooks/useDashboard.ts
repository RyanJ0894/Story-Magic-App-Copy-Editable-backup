import { useProjects, useDeleteProject } from "../projects";
import { useToast } from "@/components/ui/use-toast";

export const useDashboard = () => {
  const { toast } = useToast();
  
  const { data: projects, isLoading, error } = useProjects();
  const deleteProjectMutation = useDeleteProject();

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

  return {
    projects: projects || [],
    isLoading,
    error,
    isDeleting: deleteProjectMutation.isPending,
    handleDeleteProject,
  };
};
