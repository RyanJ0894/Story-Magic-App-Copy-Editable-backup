import { Button } from "@/components/ui/button";
import { Play, Upload, Mic } from "lucide-react";
import heroImage from "@/assets/hero-cinema.jpg";

export const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-dark/90 via-cinema-dark/70 to-transparent" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-cinema-surface/50 backdrop-blur-sm px-4 py-2 text-sm text-cinema-gold border border-cinema-gold/20">
          <Mic className="h-4 w-4" />
          Powered by AI Film Director
        </div>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Transform Scripts into
          <span className="block bg-gradient-accent bg-clip-text text-transparent">
            Cinematic Audio
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
          Upload your screenplay and hear it come alive with realistic AI voices, 
          ambient soundscapes, and cinematic music. Before it's ever filmed.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button variant="cinema" size="lg" className="text-lg px-8 py-6">
            <Upload className="h-5 w-5" />
            Upload Your Script
          </Button>
          <Button variant="cinema-outline" size="lg" className="text-lg px-8 py-6">
            <Play className="h-5 w-5" />
            Try Demo Script
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="p-6 rounded-lg bg-cinema-surface/30 backdrop-blur-sm border border-border">
            <div className="w-12 h-12 bg-cinema-gold/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Upload className="h-6 w-6 text-cinema-gold" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Upload Script</h3>
            <p className="text-muted-foreground">PDF or Final Draft format supported</p>
          </div>
          
          <div className="p-6 rounded-lg bg-cinema-surface/30 backdrop-blur-sm border border-border">
            <div className="w-12 h-12 bg-cinema-blue/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Mic className="h-6 w-6 text-cinema-blue" />
            </div>
            <h3 className="text-lg font-semibold mb-2">AI Voice Casting</h3>
            <p className="text-muted-foreground">Unique voices for every character</p>
          </div>
          
          <div className="p-6 rounded-lg bg-cinema-surface/30 backdrop-blur-sm border border-border">
            <div className="w-12 h-12 bg-cinema-gold/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Play className="h-6 w-6 text-cinema-gold" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Immersive Audio</h3>
            <p className="text-muted-foreground">Cinematic soundscapes & music</p>
          </div>
        </div>
      </div>
    </section>
  );
};