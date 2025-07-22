import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Download,
  Headphones,
  BarChart3,
  Music
} from "lucide-react";

interface Scene {
  id: string;
  title: string;
  duration: string;
  description: string;
  mood: string;
  characters: string[];
}

const demoScenes: Scene[] = [
  {
    id: "1",
    title: "INT. COFFEE SHOP - MORNING",
    duration: "2:15",
    description: "Sarah enters the bustling coffee shop, determination in her eyes",
    mood: "Hopeful",
    characters: ["SARAH", "BARISTA"]
  },
  {
    id: "2", 
    title: "SARAH'S INNER MONOLOGUE",
    duration: "1:30",
    description: "Narrator reveals Sarah's entrepreneurial dreams and fears",
    mood: "Contemplative",
    characters: ["NARRATOR"]
  },
  {
    id: "3",
    title: "CHANCE ENCOUNTER",
    duration: "3:45",
    description: "Sarah meets Marcus, a potential mentor and game-changer",
    mood: "Intriguing",
    characters: ["SARAH", "MARCUS"]
  }
];

export const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(450); // 7:30 total
  const [volume, setVolume] = useState([75]);
  const [currentScene, setCurrentScene] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= duration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, duration]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  return (
    <section className="py-20 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Immersive Audio
            <span className="block bg-gradient-accent bg-clip-text text-transparent">
              Experience
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Listen to your screenplay transformed into a cinematic audio experience 
            with multi-voice performances, ambient soundscapes, and adaptive music.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Main Player */}
          <Card className="bg-gradient-card border-border shadow-cinematic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-cinema-gold" />
                "The Coffee Shop" - Cinematic Audio
              </CardTitle>
              <CardDescription>
                Full production with AI voices, ambient audio, and adaptive music
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <Slider
                  value={[currentTime]}
                  max={duration}
                  step={1}
                  onValueChange={handleSeek}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <Button variant="ghost" size="icon">
                  <SkipBack className="h-5 w-5" />
                </Button>
                <Button 
                  variant="cinema" 
                  size="icon" 
                  className="h-12 w-12"
                  onClick={togglePlay}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                <Button variant="ghost" size="icon">
                  <SkipForward className="h-5 w-5" />
                </Button>
              </div>

              {/* Volume & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1">
                  <Volume2 className="h-4 w-4 text-muted-foreground" />
                  <Slider
                    value={volume}
                    max={100}
                    step={1}
                    onValueChange={setVolume}
                    className="w-32"
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="h-4 w-4" />
                    Visualizer
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Music className="h-4 w-4" />
                    Music Mix
                  </Button>
                  <Button variant="cinema-outline" size="sm">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scene Breakdown */}
          <Card className="bg-gradient-card border-border shadow-cinematic">
            <CardHeader>
              <CardTitle>Scene Breakdown</CardTitle>
              <CardDescription>
                Navigate through individual scenes and performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demoScenes.map((scene, index) => (
                  <div 
                    key={scene.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      currentScene === index
                        ? 'border-cinema-gold bg-cinema-gold/10'
                        : 'border-border hover:border-cinema-gold/50 hover:bg-cinema-surface/50'
                    }`}
                    onClick={() => setCurrentScene(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{scene.title}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {scene.duration}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {scene.mood}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {scene.description}
                        </p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Characters:</span>
                          {scene.characters.map((character) => (
                            <Badge key={character} variant="outline" className="text-xs">
                              {character}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};