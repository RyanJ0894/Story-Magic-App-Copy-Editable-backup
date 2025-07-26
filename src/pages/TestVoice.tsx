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

const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Female, English)" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Adam (Male, English)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Female, English)" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Male, English)" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli (Female, English)" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh (Male, English)" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold (Male, English, celebrity)" },
];

export default function TestVoice() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

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
        "https://dc6121d4ef24.ngrok-free.app/api/v1/resume/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      
      toast({
        title: "File processed successfully!",
        description: `Text extracted from ${file.name}`,
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
            Paste your text and generate audio with different voices and moods
          </p>
        </div>

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