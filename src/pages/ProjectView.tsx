import React, { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  FileText,
  AlertCircle,
  Sparkles,
  Loader2,
  ChevronDown,
  List,
  Upload,
  Eye,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import MultiVoicePanel from "@/components/MultiVoicePanel";

interface Project {
  id: string;
  project_name: string;
  script_url: string | null;
  audio_url: string | null;
  voice_style: string | null;
  mood: string | null;
  generation_count: number | null;
  created_at: string;
  updated_at: string;
}

interface Scene {
  heading: string;
  content: string;
  preview: string;
}

export default function ProjectView() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [scriptPreview, setScriptPreview] = useState<string>("");
  const [fullScript, setFullScript] = useState<string>("");
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(
    null
  );
  const [loadingScript, setLoadingScript] = useState(false);
  const [scenesOpen, setScenesOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [apiResponseData, setApiResponseData] = useState<string>("");
  const [showApiData, setShowApiData] = useState(false);
  const [savingScript, setSavingScript] = useState(false);
  const [scriptText, setScriptText] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (projectId && user) {
      fetchProject();
      loadProjectScript();
      loadMultiVoiceAudio();
    }
  }, [projectId, user]);

  useEffect(() => {
    if (project?.script_url) {
      fetchScriptPreview();
    }
  }, [project?.script_url]);

  // Load project script from Supabase
  const loadProjectScript = async () => {
    if (!projectId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('project_scripts')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading project script:', error);
        return;
      }

      if (data && data.script_text) {
        setScriptText(data.script_text);
        setFullScript(data.script_text);
        
        // Parse scenes if we have valid content
        if (data.script_text && !data.script_text.startsWith("Error")) {
          const parsedScenes = parseScenes(data.script_text);
          setScenes(parsedScenes);
        }
        
        toast({
          title: "Script loaded",
          description: "Your saved script has been restored",
        });
      }
    } catch (error) {
      console.error('Error loading project script:', error);
    }
  };

  // Load multi-voice audio data from Supabase
  const loadMultiVoiceAudio = async () => {
    if (!projectId || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('multi_voice_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading multi-voice data:', error);
        return;
      }

      if (data && data.audio_url) {
        // Update the project with the multi-voice audio URL
        setProject(prev => prev ? { ...prev, audio_url: data.audio_url } : null);
      }
    } catch (error) {
      console.error('Error loading multi-voice audio:', error);
    }
  };

  // Save project script to Supabase
  const saveProjectScript = async (scriptContent: string) => {
    if (!projectId || !user) {
      toast({
        title: "Cannot save",
        description: "Project ID or user not available",
        variant: "destructive",
      });
      return;
    }

    setSavingScript(true);
    try {
      const { error } = await supabase
        .from('project_scripts')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          script_text: scriptContent,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'project_id,user_id'
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Script saved successfully!",
        description: "Your script has been saved to the cloud",
      });
    } catch (error) {
      console.error('Error saving project script:', error);
      toast({
        title: "Save failed",
        description: "Failed to save script to the cloud",
        variant: "destructive",
      });
    } finally {
      setSavingScript(false);
    }
  };

  // Update project audio URL in Supabase
  const updateProjectAudio = async (audioUrl: string) => {
    if (!project) return;

    try {
      const { error } = await supabase
        .from("user_projects")
        .update({ 
          audio_url: audioUrl,
          generation_count: (project.generation_count || 0) + 1,
        })
        .eq("id", project.id);

      if (error) {
        throw error;
      }

      // Update local state
      setProject({ ...project, audio_url: audioUrl });
    } catch (error) {
      console.error('Error updating project audio:', error);
      toast({
        title: "Update failed",
        description: "Failed to update audio URL in database",
        variant: "destructive",
      });
    }
  };

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from("user_projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) {
        toast({
          title: "Error loading project",
          description: error.message,
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
      toast({
        title: "Error loading project",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseScenes = (scriptContent: string): Scene[] => {
    const lines = scriptContent.split("\n");
    const scenes: Scene[] = [];
    let currentScene: { heading: string; content: string[] } | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      // Check if line is a scene heading (starts with INT. or EXT. in caps)
      if (trimmedLine.match(/^(INT\.|EXT\.)/i)) {
        // Save previous scene if exists
        if (currentScene && currentScene.content.length > 0) {
          const content = currentScene.content.join("\n").trim();
          scenes.push({
            heading: currentScene.heading,
            content: content,
            preview:
              content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          });
        }

        // Start new scene
        currentScene = {
          heading: trimmedLine,
          content: [],
        };
      } else if (currentScene && trimmedLine) {
        // Add content to current scene
        currentScene.content.push(line);
      }
    }

    // Add the last scene
    if (currentScene && currentScene.content.length > 0) {
      const content = currentScene.content.join("\n").trim();
      scenes.push({
        heading: currentScene.heading,
        content: content,
        preview:
          content.substring(0, 100) + (content.length > 100 ? "..." : ""),
      });
    }

    return scenes;
  };

  const fetchScriptPreview = async () => {
    if (!project?.script_url) return;

    setLoadingScript(true);
    try {
      // Extract the file path from the script URL - get everything after '/user-files/'
      const urlParts = project.script_url.split("/user-files/");
      if (urlParts.length < 2) {
        console.error("Invalid script URL format");
        return;
      }
      const filePath = urlParts[1];

      const { data: scriptData, error } = await supabase.storage
        .from("user-files")
        .download(filePath);

      if (error || !scriptData) {
        console.error("Error fetching script:", error);
        setScriptPreview("");
        setFullScript("");
        setScenes([]);
        return;
      }

      let scriptContent = "";

      // Handle different file types
      if (
        filePath.toLowerCase().endsWith(".txt") ||
        scriptData.type === "text/plain"
      ) {
        // Handle text files - this is the primary supported format
        try {
          scriptContent = await scriptData.text();
        } catch (error) {
          console.error("Error reading text file:", error);
          scriptContent =
            "Error reading text file. Please ensure it is a valid UTF-8 text file.";
        }
      } else if (filePath.toLowerCase().endsWith(".pdf")) {
        // For now, show message that PDF parsing requires server-side processing
        scriptContent =
          "PDF uploaded successfully. For full functionality, please convert your PDF to a .txt file. PDF text extraction is coming soon.";
      } else {
        // Try to read as text for any other file type
        try {
          scriptContent = await scriptData.text();
        } catch (error) {
          console.error("Error reading file as text:", error);
          scriptContent =
            "File uploaded but could not extract text. Please use .txt files for best results.";
        }
      }

      setFullScript(scriptContent);

      // Parse scenes if we have valid content
      if (scriptContent && !scriptContent.startsWith("Error")) {
        const parsedScenes = parseScenes(scriptContent);
        setScenes(parsedScenes);
      } else {
        setScenes([]);
      }

      // Get first 500 characters for preview
      const preview =
        scriptContent.length > 500
          ? scriptContent.substring(0, 500) + "..."
          : scriptContent;

      setScriptPreview(preview);
    } catch (error) {
      console.error("Error loading script preview:", error);
      setScriptPreview("");
      setFullScript("");
      setScenes([]);
      toast({
        title: "Error loading script",
        description: "Failed to load script content. Please try re-uploading.",
        variant: "destructive",
      });
    } finally {
      setLoadingScript(false);
    }
  };

  // Test audio URL accessibility
  const testAudioUrl = async (audioUrl: string) => {
    try {
      const response = await fetch(audioUrl, { method: 'HEAD' });
      console.log('Audio URL test response:', response.status, response.statusText);
      
      if (!response.ok) {
        toast({
          title: "Audio file not accessible",
          description: `HTTP ${response.status}: ${response.statusText}`,
          variant: "destructive",
        });
        return false;
      }
      
      const contentType = response.headers.get('content-type');
      console.log('Audio content type:', contentType);
      
      if (!contentType || !contentType.includes('audio/')) {
        toast({
          title: "Invalid audio file",
          description: "The file is not recognized as an audio file",
          variant: "destructive",
        });
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Audio URL test error:', error);
      toast({
        title: "Audio file test failed",
        description: "Unable to access the audio file",
        variant: "destructive",
      });
      return false;
    }
  };

  const openScript = () => {
    if (!project?.script_url) return;

    // Trigger script loading to show content in the UI
    fetchScriptPreview();

    toast({
      title: "Script loaded",
      description: "Script content is now displayed below",
    });
  };

  const previewScript = async () => {
    if (!project?.script_url || !user) {
      toast({
        title: "No script to preview",
        description: "Please upload a script first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Extract file path from the URL
      const urlParts = project.script_url.split("/user-files/");
      if (urlParts.length < 2) {
        throw new Error("Invalid script URL format");
      }
      const filePath = urlParts[1];

      // Generate a signed URL for better access
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('user-files')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError) {
        throw signedUrlError;
      }

      const previewUrl = signedUrlData.signedUrl;

      // Check if it's a PDF file
      if (project.script_url.toLowerCase().includes('.pdf')) {
        // Open PDF in new tab with signed URL
        window.open(previewUrl, '_blank');
        toast({
          title: "PDF Preview",
          description: "Opening PDF in new tab...",
        });
      } else if (project.script_url.toLowerCase().includes('.txt')) {
        // For text files, show the content in the UI
        openScript();
        toast({
          title: "Text Preview",
          description: "Showing text content below",
        });
      } else {
        // For other file types, try to open in new tab with signed URL
        window.open(previewUrl, '_blank');
        toast({
          title: "File Preview",
          description: "Opening file in new tab...",
        });
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast({
        title: "Preview failed",
        description: "Unable to generate preview. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !project || !user) return;

    // Validate file type
    const allowedTypes = ["text/plain", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a .txt or .pdf file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      // First, try to call the API with the file
      try {
        const base64 = await readFileAsBase64(file);
        
        // Try multiple approaches to handle CORS
        let response;
        
        // Method 1: Try with CORS mode and proper headers
        try {
          response = await fetch(
            "https://6901750e351a.ngrok-free.app/api/v1/resume/generate",
            {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Accept": "application/json",
                "ngrok-skip-browser-warning": "true" // Skip ngrok browser warning
              },
              mode: 'cors',
              body: JSON.stringify({
                isBase64: true,
                baseResumeText: base64,
              }),
            }
          );
        } catch (corsError) {
          console.log("CORS error, trying without mode specification:", corsError);
          
          // Method 2: Try without explicit CORS mode
          try {
            response = await fetch(
              "https://6901750e351a.ngrok-free.app/api/v1/resume/generate",
              {
                method: "POST",
                headers: { 
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "ngrok-skip-browser-warning": "true"
                },
                body: JSON.stringify({
                  isBase64: true,
                  baseResumeText: base64,
                }),
              }
            );
          } catch (secondError) {
            console.log("Second attempt failed, trying XMLHttpRequest:", secondError);
            
            // Method 3: Try with XMLHttpRequest as fallback
            response = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('POST', 'https://6901750e351a.ngrok-free.app/api/v1/resume/generate', true);
              xhr.setRequestHeader('Content-Type', 'application/json');
              xhr.setRequestHeader('Accept', 'application/json');
              xhr.setRequestHeader('ngrok-skip-browser-warning', 'true');
              
              xhr.onload = function() {
                if (xhr.status >= 200 && xhr.status < 300) {
                  resolve({
                    ok: true,
                    json: () => Promise.resolve(JSON.parse(xhr.responseText))
                  });
                } else {
                  reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                }
              };
              
              xhr.onerror = function() {
                reject(new Error('Network error'));
              };
              
              xhr.send(JSON.stringify({
                isBase64: true,
                baseResumeText: base64,
              }));
            });
          }
        }

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setApiResponseData(data.resumes[0].extractedText);
        setShowApiData(true);

        toast({
          title: "Resume uploaded successfully!",
          description: "API processing completed successfully.",
        });
      } catch (apiError) {
        console.error("API call failed:", apiError);
        
        // Show different messages based on error type
        if (apiError.message.includes('CORS') || apiError.message.includes('Failed to fetch')) {
          toast({
            title: "API temporarily unavailable",
            description: "External API is not accessible. File uploaded successfully to Supabase.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "API processing failed",
            description: "File uploaded but API processing failed. You can still use the file normally.",
            variant: "destructive",
          });
        }
      }

      // Generate a unique filename
      const fileExtension = file.name.split(".").pop();
      const fileName = `${user.id}/${project.id}/script.${fileExtension}`;

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("user-files")
        .upload(fileName, file, {
          upsert: true,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("user-files")
        .getPublicUrl(fileName);

      // Update the project with script URL
      const { error: updateError } = await supabase
        .from("user_projects")
        .update({ script_url: urlData.publicUrl })
        .eq("id", project.id);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProject({ ...project, script_url: urlData.publicUrl });

      // Automatically load and parse the script after upload
      setTimeout(() => {
        fetchScriptPreview();
      }, 100);

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Error uploading script:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Failed to upload script",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getScriptFileName = (url: string) => {
    try {
      const fileName = url.split("/").pop();
      return fileName || "script";
    } catch {
      return "script";
    }
  };

  // Helper function to read file as base64
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Helper function to convert AudioBuffer to WAV blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const arrayBuffer = new ArrayBuffer(
      44 + length * numberOfChannels * bytesPerSample
    );
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * numberOfChannels * bytesPerSample, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
    view.setUint16(32, numberOfChannels * bytesPerSample, true);
    view.setUint16(34, 8 * bytesPerSample, true);
    writeString(36, "data");
    view.setUint32(40, length * numberOfChannels * bytesPerSample, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, buffer.getChannelData(channel)[i])
        );
        view.setInt16(offset, sample * 0x7fff, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: "audio/wav" });
  };

  const updateVoiceStyle = async (voiceStyle: string) => {
    if (!project) return;

    const { error } = await supabase
      .from("user_projects")
      .update({ voice_style: voiceStyle })
      .eq("id", project.id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setProject({ ...project, voice_style: voiceStyle });
    toast({
      title: "Voice style updated",
      description: `Set to ${voiceStyle}`,
    });
  };

  const updateMood = async (mood: string) => {
    if (!project) return;

    const { error } = await supabase
      .from("user_projects")
      .update({ mood: mood })
      .eq("id", project.id);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setProject({ ...project, mood: mood });
    toast({
      title: "Mood updated",
      description: `Set to ${mood}`,
    });
  };

  const generateAudio = async () => {
    if (!project || !user) return;

    // Check if script content is available
    if (!fullScript || fullScript.trim() === "") {
      toast({
        title: "No script content",
        description: "Please load your script first by clicking 'Open Script'",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    try {
      // Determine what text to use for generation
      let textToGenerate = fullScript;
      if (selectedSceneIndex !== null && scenes[selectedSceneIndex]) {
        textToGenerate = scenes[selectedSceneIndex].content;
      }

      // Validate text content
      if (!textToGenerate || textToGenerate.trim() === "") {
        toast({
          title: "No content to generate",
          description:
            "Please select a scene or ensure your script has content",
          variant: "destructive",
        });
        return;
      }

      // Call the edge function to generate audio with ElevenLabs
      const { data, error } = await supabase.functions.invoke(
        "generate-audio",
        {
          body: {
            voiceStyle: project.voice_style,
            mood: project.mood,
            userId: user.id,
            projectId: project.id,
            customText: textToGenerate, // Send the selected scene or full script
          },
        }
      );

      if (error) {
        console.error("Function error:", error);
        toast({
          title: "Generation failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data.success) {
        throw new Error(data.error || "Unknown error occurred");
      }

      // Update the project with the audio URL and increment generation count
      const { error: updateError } = await supabase
        .from("user_projects")
        .update({
          audio_url: data.audioUrl,
          generation_count: (project.generation_count || 0) + 1,
        })
        .eq("id", project.id);

      if (updateError) {
        console.error("Update error:", updateError);
        toast({
          title: "Update failed",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // Update local state and save to Supabase
      setProject({ ...project, audio_url: data.audioUrl });
      await updateProjectAudio(data.audioUrl);

      toast({
        title: "Audio generated successfully!",
        description: "Your AI-generated audio is ready to play.",
      });
    } catch (error) {
      console.error("Error generating audio:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate audio file",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  // Check Supabase storage bucket configuration
  const checkStorageBucket = async () => {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.error('Storage bucket error:', error);
        toast({
          title: "Storage access error",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      console.log('Available storage buckets:', data);
      
      // Check if user-files bucket exists
      const userFilesBucket = data.find(bucket => bucket.name === 'user-files');
      if (!userFilesBucket) {
        toast({
          title: "Storage bucket missing",
          description: "The 'user-files' bucket does not exist in Supabase storage",
          variant: "destructive",
        });
        return;
      }
      
      console.log('user-files bucket found:', userFilesBucket);
      
      // Check bucket public/private status
      if (!userFilesBucket.public) {
        toast({
          title: "Storage bucket not public",
          description: "The 'user-files' bucket is not public. Files may not be accessible.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Storage bucket check error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">Loading project...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Project not found</h2>
          <Button onClick={() => navigate("/dashboard")}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{project.project_name}</h1>
              <p className="text-muted-foreground">
                Created {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge variant="secondary">
              {project.audio_url ? "Audio Ready" : "Processing"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Script Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Script
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.script_url ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-medium mb-2">Script uploaded</p>
                    <p className="text-sm text-muted-foreground mb-2">
                      File: {getScriptFileName(project.script_url)}
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Click to view your screenplay or upload a new one
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button onClick={openScript} variant="outline">
                        <FileText className="h-4 w-4 mr-2" />
                        Open Script
                      </Button>
                      <Button onClick={previewScript} variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button
                        onClick={triggerFileUpload}
                        variant="outline"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-2" />
                            Replace
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium mb-2">Upload Your Script</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a .txt or .pdf screenplay file to get started
                  </p>
                  <Button
                    onClick={triggerFileUpload}
                    disabled={uploading}
                    className="gap-2"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        Choose File
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Supported formats: TXT, PDF (max 10MB)
                  </p>
                </div>
              )}

              {/* Hidden file input */}
              <Input
                ref={fileInputRef}
                type="file"
                accept=".txt,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* API Response Data Display */}
              {showApiData && apiResponseData && (
                <div className="mt-6 border rounded-lg p-4 bg-muted/30">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    API Processed Content
                  </h4>
                  <div className="text-sm text-muted-foreground max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                    {apiResponseData}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(apiResponseData);
                        toast({
                          title: "Copied to clipboard",
                          description:
                            "API response data has been copied to your clipboard.",
                        });
                      }}
                    >
                      Copy to Clipboard
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowApiData(false)}
                    >
                      Hide
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Multi-Voice Panel for this project's script */}
          <MultiVoicePanel 
            scriptText={scriptText || fullScript} 
            allowScriptEdit={true}
            projectId={projectId}
            onScriptChange={(newScriptText) => {
              setScriptText(newScriptText);
              setFullScript(newScriptText);
              // Auto-save script changes
              saveProjectScript(newScriptText);
            }}
            onAudioSaved={(audioUrl) => {
              // Update the project state with the new audio URL
              setProject(prev => prev ? { ...prev, audio_url: audioUrl } : null);
            }}
          />

          {/* Multi-Voice Panel handles all audio functionality now */}
          {/* Removed duplicate audio player - MultiVoicePanel has its own audio player */}
        </div>

        {/* Voice & Mood Settings */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Audio Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {/* Voice Style Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voice Style</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {project.voice_style || "Select voice style"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem
                        onClick={() => updateVoiceStyle("Narrator Deep")}
                      >
                        Narrator Deep
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateVoiceStyle("Narrator Soothing")}
                      >
                        Narrator Soothing
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateVoiceStyle("Warm Female")}
                      >
                        Warm Female
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateVoiceStyle("Assertive Female")}
                      >
                        Assertive Female
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateVoiceStyle("Neutral Male")}
                      >
                        Neutral Male
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateVoiceStyle("Comedic Male")}
                      >
                        Comedic Male
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateVoiceStyle("Elderly Male Mentor")}
                      >
                        Elderly Male Mentor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          updateVoiceStyle("Elderly Female Mentor")
                        }
                      >
                        Elderly Female Mentor
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateVoiceStyle("Young Hero")}
                      >
                        Young Hero
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Mood Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Mood</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        {project.mood || "Select mood"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem onClick={() => updateMood("Tense")}>
                        Tense
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMood("Inspiring")}>
                        Inspiring
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMood("Dark")}>
                        Dark
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMood("Comedic")}>
                        Comedic
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => updateMood("Melancholy")}
                      >
                        Melancholy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMood("Hopeful")}>
                        Hopeful
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMood("Romantic")}>
                        Romantic
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateMood("Epic")}>
                        Epic
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
