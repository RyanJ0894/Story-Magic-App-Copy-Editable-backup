import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjectDetail } from "@/features/projects/hooks/useProjectDetail";
import { ChunkProgress } from "@/features/projects/components/ChunkProgress";
import { ProjectDataViewer } from "@/features/projects/components/ProjectDataViewer";
import ScreenplayPlayer from "@/features/scripts/components/ScreenplayPlayer";
import AudioPlayer from "@/features/scripts/components/AudioPlayer";
import { useScriptPlayerControls } from "@/features/scripts/hooks/useScriptPlayerControls";
import { ChunkProgressData } from "@/features/projects/project-chunk.type";
import { useGenerateProjectAudio } from "@/features/projects/projects";
import { AudioGenerationRequest } from "@/features/projects/services/audioGenerationApi";
import { projectApi } from "@/features/projects/services/projectApi";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function convertDirectorJsonToChunks(directorJson: any, projectId: string): ChunkProgressData[] {
  const scenesArray = Array.isArray(directorJson) ? directorJson : (directorJson.scenes || []);
  
  let fallbackCumulativeTime = 0;
  
  return scenesArray.map((scene: any, sceneIndex: number) => {
    const sceneDialogue = scene.dialogue || [];
    const sceneId = scene.scene_id || `scene_${sceneIndex + 1}`;
    
    const sceneOffset = fallbackCumulativeTime;
    
    const sceneLines = Array.isArray(sceneDialogue) ? sceneDialogue.map((line: any, lineIndex: number) => {
      const lineText = line.text || '';
      const lineCharacter = line.character || 'NARRATOR';
      
      const isNarrator = lineCharacter.toUpperCase() === 'NARRATOR';
      const lineType = isNarrator ? 'action' : 'dialogue';
      
      const totalCharsInScene = sceneDialogue.reduce((sum: number, l: any) => sum + (l.text?.length || 0), 0);
      const lineWeight = lineText.length / Math.max(totalCharsInScene, 1);
      const lineDuration = Math.max(2, Math.ceil(lineText.length / 15));
      
      const priorChars = sceneDialogue.slice(0, lineIndex).reduce((sum: number, l: any) => sum + (l.text?.length || 0), 0);
      const priorWeight = priorChars / Math.max(totalCharsInScene, 1);
      const lineStart = sceneOffset + (fallbackCumulativeTime - sceneOffset);
      
      fallbackCumulativeTime += lineDuration;
      
      return {
        line_id: line.line_id || `line_${sceneIndex}_${lineIndex}`,
        type: lineType as 'action' | 'dialogue',
        text: lineText,
        character: lineCharacter,
        voice_key: line.voice_key || null,
        tts_settings: {
          character: lineCharacter,
          voice_style: line.voice_style || 'Natural',
        },
        start: lineStart,
        duration: lineDuration,
        src: null,
        volume: 0.8,
      };
    }) : [];
    
    const computedSceneDuration = sceneLines.reduce((sum, line) => sum + line.duration, 0);
    fallbackCumulativeTime = sceneOffset + computedSceneDuration;
    
    return {
      chunk_id: String(sceneId),
      project_id: projectId,
      scene_title: scene.scene_id || `Scene ${sceneIndex + 1}`,
      version: 1,
      director_notes: scene.mood || '',
      lines: sceneLines,
      audio_direction: {
        music: scene.music?.map((m: any, idx: number) => ({
          track_id: m.track_id || `music_${sceneIndex}_${idx}`,
          name: m.track_id || '',
          start: sceneOffset,
          duration: computedSceneDuration,
          volume: m.volume || 0.25,
          src: null,
        })) || [],
        ambience: scene.ambience?.map((a: any, idx: number) => ({
          track_id: a.track_id || `ambience_${sceneIndex}_${idx}`,
          name: a.track_id || '',
          start: sceneOffset,
          duration: computedSceneDuration,
          volume: a.volume || 0.28,
          src: null,
        })) || [],
        sfx: scene.sfx?.map((s: any, idx: number) => ({
          track_id: s.track_id || `sfx_${sceneIndex}_${idx}`,
          name: s.track_id || '',
          start: sceneOffset + (s.at || 0),
          duration: 2,
          volume: s.volume || 0.5,
          src: null,
        })) || [],
      },
    };
  });
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [loadedChunks, setLoadedChunks] = useState<ChunkProgressData[]>([]);
  const [duration, setDuration] = useState(30);
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);

  // Audio generation mutation
  const { mutateAsync: generateAudio, isPending: isGeneratingAudio } = useGenerateProjectAudio();

  const {
    project,
    isLoading,
    error,
    getProjectStatus,
  } = useProjectDetail(id);

  // Load saved audio URL from project when it loads
  useEffect(() => {
    if (project?.audio_url && !generatedAudioUrl) {
      setGeneratedAudioUrl(project.audio_url);
      console.log('📥 Loaded saved audio URL from project:', project.audio_url);
    }
  }, [project?.audio_url]);

  // Load chunks from Director JSON when viewing a completed project
  useEffect(() => {
    const loadChunksFromDirectorJson = async () => {
      if (!id || !project?.audio_url || loadedChunks.length > 0) return;
      
      console.log('📊 Fetching Director JSON for project:', id);
      
      try {
        // Try director_json table first
        const { data: directorData, error: directorError } = await supabase
          .from('director_json')
          .select('json_data')
          .eq('project_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        let directorJson = directorData?.json_data as Record<string, any> | null;
        
        // Fallback to user_projects table
        if (!directorJson) {
          const { data: projectData } = await supabase
            .from('user_projects')
            .select('ai_director_json')
            .eq('id', id)
            .maybeSingle();
          
          directorJson = projectData?.ai_director_json as Record<string, any> | null;
        }
        
        if (directorJson?.scenes?.length) {
          const chunks = convertDirectorJsonToChunks(directorJson, id);
          console.log('✅ Loaded chunks from Director JSON:', chunks.length);
          setLoadedChunks(chunks);
          
          // Calculate duration
          let maxEndTime = 0;
          chunks.forEach(chunk => {
            chunk.lines.forEach((line: any) => {
              const endTime = line.start + line.duration;
              if (endTime > maxEndTime) maxEndTime = endTime;
            });
          });
          if (maxEndTime > 0) {
            setDuration(Math.ceil(maxEndTime));
          }
        } else {
          console.log('⚠️ No Director JSON found for project');
        }
      } catch (err) {
        console.error('Failed to load Director JSON:', err);
      }
    };
    
    loadChunksFromDirectorJson();
  }, [id, project?.audio_url, loadedChunks.length]);

  // Handle chunks change from ChunkProgress
  const handleChunksChange = (chunks: ChunkProgressData[]) => {
    setLoadedChunks(chunks);

    // Calculate duration from chunks
    if (chunks.length > 0) {
      let maxEndTime = 0;
      chunks.forEach(chunk => {
        chunk.lines.forEach((line: any) => {
          const endTime = line.start + line.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });

        [...chunk.audio_direction.music, ...chunk.audio_direction.ambience, ...chunk.audio_direction.sfx].forEach((audio: any) => {
          const endTime = audio.start + audio.duration;
          if (endTime > maxEndTime) maxEndTime = endTime;
        });
      });

      if (maxEndTime > 0) {
        setDuration(Math.ceil(maxEndTime));
      }
    }
  };

  const handleChunksComplete = (chunks: ChunkProgressData[]) => {
    toast.success("All chunks completed", {
      description: "All chunks have been completed",
    });
    console.log("All chunks completed:", chunks);
  };

  // Script player controls hook
  const {
    currentTime,
    isPlaying,
    duration: playerDuration,
    handleSeek,
    handlePlayPause,
    handleTimeUpdate,
    handleDurationChange,
    handleEnded,
    handleLineChange,
    handleVoiceChange,
    handleVolumeChange,
    handleSfxChange,
  } = useScriptPlayerControls({
    initialDuration: duration,
    onLineChange: (lineId: string) => {
      console.log("Active line changed:", lineId);
    },
    onVoiceChange: (lineId: string, voiceKey: string) => {
      console.log("Voice changed:", lineId, voiceKey);
    },
    onVolumeChange: (trackId: string, volume: number) => {
      console.log("Volume changed:", trackId, volume);
    },
    onSfxChange: (trackId: string, sfxKey: string) => {
      console.log("SFX changed:", trackId, sfxKey);
    },
  });

  // Generate Audio function
  const handleGenerateAudio = async () => {
    if (loadedChunks.length === 0) {
      toast.error("No chunks available", {
        description: "Please wait for chunks to be processed",
      });
      return;
    }

    try {
      // Prepare request data according to API format
      const requestData: AudioGenerationRequest = {
        project: {
          id: project?.id || "",
          title: project?.title || "Untitled Project",
          created_at: project?.created_at || new Date().toISOString(),
        },
        chunks: loadedChunks.map((chunk, index) => ({
          chunk_id: chunk.chunk_id,
          project_id: chunk.project_id,
          scene_title: chunk.scene_title,
          lines: chunk.lines.map(line => ({
            line_id: line.line_id,
            text: line.text,
            type: line.type,
            start: line.start,
            duration: line.duration,
            volume: line.volume,
            src: line.src,
            tts_settings: {
              style: line.tts_settings.style,
              status: line.tts_settings.status,
              language: line.tts_settings.language,
              provider: line.tts_settings.provider,
              character: line.tts_settings.character,
              voice_key: line.tts_settings.voice_key,
              stability: line.tts_settings.stability,
              similarity_boost: line.tts_settings.similarity_boost,
              credits_used: line.tts_settings.credits_used,
            }
          })),
          audio_direction: {
            music: chunk.audio_direction.music.map(track => ({
              track_id: track.track_id,
              label: track.label,
              src: track.src,
              start: track.start,
              duration: track.duration,
              volume: track.volume,
              fade_in: track.fade_in,
              fade_out: track.fade_out
            })),
            ambience: chunk.audio_direction.ambience.map(track => ({
              track_id: track.track_id,
              label: track.label,
              src: track.src,
              start: track.start,
              duration: track.duration,
              volume: track.volume,
              fade_in: track.fade_in,
              fade_out: track.fade_out
            })),
            sfx: chunk.audio_direction.sfx.map(track => ({
              track_id: track.track_id,
              label: track.label,
              src: track.src,
              start: track.start,
              duration: track.duration,
              volume: track.volume,
              fade_in: track.fade_in,
              fade_out: track.fade_out
            }))
          },
          estimated_chunk_duration: chunk.lines.reduce((max, line) => Math.max(max, line.start + line.duration), 0),
          global_start: index * 12 // This should be calculated based on previous chunks' durations
        })),
        metadata: {
          total_chunks: loadedChunks.length,
          generated_at: new Date().toISOString(),
          version: "1.0"
        }
      };

      console.log("🎵 Generate Audio - Request Data:", requestData);

      // Call real API
      const response = await generateAudio(requestData);
      console.log("🎵 Generate Audio - Response:", response);
      setGeneratedAudioUrl(response.public_url);

      // Save audio URL to the project
      if (project?.id && response.public_url) {
        try {
          await projectApi.updateProjectAudioUrl(project.id, response.public_url);
          console.log('✅ Saved audio URL to project:', response.public_url);
        } catch (saveError) {
          console.error('Failed to save audio URL to project:', saveError);
        }
      }

      toast.success("Audio generated successfully!", {
        description: `Download: ${response.output_filename}`,
      });

    } catch (error: any) {
      console.error("Audio generation failed:", error);
      toast.error("Failed to generate audio", {
        description: error.message || "Please try again later",
      });
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">{error?.message || "The project you're looking for doesn't exist or you don't have access to it."}</p>
            <Link to="/dashboard">
              <Button>Return to Dashboard</Button>
            </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {/* Project Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold">{project.title || "Untitled Project"}</h1>
        </div>

          <div className="flex items-center gap-4 text-muted-foreground">
            <span>Created: {new Date(project.created_at).toLocaleString()}</span>
            <span>•</span>
          <span className={`font-medium ${getProjectStatus() === 'Complete' ? 'text-cu' :
            getProjectStatus() === 'Analyzed' ? 'text-yellow-600' :
              'text-gray-600'
            }`}>
            Status: {getProjectStatus()}
            </span>
          </div>
        </div>

        <div className="grid gap-6">
        {/* Chunk Processing Section */}
        {project && (
          <div className="space-y-6">
              <ChunkProgress
              projectId={id!}
              script={project.script}
              onChunksChange={handleChunksChange}
              onComplete={handleChunksComplete}
            />
          </div>
        )}

        {/* Saved Audio Section - Always show if audio exists */}
        {generatedAudioUrl && (
          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold text-foreground mb-4">Project Audio</h2>
            <div className="space-y-4">
              <AudioPlayer
                audioUrl={generatedAudioUrl}
                currentTime={currentTime}
                isPlaying={isPlaying}
                onTimeUpdate={handleTimeUpdate}
                onDurationChange={handleDurationChange}
                onPlayPause={handlePlayPause}
                onEnded={handleEnded}
              />
              <div className="flex items-center gap-3 flex-wrap">
                <a 
                  href={generatedAudioUrl} 
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
                  data-testid="link-download-project-audio"
                >
                  <Download className="h-4 w-4" />
                  Download Audio
                </a>
                <Link to="/dashboard">
                  <Button variant="outline" data-testid="button-back-dashboard">
                    Back to Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Screenplay Player Section - Only if chunks available */}
        {loadedChunks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Script Playback</h2>
            <p className="text-sm text-muted-foreground">
              Click on any line to jump to that point in the audio
            </p>

            <ScreenplayPlayer
              chunks={loadedChunks}
              currentTime={currentTime}
              isPlaying={isPlaying}
              duration={playerDuration}
              onSeek={handleSeek}
              onPlayPause={handlePlayPause}
            />
          </div>
        )}

        {/* Project Data Viewer */}
        <ProjectDataViewer
          chunks={loadedChunks}
          projectId={project?.id}
          projectTitle={project?.title}
          projectCreatedAt={project?.created_at}
        />

      </div>

      {/* Generate Audio Section - Moved to bottom */}
      {loadedChunks.length > 0 && (
        <div className="mt-8 p-6 border border-border rounded-lg bg-card">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-foreground">Final Audio Generation</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Generate the final combined audio file from all processed chunks
            </p>
          </div>

          <div className="space-y-6">
            {/* Generate Button */}
            <div className="flex justify-start">
              <Button
                onClick={handleGenerateAudio}
                disabled={isGeneratingAudio}
                className="flex items-center gap-2"
                size="lg"
              >
                <Download className="h-4 w-4" />
                {isGeneratingAudio ? "Generating..." : "Generate Audio"}
              </Button>
            </div>
            
            {/* Generated Audio Section */}
            {generatedAudioUrl && (
              <div className="space-y-4">
                {/* Audio Player - Full width */}
                <div className="bg-muted/30 rounded-lg p-6">
                  <h4 className="font-medium text-foreground mb-4">Generated Audio</h4>
                  <audio 
                    controls 
                    className="w-full h-12"
                    src={generatedAudioUrl}
                  >
                  Your browser does not support the audio element.
                </audio>
              </div>
                
                {/* Download Link */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Download:</span>
                  <a 
                    href={generatedAudioUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80 underline font-medium"
                  >
                    Download Audio File
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}