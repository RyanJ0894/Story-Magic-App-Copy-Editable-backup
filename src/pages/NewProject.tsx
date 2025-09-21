import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNewProject } from "@/features/projects/hooks/useNewProject";
import { useChunkProduction } from "@/features/projects/hooks/useChunkProduction";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { ProjectFormData } from "@/features/projects/components/ProjectForm/schema";
import { useAuth } from "@/features/auth/auth";
import { toast } from "sonner";

export default function NewProject() {
  const navigate = useNavigate();
  const { data: currentUser } = useAuth();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<string>("");
  const [projectId, setProjectId] = useState<string | null>(null);
  
  const { createProject, isCreating, error: createError } = useNewProject();
  const { createChunks, processChunks } = useChunkProduction(projectId || "");

  const handleProjectSubmit = async (data: ProjectFormData) => {
    setIsProcessing(true);
    
    try {
      // Step 1: Create project
      setProcessingStep("Creating project...");
      const project = await createProject({
        title: data.title,
        script: data.script,
        user_id: currentUser?.id,
      });
      
      // Set projectId for hook
      setProjectId(project.id);
      
      toast.success("Project created successfully!", {
        description: "Creating chunks...",
      });

      // Step 2: Create chunks immediately
      try {
        // Create chunks
        setProcessingStep("Creating chunks...");
        await createChunks({ projectId: project.id, script: data.script });
        
        toast.success("Chunks created!", {
          description: "Processing chunks...",
        });

        // // Process chunks
        setProcessingStep("Processing chunks...");
        await processChunks(project.id);
        
        toast.success("All chunks processed!", {
          description: "Redirecting to project page...",
        });
        
      } catch (chunkError) {
        console.error("Chunk creation/processing error:", chunkError);
        toast.error("Error processing chunks, but project was created", {
          description: "You can still view the project",
        });
      }
      
      // Step 3: Redirect after chunks are done
      setProcessingStep("Redirecting...");
      setTimeout(() => {
        navigate(`/projects/${project.id}`);
      }, 1000);
      
    } catch (error) {
      toast.error("Failed to create project:", error);
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

      {/* Project Creation Form */}
      <ProjectForm
        onSubmit={handleProjectSubmit}
        isSubmitting={isCreating || isProcessing}
      />

      {/* Processing Status */}
      {isProcessing && processingStep && (
        <div className="mt-6 p-4 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <p className="text-blue-800 font-medium">{processingStep}</p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {createError && (
        <div className="mt-6 p-4 border border-red-200 rounded-lg mb-6">
          <p className="text-red-800">Error: {createError.message}</p>
        </div>
      )}
    </div>
  );
}
