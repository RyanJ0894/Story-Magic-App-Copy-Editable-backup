import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useSimpleProduction } from "@/features/projects/hooks/useSimpleProduction";

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("Untitled Project");
  const [script, setScript] = useState("");
  const [runAiDirector, setRunAiDirector] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // We'll set projectId after creating the project
  const [projectId, setProjectId] = useState<string>("");
  const { isProcessing, step, processProduction } = useSimpleProduction(projectId);

  const handleCreateProject = async () => {
    if (!script.trim()) {
      toast({
        title: "Error",
        description: "Please enter a script",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Create project in database first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Not authenticated");
      }

      // Generate project ID
      const newProjectId = `proj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Insert project into database
      const { error: insertError } = await supabase
        .from('projects')
        .insert({
          id: newProjectId,
          title: title,
          script_text: script,
          user_id: user.id,
          status: 'draft'
        });

      if (insertError) {
        throw insertError;
      }

      // Set the projectId for the hook
      setProjectId(newProjectId);

      // Step 2: If "Run AI Director" is checked, trigger production
      if (runAiDirector) {
        await processProduction(script);
      }

      toast({
        title: "Success",
        description: "Project created successfully",
      });

      // Navigate to project page
      navigate(`/projects/${newProjectId}`);
      
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Project</h1>

      {(isProcessing || isCreating) && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2">Processing...</h3>
          <p className="text-sm text-gray-600">{step || "Creating project..."}</p>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
          />
        </div>

        <div>
          <Label htmlFor="script">Script</Label>
          <Textarea
            id="script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Paste your screenplay here..."
            rows={15}
            className="font-mono"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="runAiDirector"
            checked={runAiDirector}
            onCheckedChange={(checked) => setRunAiDirector(checked as boolean)}
          />
          <Label htmlFor="runAiDirector" className="cursor-pointer">
            Run AI Director (analyze script)
          </Label>
        </div>

        <Button
          onClick={handleCreateProject}
          disabled={isCreating || isProcessing}
          className="w-full"
        >
          {isCreating || isProcessing ? "Creating..." : "Create Project"}
        </Button>
      </div>
    </div>
  );
}
