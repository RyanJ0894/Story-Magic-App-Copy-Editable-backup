import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Play,
  Pause,
  Volume2,
  Download,
  Sparkles,
  Loader2,
  ArrowLeft,
  Upload,
  FileText,
  Copy,
  Check,
  Users,
  Mic,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// Import our new components and utilities
import { ScriptParser, ParsedScript, Character } from "@/lib/scriptParser";
import { MultiVoiceGenerator, AudioSegment, GenerationProgress } from "@/lib/multiVoiceGenerator";
import CharacterVoiceAssignment from "@/components/CharacterVoiceAssignment";
import ScriptPreview from "@/components/ScriptPreview";

const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Female, English)" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Adam (Male, English)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Female, English)" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Male, English)" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli (Female, English)" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh (Male, English)" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold (Male, English)" },
];

export default function MultiVoiceTest() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Multi-voice states
  const [scriptText, setScriptText] = useState("");
  const [parsedScript, setParsedScript] = useState<ParsedScript>({ scenes: [], characters: [], totalLines: 0 });
  const [characterVoices, setCharacterVoices] = useState<Character[]>([]);
  const [multiVoiceGenerating, setMultiVoiceGenerating] = useState(false);
  const [multiVoiceAudioUrl, setMultiVoiceAudioUrl] = useState<string | null>(null);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [showMultiVoicePlayer, setShowMultiVoicePlayer] = useState(false);
  const [apiKey, setApiKey] = useState("sk_d166b9980919a408b73eede7ad7cc1b65f892ee39307c7cf");

  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);

  const audioRef = useRef<HTMLAudioElement>(null);

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

  // Parse script when script text changes
  useEffect(() => {
    if (scriptText.trim()) {
      try {
        const parsed = ScriptParser.parseScript(scriptText);
        setParsedScript(parsed);
        
        // Auto-assign voices to new characters
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

  // Multi-voice generation functions
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
    MultiVoiceGenerator.downloadAudio(multiVoiceAudioUrl, `multi-voice-script-${Date.now()}.mp3`);
  };

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

          <h1 className="text-3xl font-bold">Multi-Character Voice Generation</h1>
          <p className="text-muted-foreground">
            Generate audio from scripts with different voices for each character
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Script Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Script Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Paste your script here
                </label>
                <Textarea
                  value={scriptText}
                  onChange={(e) => setScriptText(e.target.value)}
                  placeholder="Paste your script with character names in ALL CAPS and dialogue below..."
                  className="min-h-[300px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {scriptText.length} characters
                </p>
              </div>

              {/* API Key Input */}
              <div>
                <label className="text-sm font-medium mb-2 block">
                  ElevenLabs API Key
                </label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your ElevenLabs API key here"
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Character Voice Assignment */}
          {parsedScript.characters.length > 0 && (
            <CharacterVoiceAssignment
              characters={parsedScript.characters}
              characterVoices={characterVoices}
              onVoiceChange={handleVoiceChange}
              onAssignAll={handleAssignAllVoices}
            />
          )}
        </div>

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
      </div>
    </div>
  );
} 