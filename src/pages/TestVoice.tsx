import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Play,
  Pause,
  Volume2,
  Download,
  Sparkles,
  Loader2,
  ChevronDown,
  ArrowLeft,
  Upload,
  FileText,
  Copy,
  Check,
  Eye,
  X,
  Users,
  Mic,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

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

export default function TestVoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  // Original states
  const [inputText, setInputText] = useState("");
  const [voiceStyle, setVoiceStyle] = useState("Narrator Deep");
  const [mood, setMood] = useState("Tense");
  const [generating, setGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(70);
  const [apiKey, setApiKey] = useState("sk_d166b9980919a408b73eede7ad7cc1b65f892ee39307c7cf");
  const [voiceId, setVoiceId] = useState(ELEVENLABS_VOICES[0].id);
  
  // PDF extraction states
  const [pdfUploading, setPdfUploading] = useState(false);
  const [extractedText, setExtractedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);

  // New multi-voice states
  const [scriptText, setScriptText] = useState("");
  const [parsedScript, setParsedScript] = useState<ParsedScript>({ scenes: [], characters: [], totalLines: 0 });
  const [characterVoices, setCharacterVoices] = useState<Character[]>([]);
  const [multiVoiceGenerating, setMultiVoiceGenerating] = useState(false);
  const [multiVoiceAudioUrl, setMultiVoiceAudioUrl] = useState<string | null>(null);
  const [audioSegments, setAudioSegments] = useState<AudioSegment[]>([]);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [showMultiVoicePlayer, setShowMultiVoicePlayer] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const pdfFileInputRef = useRef<HTMLInputElement>(null);

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

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = `generated-audio-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateAudio = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key required",
        description: "Please enter your ElevenLabs API key.",
        variant: "destructive",
      });
      return;
    }
    if (!inputText.trim()) {
      toast({
        title: "No text provided",
        description: "Please enter some text to generate audio",
        variant: "destructive",
      });
      return;
    }
    setGenerating(true);
    setAudioUrl(null);
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: inputText,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
            },
          }),
        }
      );
      if (!response.ok) throw new Error("Failed to generate audio");
      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
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

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1]; // Remove data URL prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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

    setPdfUploading(true);
    
    try {
      // Store the file for preview
      setUploadedFile(file);
      
      // Convert file to base64
      const base64 = await readFileAsBase64(file);
      
      // Call the API for text extraction
      const response = await fetch(
        "https://pdfparser.fitbody90.com/api/v1/resume/generate",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json",
            "ngrok-skip-browser-warning": "true",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Origin": window.location.origin,
            "Referer": window.location.href,
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          },
          body: JSON.stringify({
            isBase64: true,
            baseResumeText: base64,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("API call failed");
      }

      const data = await response.json();
      const extractedText = data.resumes[0].extractedText;
      
      setExtractedText(extractedText);
      setUploadedFileName(file.name);
      
      // Also set the script text for multi-voice processing
      setScriptText(extractedText);
      
      toast({
        title: "File processed successfully!",
        description: `Text extracted from ${file.name} and added to script input.`,
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "File processing failed",
        description: "Could not process the uploaded file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setPdfUploading(false);
    }
  };

  const triggerPdfUpload = () => {
    pdfFileInputRef.current?.click();
  };

  const copyExtractedText = async () => {
    try {
      await navigator.clipboard.writeText(extractedText);
      setCopied(true);
      toast({
        title: "Text copied!",
        description: "Extracted text has been copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Copy failed",
        description: "Could not copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const openPdfPreview = () => {
    setShowPdfModal(true);
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

          <h1 className="text-3xl font-bold">Voice Generation Test</h1>
          <p className="text-muted-foreground">
            Generate multi-character audio from scripts with different voices
          </p>
        </div>

        {/* Multi-Voice Script Processing Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Users className="h-6 w-6" />
            Multi-Character Voice Generation
          </h2>
          
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
                <div className="space-y-4">
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

        {/* Original Single Voice Section */}
        <div className="border-t pt-8">
          <h2 className="text-2xl font-bold mb-4">Single Voice Generation</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* PDF Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  PDF Text Extraction
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    ref={pdfFileInputRef}
                    type="file"
                    accept=".txt,.pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                    disabled={pdfUploading}
                  />
                  <div 
                    className="cursor-pointer block"
                    onClick={triggerPdfUpload}
                  >
                    {pdfUploading ? (
                      <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                    ) : (
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    )}
                    <p className="text-lg font-medium mb-2">
                      {pdfUploading ? "Processing..." : "Upload PDF/TXT"}
                    </p>
                    <p className="text-muted-foreground">
                      Extract text from PDF or TXT files
                    </p>
                  </div>
                </div>

                {uploadedFileName && (
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <p className="text-sm font-medium">File: {uploadedFileName}</p>
                  </div>
                )}

                {extractedText && (
                  <div className="space-y-3">
                    <div className="bg-muted/30 rounded-lg p-4 border">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Extracted Text Preview
                      </h4>
                      <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                        {extractedText.length > 200 
                          ? extractedText.substring(0, 200) + "..."
                          : extractedText
                        }
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {extractedText.length} characters extracted
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-2">
                      <Button
                        onClick={copyExtractedText}
                        variant="outline"
                        className="w-full gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="h-4 w-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            Copy Extracted Text
                          </>
                        )}
                      </Button>
                      
                      {uploadedFile && uploadedFile.type === "application/pdf" && (
                        <Button
                          onClick={openPdfPreview}
                          variant="outline"
                          className="w-full gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Preview PDF
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Text Input */}
            <Card>
              <CardHeader>
                <CardTitle>Text Input</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Enter your text (max 800 characters)
                  </label>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste your script or text here..."
                    className="min-h-[200px]"
                    maxLength={800}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {inputText.length}/800 characters
                  </p>
                </div>

                {/* Voice Dropdown */}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Voice
                  </label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={voiceId}
                    onChange={e => setVoiceId(e.target.value)}
                  >
                    {ELEVENLABS_VOICES.map(v => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={generateAudio}
                  disabled={generating || !inputText.trim() || !apiKey.trim()}
                  className="w-full gap-2"
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
              </CardContent>
            </Card>

            {/* Audio Player */}
            <Card>
              <CardHeader>
                <CardTitle>Audio Player</CardTitle>
              </CardHeader>
              <CardContent>
                {audioUrl ? (
                  <div className="space-y-6">
                    <audio ref={audioRef} src={audioUrl} preload="metadata" />

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
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                    <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="font-medium mb-2">No audio generated yet</p>
                    <p className="text-sm text-muted-foreground">
                      Enter text and click "Generate Audio" to create your audio file
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* PDF Preview Modal */}
        <Dialog open={showPdfModal} onOpenChange={setShowPdfModal}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>PDF Preview: {uploadedFileName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPdfModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 h-[60vh] overflow-hidden">
              {uploadedFile && (
                <iframe
                  src={URL.createObjectURL(uploadedFile)}
                  className="w-full h-full border rounded"
                  title="PDF Preview"
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 