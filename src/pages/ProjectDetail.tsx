import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Play, Loader2, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { runAudio } from "@/integrations/filmDirectorApi";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type ProjectData = {
  id: string;
  title: string | null;
  created_at: string;
  ai_director_json: string | null;
  audio_url: string | null;
  user_id: string;
};

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [directorExpanded, setDirectorExpanded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!id) return;
    
    const loadProject = async () => {
      try {
        const { data, error } = await supabase
          .from("user_projects")
          .select("id,title,created_at,ai_director_json,audio_url,user_id")
          .eq("id", id)
          .single();

        if (error) throw error;
        setProject(data);
      } catch (err: any) {
        console.error("Error loading project:", err);
        setError(err.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };

    loadProject();
  }, [id]);

  const handleGenerateAudio = async () => {
    if (!project || !project.ai_director_json) {
      toast({
        title: "Cannot generate audio",
        description: "Project needs AI Director analysis first",
        variant: "destructive",
      });
      return;
    }

    setGeneratingAudio(true);
    try {
      // Safely parse the director JSON
      let directorJson;
      try {
        if (typeof project.ai_director_json === 'string') {
          directorJson = JSON.parse(project.ai_director_json);
        } else {
          directorJson = project.ai_director_json;
        }
      } catch (parseError) {
        throw new Error("Invalid director JSON data");
      }

      await runAudio(project.id, directorJson);
      
      // Refresh project data to get the new audio_url
      const { data: updatedProject } = await supabase
        .from("user_projects")
        .select("id,title,created_at,ai_director_json,audio_url,user_id")
        .eq("id", project.id)
        .single();
      
      if (updatedProject) {
        setProject(updatedProject);
      }

      toast({
        title: "Audio generated successfully",
        description: "Your audio is now ready to play",
      });
    } catch (err: any) {
      console.error("Error generating audio:", err);
      toast({
        title: "Audio generation failed",
        description: err.message || "Failed to generate audio",
        variant: "destructive",
      });
    } finally {
      setGeneratingAudio(false);
    }
  };

  const getStatus = () => {
    if (!project) return "Unknown";
    if (project.ai_director_json && project.audio_url) return "Complete";
    if (project.ai_director_json) return "Analyzed";
    return "Draft";
  };

  const safeParseDirectorJson = () => {
    if (!project?.ai_director_json) return null;
    
    try {
      if (typeof project.ai_director_json === 'string') {
        return JSON.parse(project.ai_director_json);
      } else {
        return project.ai_director_json;
      }
    } catch (error) {
      console.error("Failed to parse director JSON:", error);
      return { error: "Invalid JSON data", raw: project.ai_director_json };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <img 
                src="/lovable-uploads/2a81761c-efdc-4094-9e5d-f297e2f44571.png" 
                alt="Story Magic" 
                className="h-28"
              />
            </Link>
            
            <Link 
              to="/dashboard" 
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || "The project you're looking for doesn't exist or you don't have access to it."}</p>
            <Link to="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img 
              src="/lovable-uploads/2a81761c-efdc-4094-9e5d-f297e2f44571.png" 
              alt="Story Magic" 
              className="h-28"
            />
          </Link>
          
          <Link 
            to="/dashboard" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{project.title || "Untitled Project"}</h1>
          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Created: {new Date(project.created_at).toLocaleString()}</span>
            <span>•</span>
            <span className={`font-medium ${
              getStatus() === 'Complete' ? 'text-green-600' : 
              getStatus() === 'Analyzed' ? 'text-yellow-600' : 
              'text-gray-600'
            }`}>
              Status: {getStatus()}
            </span>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Director JSON Section */}
          {project.ai_director_json && (
            <div className="rounded-lg border border-border p-6">
              <button
                onClick={() => setDirectorExpanded(!directorExpanded)}
                className="flex items-center gap-2 w-full text-left"
              >
                {directorExpanded ? (
                  <ChevronDown className="h-5 w-5" />
                ) : (
                  <ChevronRight className="h-5 w-5" />
                )}
                <h2 className="text-xl font-semibold">Director JSON</h2>
              </button>
              
              {directorExpanded && (
                <pre className="mt-4 text-xs bg-muted rounded-md p-4 overflow-auto max-h-96 whitespace-pre-wrap">
                  {JSON.stringify(safeParseDirectorJson(), null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Audio Section */}
          <div className="rounded-lg border border-border p-6">
            <h2 className="text-xl font-semibold mb-4">Audio</h2>
            
            {project.audio_url ? (
              <div className="space-y-4">
                <audio controls className="w-full">
                  <source src={project.audio_url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
                <p className="text-sm text-muted-foreground">
                  Audio generated from AI Director analysis
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">No audio generated yet.</p>
                
                {project.ai_director_json ? (
                  <Button 
                    onClick={handleGenerateAudio}
                    disabled={generatingAudio}
                    className="flex items-center gap-2"
                  >
                    {generatingAudio ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    {generatingAudio ? "Generating Audio..." : "Generate Audio"}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Run AI Director analysis first to enable audio generation.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}