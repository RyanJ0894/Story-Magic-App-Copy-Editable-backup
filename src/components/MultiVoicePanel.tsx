import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Volume2,
  Download,
  Mic,
  FileText,
  Save,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ScriptParser, ParsedScript, Character } from "@/lib/scriptParser";
import { MultiVoiceGenerator, AudioSegment, GenerationProgress } from "@/lib/multiVoiceGenerator";
import CharacterVoiceAssignment from "@/components/CharacterVoiceAssignment";
import ScriptPreview from "@/components/ScriptPreview";

interface MultiVoicePanelProps {
  scriptText?: string;
  defaultApiKey?: string;
  allowScriptEdit?: boolean;
  projectId?: string;
  onScriptChange?: (scriptText: string) => void;
}

export default function MultiVoicePanel({ 
  scriptText: initialScriptText = "", 
  defaultApiKey = "sk_d166b9980919a408b73eede7ad7cc1b65f892ee39307c7cf",
  allowScriptEdit = true,
  projectId,
  onScriptChange
}: MultiVoicePanelProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [scriptText, setScriptText] = useState(initialScriptText);
  const [parsedScript, setParsedScript] = useState<ParsedScript>({ scenes: [], characters: [], totalLines: 0 });
  const [characterVoices, setCharacterVoices] = useState<Character[]>([]);
  const [multiVoiceGenerating, setMultiVoiceGenerating] = useState(false);
  const [multiVoiceAudioUrl, setMultiVoiceAudioUrl] = useState<string | null>(null);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [showMultiVoicePlayer, setShowMultiVoicePlayer] = useState(false);
  const [apiKey, setApiKey] = useState(defaultApiKey);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Load saved data when component mounts
  useEffect(() => {
    if (projectId && user) {
      loadSavedData();
    }
  }, [projectId, user]);

  // Update scriptText when initialScriptText changes (e.g., when project script loads)
  useEffect(() => {
    if (initialScriptText && !scriptText) {
      setScriptText(initialScriptText);
    }
  }, [initialScriptText, scriptText]);

  const loadSavedData = async () => {
    if (!projectId || !user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('multi_voice_data')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error loading saved data:', error);
        return;
      }

      if (data) {
        setScriptText(data.script_text || '');
        setCharacterVoices(data.character_voices || []);
        if (data.audio_url) {
          setMultiVoiceAudioUrl(data.audio_url);
          setShowMultiVoicePlayer(true);
        }
        toast({
          title: "Saved data loaded",
          description: "Your previous multi-voice data has been restored",
        });
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveToSupabase = async () => {
    if (!projectId || !user) {
      toast({
        title: "Cannot save",
        description: "Project ID or user not available",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Save audio file to Supabase storage if we have generated audio
      let audioUrl = multiVoiceAudioUrl;
      if (multiVoiceAudioUrl && multiVoiceAudioUrl.startsWith('blob:')) {
        // Convert blob URL to actual blob and upload
        const response = await fetch(multiVoiceAudioUrl);
        const audioBlob = await response.blob();
        
        const fileName = `${user.id}/${projectId}/multi-voice-audio-${Date.now()}.wav`;
        const { error: uploadError } = await supabase.storage
          .from('user-files')
          .upload(fileName, audioBlob, {
            upsert: true,
          });

        if (uploadError) {
          throw uploadError;
        }

        const { data: urlData } = supabase.storage
          .from('user-files')
          .getPublicUrl(fileName);
        
        audioUrl = urlData.publicUrl;
      }

      // Save data to multi_voice_data table
      const { error } = await supabase
        .from('multi_voice_data')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          script_text: scriptText,
          character_voices: characterVoices,
          audio_url: audioUrl,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'project_id,user_id'
        });

      if (error) {
        throw error;
      }

      // Update the audio URL if we uploaded a new file
      if (audioUrl && audioUrl !== multiVoiceAudioUrl) {
        setMultiVoiceAudioUrl(audioUrl);
      }

      toast({
        title: "Data saved successfully!",
        description: "Your script and audio have been saved to the cloud",
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast({
        title: "Save failed",
        description: "Failed to save data to the cloud",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (scriptText.trim()) {
      try {
        const parsed = ScriptParser.parseScript(scriptText);
        setParsedScript(parsed);
        if (parsed.characters.length > 0) {
          const defaultVoices = ScriptParser.assignDefaultVoices(parsed.characters);
          setCharacterVoices(defaultVoices);
        }
      } catch (error) {
        console.error("Error parsing script:", error);
        toast({
          title: "Script parsing failed",
          description: "Could not parse the script. Please check the format.",
          variant: "destructive",
        });
      }
    } else {
      setParsedScript({ scenes: [], characters: [], totalLines: 0 });
      setCharacterVoices([]);
    }
  }, [scriptText, toast]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleEnded = () => setIsPlaying(false);
    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("ended", handleEnded);
    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = value[0];
  };

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = value[0] / 100;
    setVolume(value[0]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVoiceChange = (characterName: string, voiceId: string, voiceName: string) => {
    setCharacterVoices(prev => {
      const existing = prev.find(cv => cv.name === characterName);
      if (existing) {
        return prev.map(cv => 
          cv.name === characterName 
            ? { ...cv, voiceId, voiceName }
            : cv
        );
      } else {
        return [...prev, { name: characterName, voiceId, voiceName }];
      }
    });
  };

  const handleAssignAllVoices = () => {
    if (parsedScript.characters.length > 0) {
      const defaultVoices = ScriptParser.assignDefaultVoices(parsedScript.characters);
      setCharacterVoices(defaultVoices);
      toast({
        title: "Voices assigned!",
        description: `Assigned voices to ${parsedScript.characters.length} characters`,
      });
    }
  };

  const generateMultiVoiceAudio = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your ElevenLabs API key.",
        variant: "destructive",
      });
      return;
    }
    if (parsedScript.totalLines === 0) {
      toast({
        title: "No script content",
        description: "Please provide a script with dialogue to generate audio.",
        variant: "destructive",
      });
      return;
    }
    if (characterVoices.length === 0) {
      toast({
        title: "No voices assigned",
        description: "Please assign voices to characters first.",
        variant: "destructive",
      });
      return;
    }
    setMultiVoiceGenerating(true);
    setMultiVoiceAudioUrl(null);
    setAudioSegments([]);
    setGenerationProgress(null);
    try {
      const generator = new MultiVoiceGenerator(apiKey, (progress) => {
        setGenerationProgress(progress);
      });
      const result = await generator.generateMultiVoiceAudio(parsedScript, characterVoices);
      setMultiVoiceAudioUrl(result.audioUrl);
      setAudioSegments(result.segments);
      setShowMultiVoicePlayer(true);
      toast({
        title: "Multi-voice audio generated!",
        description: `Generated audio for ${result.segments.length} dialogue lines`,
      });
    } catch (error) {
      console.error("Error generating multi-voice audio:", error);
      toast({
        title: "Generation failed",
        description: "Failed to generate multi-voice audio",
        variant: "destructive",
      });
    } finally {
      setMultiVoiceGenerating(false);
      setGenerationProgress(null);
    }
  };

  const downloadMultiVoiceAudio = () => {
    if (!multiVoiceAudioUrl) return;
    MultiVoiceGenerator.downloadAudio(multiVoiceAudioUrl, `multi-voice-script-${Date.now()}.wav`);
  };

  return (
    <div className="my-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Multi-Character Voice Generation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* API Key Input */}
          <div className="mb-4">
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your ElevenLabs API key here"
              className="w-full max-w-md"
            />
          </div>

          {/* Script Input (if allowed) */}
          {allowScriptEdit && (
            <div className="mb-6">
              <label className="text-sm font-medium mb-2 block">
                Script Input
              </label>
              <Textarea
                value={scriptText}
                onChange={(e) => {
                  setScriptText(e.target.value);
                  onScriptChange?.(e.target.value);
                }}
                placeholder="Paste your script with character names in ALL CAPS and dialogue below..."
                className="min-h-[200px]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {scriptText.length} characters
              </p>
            </div>
          )}

          {/* Save Button */}
          {projectId && (
            <div className="mb-4">
              <Button
                onClick={saveToSupabase}
                disabled={saving || loading}
                variant="outline"
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save to Cloud
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Character Voice Assignment */}
          {parsedScript.characters.length > 0 && (
            <CharacterVoiceAssignment
              characters={parsedScript.characters}
              characterVoices={characterVoices}
              onVoiceChange={handleVoiceChange}
              onAssignAll={handleAssignAllVoices}
            />
          )}

          {/* Script Preview */}
          {parsedScript.scenes.length > 0 && (
            <div className="mt-8">
              <ScriptPreview
                parsedScript={parsedScript}
                onGenerateAudio={generateMultiVoiceAudio}
                generating={multiVoiceGenerating}
              />
            </div>
          )}

          {/* Generation Progress */}
          {multiVoiceGenerating && generationProgress && (
            <Card className="mt-4">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Generating audio for {generationProgress.character}...
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {generationProgress.current} / {generationProgress.total}
                    </span>
                  </div>
                  <Progress 
                    value={(generationProgress.current / generationProgress.total) * 100} 
                    className="w-full" 
                  />
                  <p className="text-sm text-muted-foreground">
                    "{generationProgress.text}"
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Multi-Voice Audio Player */}
          {showMultiVoicePlayer && multiVoiceAudioUrl && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Multi-Voice Audio Player
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <audio ref={audioRef} src={multiVoiceAudioUrl} preload="metadata" />
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
                  <Button
                    onClick={downloadMultiVoiceAudio}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Multi-Voice Audio
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 