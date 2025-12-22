import { Button } from "@/components/ui/button";
import { Play, Upload, Mic } from "lucide-react";
import heroImage from "@/assets/hero-cinema.jpg";
import { Link } from "react-router-dom";
import { useMemo } from "react";

export const HeroSection = () => {
  const shimmerParticles = useMemo(() => {
    const positions = [
      { x: 7, y: 11 },
      { x: 49, y: 17 },
      { x: 93, y: 11 },
      { x: 25, y: 31 },
      { x: 20, y: 47 },
      { x: 25, y: 63 },
      { x: 81, y: 27 },
      { x: 86, y: 43 },
      { x: 82, y: 58 },
      { x: 86, y: 74 },
      { x: 91, y: 90 },
    ];
    
    return positions.map((pos, i) => ({
      id: i,
      x: pos.x,
      y: pos.y,
      delay: (i * 0.4) % 3,
      duration: 1.5 + (i % 4) * 0.5,
      opacity: 0.5 + (i % 4) * 0.1,
    }));
  }, []);

  return <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url(${heroImage})`
    }}>
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-dark/90 via-cinema-dark/70 to-transparent" />
      </div>
      
      {/* Magical star shimmer particles - attached to hero section */}
      {shimmerParticles.map((particle) => (
        <div
          key={particle.id}
          className="absolute pointer-events-none z-20 animate-pulse"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        >
          <div 
            className="relative"
            style={{
              width: '6px',
              height: '6px',
            }}
          >
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
      
      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center max-w-4xl">
        <div className="mb-6 mt-8 md:mt-0 inline-flex items-center gap-2 rounded-full bg-cinema-surface/50 backdrop-blur-sm px-4 py-2 text-sm text-cinema-blue border border-cinema-gold/20 mx-[8px]">
          <Mic className="h-4 w-4" />
          Powered by Our AI Director
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
          <Link to="/signin">
            <Button variant="cinema" size="lg" className="text-lg px-8 py-6">
              <Upload className="h-5 w-5" />
              Upload Your Script
            </Button>
          </Link>
          <Link to="/signin">
            <Button variant="cinema-outline" size="lg" className="text-lg px-8 py-6">
              <Play className="h-5 w-5" />
              Try Demo Script
            </Button>
          </Link>
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
    </section>;
};