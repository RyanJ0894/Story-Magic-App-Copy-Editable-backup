import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNewProject } from "@/features/projects/hooks/useNewProject";
import { useSimpleProduction } from "@/features/projects/hooks/useSimpleProduction";
import { ProjectForm } from "@/features/projects/components/ProjectForm";
import { ProjectFormData } from "@/features/projects/components/ProjectForm/schema";
import { useAuth } from "@/features/auth/auth";
import { toast } from "sonner";

export default function NewProject() {
  const navigate = useNavigate();
  const { data: currentUser } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);

  const { createProject, isCreating } = useNewProject();
  const production = useSimpleProduction(projectId || "");

  const handleProjectSubmit = async (data: ProjectFormData) => {
    if (!currentUser) {
      toast.error("User must be authenticated to create a project");
      return;
    }

    try {
      const project = await createProject({
        title: data.title,
        script: data.script,
        user_id: currentUser.id,
      });

      setProjectId(project.id);
      await production.processProduction(data.script, project.id);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Project</h1>

      {/* Show processing status */}
      {production.isProcessing && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold text-blue-900 mb-2">Processing...</h2>
          <p className="text-blue-700">{production.step}</p>
          <div className="mt-3 animate-pulse bg-blue-200 h-2 rounded"></div>
        </div>
      )}

      {/* Show success with audio player */}
      {production.audioUrl && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold text-green-900 mb-2">
            ✅ Production Complete!
          </h2>

          <audio
            controls
            className="w-full mt-3 accent-yellow-500 bg-[#1b1b1b] rounded-xl p-1 shadow-sm border border-gray-700"
            style={{ accentColor: "#facc15", backgroundColor: "#1b1b1b" }}
          >
            <source src={production.audioUrl} type="audio/mp4" />
            Your browser does not support the audio element.
          </audio>

          <div className="mt-3 flex gap-3">
            <a
              href={production.audioUrl}
              download
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Download Audio
            </a>
            <button
              onClick={() => navigate("/dashboard")}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Show error if failed */}
      {production.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="font-semibold text-red-900 mb-2">
            ❌ Production Failed
          </h2>
          <p className="text-red-700">{production.error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Project creation form */}
      <ProjectForm
        onSubmit={handleProjectSubmit}
        isSubmitting={isCreating || production.isProcessing}
      />
    </div>
  );
}
