import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Play, Pause, Volume2, Download, FileText, AlertCircle, Sparkles, Loader2, ChevronDown, List } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const [scriptPreview, setScriptPreview] = useState<string>('');
  const [fullScript, setFullScript] = useState<string>('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null);
  const [loadingScript, setLoadingScript] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [scenesOpen, setScenesOpen] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (projectId && user) {
      fetchProject();
    }
  }, [projectId, user]);

  useEffect(() => {
    if (project?.script_url) {
      fetchScriptPreview();
    }
  }, [project?.script_url]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [project?.audio_url]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('user_projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        toast({
          title: "Error loading project",
          description: error.message,
          variant: "destructive",
        });
        navigate('/dashboard');
        return;
      }

      setProject(data);
    } catch (error) {
      console.error('Error fetching project:', error);
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
    const lines = scriptContent.split('\n');
    const scenes: Scene[] = [];
    let currentScene: { heading: string; content: string[] } | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Check if line is a scene heading (starts with INT. or EXT. in caps)
      if (trimmedLine.match(/^(INT\.|EXT\.)/i)) {
        // Save previous scene if exists
        if (currentScene && currentScene.content.length > 0) {
          const content = currentScene.content.join('\n').trim();
          scenes.push({
            heading: currentScene.heading,
            content: content,
            preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
          });
        }
        
        // Start new scene
        currentScene = {
          heading: trimmedLine,
          content: []
        };
      } else if (currentScene && trimmedLine) {
        // Add content to current scene
        currentScene.content.push(line);
      }
    }

    // Add the last scene
    if (currentScene && currentScene.content.length > 0) {
      const content = currentScene.content.join('\n').trim();
      scenes.push({
        heading: currentScene.heading,
        content: content,
        preview: content.substring(0, 100) + (content.length > 100 ? '...' : '')
      });
    }

    return scenes;
  };

  const fetchScriptPreview = async () => {
    if (!project?.script_url) return;
    
    setLoadingScript(true);
    try {
      // Extract the file path from the script URL
      const fileName = project.script_url.split('/').pop()!;
      
      const { data: scriptData, error } = await supabase.storage
        .from('user-files')
        .download(fileName);

      if (error || !scriptData) {
        console.error('Error fetching script:', error);
        setScriptPreview('');
        setFullScript('');
        setScenes([]);
        return;
      }

      const scriptContent = await scriptData.text();
      setFullScript(scriptContent);
      
      // Parse scenes
      const parsedScenes = parseScenes(scriptContent);
      setScenes(parsedScenes);
      
      // Get first 800 characters for preview
      const preview = scriptContent.length > 800 
        ? scriptContent.substring(0, 800) + '...'
        : scriptContent;
      
      setScriptPreview(preview);
    } catch (error) {
      console.error('Error loading script preview:', error);
      setScriptPreview('');
      setFullScript('');
      setScenes([]);
    } finally {
      setLoadingScript(false);
    }
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !project?.audio_url) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const openScript = () => {
    if (project?.script_url) {
      window.open(project.script_url, '_blank');
    }
  };

  const downloadAudio = () => {
    if (project?.audio_url) {
      const link = document.createElement('a');
      link.href = project.audio_url;
      link.download = `${project.project_name}-audio.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Helper function to convert AudioBuffer to WAV blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const length = buffer.length;
    const numberOfChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bytesPerSample = 2;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * bytesPerSample);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * numberOfChannels * bytesPerSample, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * bytesPerSample, true);
    view.setUint16(32, numberOfChannels * bytesPerSample, true);
    view.setUint16(34, 8 * bytesPerSample, true);
    writeString(36, 'data');
    view.setUint32(40, length * numberOfChannels * bytesPerSample, true);

    // Convert audio data
    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]));
        view.setInt16(offset, sample * 0x7FFF, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  };

  const updateVoiceStyle = async (voiceStyle: string) => {
    if (!project) return;
    
    const { error } = await supabase
      .from('user_projects')
      .update({ voice_style: voiceStyle })
      .eq('id', project.id);

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
      .from('user_projects')
      .update({ mood: mood })
      .eq('id', project.id);

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

    setGenerating(true);
    try {
      // Determine what text to use for generation
      let textToGenerate = fullScript;
      if (selectedSceneIndex !== null && scenes[selectedSceneIndex]) {
        textToGenerate = scenes[selectedSceneIndex].content;
      }

      // Call the edge function to generate audio with ElevenLabs
      const { data, error } = await supabase.functions.invoke('generate-audio', {
        body: {
          voiceStyle: project.voice_style,
          mood: project.mood,
          userId: user.id,
          projectId: project.id,
          customText: textToGenerate, // Send the selected scene or full script
        },
      });

      if (error) {
        console.error('Function error:', error);
        toast({
          title: "Generation failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      // Update the project with the audio URL and increment generation count
      const { error: updateError } = await supabase
        .from('user_projects')
        .update({ 
          audio_url: data.audioUrl,
          generation_count: (project.generation_count || 0) + 1
        })
        .eq('id', project.id);

      if (updateError) {
        console.error('Update error:', updateError);
        toast({
          title: "Update failed",
          description: updateError.message,
          variant: "destructive",
        });
        return;
      }

      // Refresh project data
      await fetchProject();
      
      toast({
        title: "Audio generated successfully!",
        description: "Your AI-generated audio is ready to play.",
      });

    } catch (error) {
      console.error('Error generating audio:', error);
      toast({
        title: "Generation failed",
        description: "Failed to generate audio file",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
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
          <Button onClick={() => navigate('/dashboard')}>
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
            onClick={() => navigate('/dashboard')}
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
              {project.audio_url ? 'Audio Ready' : 'Processing'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                    <p className="text-sm text-muted-foreground mb-4">
                      Click to view your screenplay
                    </p>
                    <Button onClick={openScript} variant="outline">
                      Open Script
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No script uploaded yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audio Player */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Audio Player
              </CardTitle>
            </CardHeader>
            <CardContent>
              {project.audio_url ? (
                <div className="space-y-6">
                  <audio ref={audioRef} src={project.audio_url} preload="metadata" />
                  
                  {/* Play Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={togglePlay}
                      className="h-12 w-12 rounded-full"
                    >
                      {isPlaying ? (
                        <Pause className="h-6 w-6" />
                      ) : (
                        <Play className="h-6 w-6" />
                      )}
                    </Button>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Slider
                      value={[currentTime]}
                      onValueChange={handleSeek}
                      max={duration || 100}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Volume Control */}
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-muted-foreground" />
                    <Slider
                      value={[volume]}
                      onValueChange={handleVolumeChange}
                      max={100}
                      step={1}
                      className="flex-1 max-w-32"
                    />
                    <span className="text-sm text-muted-foreground w-10">
                      {volume}%
                    </span>
                  </div>

                  {/* Download Button */}
                  <Button 
                    onClick={downloadAudio}
                    variant="outline" 
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Audio
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Scene Picker */}
                  {project.script_url && scenes.length > 0 && (
                    <div className="bg-muted/30 rounded-lg p-4 border">
                      <Collapsible open={scenesOpen} onOpenChange={setScenesOpen}>
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                            <div className="flex items-center gap-2">
                              <List className="h-4 w-4" />
                              <span className="text-sm font-medium">
                                Scene Picker ({scenes.length} scenes found)
                                {selectedSceneIndex !== null && ` - Selected: Scene ${selectedSceneIndex + 1}`}
                              </span>
                            </div>
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            <Button
                              variant={selectedSceneIndex === null ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedSceneIndex(null)}
                              className="w-full justify-start text-left"
                            >
                              <span className="font-medium">Full Script</span>
                            </Button>
                            {scenes.map((scene, index) => (
                              <Button
                                key={index}
                                variant={selectedSceneIndex === index ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedSceneIndex(index)}
                                className="w-full justify-start text-left h-auto py-2"
                              >
                                <div className="flex flex-col items-start gap-1">
                                  <span className="font-medium text-xs">Scene {index + 1}: {scene.heading}</span>
                                  <span className="text-xs text-muted-foreground">{scene.preview}</span>
                                </div>
                              </Button>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  )}

                  {/* Script Preview for Audio Generation */}
                  {project.script_url && (
                    <div className="bg-muted/30 rounded-lg p-4 border">
                      <h4 className="text-sm font-medium mb-2">
                        {selectedSceneIndex !== null 
                          ? `Selected Scene: ${scenes[selectedSceneIndex]?.heading}` 
                          : "Script Preview (First 800 characters)"
                        }
                      </h4>
                      {loadingScript ? (
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Loading script preview...</span>
                        </div>
                      ) : selectedSceneIndex !== null ? (
                        <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto leading-relaxed">
                          {scenes[selectedSceneIndex]?.content || 'Scene content not available'}
                        </div>
                      ) : scriptPreview ? (
                        <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto leading-relaxed">
                          {scriptPreview}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Unable to load script preview</p>
                      )}
                    </div>
                  )}
                  
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-medium mb-2">No audio file yet</p>
                    <p className="text-sm text-muted-foreground mb-6">
                      {project.script_url 
                        ? selectedSceneIndex !== null 
                          ? `Generate audio for Scene ${selectedSceneIndex + 1}: ${scenes[selectedSceneIndex]?.heading}`
                          : "Generate audio from your full script to create an immersive experience"
                        : "Upload a script first, then generate audio from it"
                      }
                    </p>
                    <Button 
                      onClick={generateAudio}
                      disabled={generating || !project.script_url}
                      className="gap-2"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Generating Audio...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Generate Audio
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Voice & Mood Settings */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Audio Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice Style Dropdown */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voice Style</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full justify-between">
                        {project.voice_style || "Select voice style"}
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full">
                      <DropdownMenuItem onClick={() => updateVoiceStyle("Narrator Deep")}>
                        Narrator Deep
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateVoiceStyle("Narrator Soothing")}>
                        Narrator Soothing
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateVoiceStyle("Warm Female")}>
                        Warm Female
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateVoiceStyle("Assertive Female")}>
                        Assertive Female
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateVoiceStyle("Neutral Male")}>
                        Neutral Male
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateVoiceStyle("Comedic Male")}>
                        Comedic Male
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateVoiceStyle("Elderly Male Mentor")}>
                        Elderly Male Mentor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateVoiceStyle("Elderly Female Mentor")}>
                        Elderly Female Mentor
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => updateVoiceStyle("Young Hero")}>
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
                      <Button variant="outline" className="w-full justify-between">
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
                      <DropdownMenuItem onClick={() => updateMood("Melancholy")}>
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