import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Play, Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const ScriptUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedScript, setUploadedScript] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>("");
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setIsUploading(true);
    
    try {
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
      
      setUploadedScript(file.name);
      setExtractedText(extractedText);
      
      // Auto-populate the script input with extracted text
      // This will be used by the parent component to update the script input
      if (extractedText && extractedText.trim()) {
        // Trigger a custom event to notify parent components
        const event = new CustomEvent('scriptExtracted', { 
          detail: { text: extractedText, fileName: file.name } 
        });
        window.dispatchEvent(event);
      }
      
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
      setIsUploading(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleDemoScript = () => {
    setUploadedScript("The Coffee Shop (Demo Script)");
    setExtractedText(`FADE IN:

INT. COFFEE SHOP - DAY

A cozy, independent coffee shop. The aroma of freshly ground beans fills the air. SARAH (25), a barista with a warm smile, works behind the counter.

JAMES (30), a regular customer, enters. He looks tired but determined.

JAMES
(approaching the counter)
The usual, please.

SARAH
(grinning)
Coming right up, James. Rough day?

JAMES
You could say that. But this place always helps.

Sarah begins preparing his coffee with practiced movements.

SARAH
That's what we're here for. A little comfort in a cup.

James watches her work, a small smile forming on his face.

JAMES
You know, I've been coming here for months, and I've never asked...

SARAH
(raising an eyebrow)
Asked what?

JAMES
What's your story? How did you end up here?

Sarah pauses, considering the question.

SARAH
Well, that's a long story. But I guess it starts with a love of coffee and a desire to create moments like this.

She hands him his coffee with a smile.

SARAH
There you go. One perfect cup of comfort.

James takes the coffee, their fingers briefly touching.

JAMES
Thank you. For the coffee, and for asking.

SARAH
Anytime. See you tomorrow?

JAMES
(smiling)
Count on it.

James leaves, taking a sip of his coffee. Sarah watches him go, a thoughtful expression on her face.

FADE OUT.`);
    toast({
      title: "Demo script loaded!",
      description: "Experience Story Magic with our sample screenplay.",
    });
  };

  const handleProcess = () => {
    toast({
      title: "AI Film Director activated!",
      description: "Processing your script for cinematic audio experience...",
    });
  };

  return (
    <section id="demo" className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Experience the
            <span className="block bg-gradient-accent bg-clip-text text-transparent">
              Magic in Action
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Upload your screenplay or try our demo script to see how Story Magic transforms 
            written words into immersive audio experiences.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="bg-gradient-card border-border shadow-cinematic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cinema-gold" />
                AI Film Director Studio
              </CardTitle>
              <CardDescription>
                Upload your script or try our demo to begin the transformation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!uploadedScript ? (
                <>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-cinema-gold/50 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".txt,.pdf,.fdx"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isUploading}
                    />
                    <div 
                      className="cursor-pointer block"
                      onClick={triggerFileUpload}
                    >
                      {isUploading ? (
                        <Loader2 className="h-12 w-12 text-muted-foreground mx-auto mb-4 animate-spin" />
                      ) : (
                        <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      )}
                      <p className="text-lg font-medium mb-2">
                        {isUploading ? "Processing..." : "Drop your script here"}
                      </p>
                      <p className="text-muted-foreground">
                        Supports text (.txt), PDF, and Final Draft (.fdx) files
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <Button 
                    variant="cinema-outline" 
                    onClick={handleDemoScript}
                    className="w-full"
                    size="lg"
                  >
                    <Play className="h-5 w-5" />
                    Try Demo Script
                  </Button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-cinema-surface rounded-lg border border-cinema-gold/20">
                    <FileText className="h-8 w-8 text-cinema-gold" />
                    <div className="flex-1">
                      <h3 className="font-medium">{uploadedScript}</h3>
                      <p className="text-sm text-muted-foreground">Ready for processing</p>
                    </div>
                  </div>

                  {/* Show extracted text if available */}
                  {extractedText && (
                    <div className="bg-muted/30 rounded-lg p-4 border">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Extracted Content Preview
                      </h4>
                      <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                        {extractedText.length > 300 
                          ? extractedText.substring(0, 300) + "..."
                          : extractedText
                        }
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {extractedText.length} characters extracted
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="cinema-outline" onClick={() => {
                      setUploadedScript(null);
                      setExtractedText("");
                    }}>
                      Upload Different Script
                    </Button>
                    <Button variant="cinema" onClick={handleProcess}>
                      <Sparkles className="h-4 w-4" />
                      Start AI Processing
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};