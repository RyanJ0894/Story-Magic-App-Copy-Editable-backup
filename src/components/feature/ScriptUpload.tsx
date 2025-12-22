import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Play, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

export const ScriptUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedScript, setUploadedScript] = useState<string | null>(null);
  const { toast } = useToast();

  const shimmerParticles = useMemo(() => {
    const positions = [
      { x: 4, y: 8 },
      { x: 96, y: 12 },
      { x: 3, y: 35 },
      { x: 97, y: 42 },
      { x: 5, y: 65 },
      { x: 95, y: 58 },
      { x: 4, y: 85 },
      { x: 96, y: 78 },
    ];
    
    return positions.map((pos, i) => ({
      id: i,
      x: pos.x,
      y: pos.y,
      delay: (i * 0.5) % 3,
      duration: 1.5 + (i % 4) * 0.5,
      opacity: 0.5 + (i % 4) * 0.1,
    }));
  }, []);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Simulate upload process
      setTimeout(() => {
        setUploadedScript(file.name);
        setIsUploading(false);
        toast({
          title: "Script uploaded successfully!",
          description: "Your screenplay is ready for AI processing.",
        });
      }, 2000);
    }
  };

  const handleDemoScript = () => {
    setUploadedScript("The Coffee Shop (Demo Script)");
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
    <section id="demo" className="py-8 md:py-20 bg-gradient-hero relative overflow-hidden">
      {/* Magical star shimmer particles */}
      {shimmerParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none z-10 animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          <div className="relative" style={{ width: '6px', height: '6px' }}>
            <div 
              className="absolute bg-white"
              style={{
                width: '6px',
                height: '1.5px',
                top: '50%',
                left: '0',
                transform: 'translateY(-50%)',
                opacity: particle.opacity + 0.3,
                boxShadow: '0 0 4px 1px rgba(255, 255, 255, 0.8)',
              }}
            />
            <div 
              className="absolute bg-white"
              style={{
                width: '1.5px',
                height: '6px',
                left: '50%',
                top: '0',
                transform: 'translateX(-50%)',
                opacity: particle.opacity + 0.3,
                boxShadow: '0 0 4px 1px rgba(255, 255, 255, 0.8)',
              }}
            />
            <div 
              className="absolute rounded-full bg-white"
              style={{
                width: '3px',
                height: '3px',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                opacity: particle.opacity + 0.4,
                boxShadow: '0 0 8px 3px rgba(255, 255, 255, 0.9), 0 0 12px 5px rgba(200, 220, 255, 0.5)',
              }}
            />
          </div>
        </div>
      ))}

      <div className="container mx-auto px-4 relative z-20">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
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
                      type="file"
                      accept=".pdf,.fdx,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="script-upload"
                      disabled={isUploading}
                    />
                    <label 
                      htmlFor="script-upload" 
                      className="cursor-pointer block"
                    >
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-lg font-medium mb-2">
                        {isUploading ? "Uploading..." : "Drop your script here"}
                      </p>
                      <p className="text-muted-foreground">
                        Supports PDF, Final Draft (.fdx), and text files
                      </p>
                    </label>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <Link to="/signin">
                    <Button 
                      variant="cinema-outline" 
                      className="w-full"
                      size="lg"
                    >
                      <Play className="h-5 w-5" />
                      Try Demo Script
                    </Button>
                  </Link>
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="cinema-outline" onClick={() => setUploadedScript(null)}>
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