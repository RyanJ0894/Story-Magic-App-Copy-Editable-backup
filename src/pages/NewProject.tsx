import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useSimpleProduction } from "@/features/projects/hooks/useSimpleProduction";
import { Upload } from "lucide-react";

export default function CreateProject() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("Untitled Project");
  const [script, setScript] = useState("");
  const [scriptMode, setScriptMode] = useState<"replace" | "append">("replace");
  const [runAiDirector, setRunAiDirector] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [projectId, setProjectId] = useState<string>("");
  const { isProcessing, step, processProduction } = useSimpleProduction(projectId);

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || file.type !== "application/pdf") {
      toast({
        title: "Error",
        description: "Please upload a PDF file",
        variant: "destructive",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", file);

      // TODO: Implement PDF text extraction
      // For now, show a message
      toast({
        title: "PDF Upload",
        description: "PDF processing will be implemented soon",
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({
        title: "Error",
        description: "Failed to process PDF",
        variant: "destructive",
      });
    }
  };

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

      setProjectId(newProjectId);

      if (runAiDirector) {
        await processProduction(script);
      }

      toast({
        title: "Success",
        description: "Project created successfully",
      });

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
          <Label>Upload PDF</Label>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => document.getElementById("pdf-upload")?.click()}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload PDF
            </Button>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
          </div>
          
          <RadioGroup
            value={scriptMode}
            onValueChange={(value) => setScriptMode(value as "replace" | "append")}
            className="flex gap-4 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="replace" id="replace" />
              <Label htmlFor="replace">Replace text</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="append" id="append" />
              <Label htmlFor="append">Append text</Label>
            </div>
          </RadioGroup>
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
