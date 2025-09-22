import { useState } from "react";
import { useCreateProject } from "../projects";
import { CreateProjectData } from "../project.type";

export const useNewProject = () => {
  const [projectId, setProjectId] = useState<string>("");
  
  const createProjectMutation = useCreateProject();

  const createProject = async (data: CreateProjectData) => {
    try {
      const project = await createProjectMutation.mutateAsync(data);
      setProjectId(project.id);
      return project;
    } catch (error) {
      console.error("Project creation failed:", error);
      throw error;
    }
  };

  return {
    projectId,
    createProject,
    isCreating: createProjectMutation.isPending,
    error: createProjectMutation.error,
  };
};
