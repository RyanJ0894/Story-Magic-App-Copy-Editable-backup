import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Play, RotateCcw, Crown } from "lucide-react";

interface Character {
  id: string;
  name: string;
  role: string;
  voiceType: string;
  age: string;
  personality: string;
  avatar: string;
}

const demoCharacters: Character[] = [
  {
    id: "1",
    name: "SARAH",
    role: "Lead",
    voiceType: "Confident Female",
    age: "28-35",
    personality: "Determined entrepreneur",
    avatar: "S"
  },
  {
    id: "2", 
    name: "MARCUS",
    role: "Supporting",
    voiceType: "Warm Male",
    age: "45-50",
    personality: "Wise mentor figure",
    avatar: "M"
  },
  {
    id: "3",
    name: "ELENA",
    role: "Supporting",
    voiceType: "Energetic Female",
    age: "22-28",
    personality: "Tech-savvy assistant",
    avatar: "E"
  },
  {
    id: "4",
    name: "NARRATOR",
    role: "Narrator",
    voiceType: "Cinematic Male",
    age: "40-45",
    personality: "Deep, authoritative",
    avatar: "N"
  }
];

export const VoiceCasting = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRegenerateVoice = (characterId: string) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            AI Voice
            <span className="block bg-gradient-accent bg-clip-text text-transparent">
              Casting Director
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Our AI Film Director automatically assigns unique, emotionally-tuned voices 
            to each character based on their personality and role in your story.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-card border-border shadow-cinematic">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-cinema-gold" />
                Voice Cast Assignment
              </CardTitle>
              <CardDescription>
                AI-generated voice profiles for "The Coffee Shop" demo script
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {demoCharacters.map((character) => (
                  <div 
                    key={character.id}
                    className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedCharacter === character.id 
                        ? 'border-cinema-gold bg-cinema-gold/10' 
                        : 'border-border hover:border-cinema-gold/50 hover:bg-cinema-surface/50'
                    }`}
                    onClick={() => setSelectedCharacter(character.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={character.avatar} />
                          <AvatarFallback className="bg-cinema-surface text-cinema-gold font-bold">
                            {character.avatar}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{character.name}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {character.role}
                            </Badge>
                            {character.name === "NARRATOR" && (
                              <Crown className="h-4 w-4 text-cinema-gold" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {character.personality} • {character.age}
                          </p>
                          <Badge variant="outline" className="text-xs">
                            {character.voiceType}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerateVoice(character.id);
                          }}
                          disabled={isProcessing}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Regenerate
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Play className="h-4 w-4" />
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-cinema-surface/30 rounded-lg border border-cinema-gold/20">
                <h4 className="font-medium mb-2 text-cinema-gold">
                  Voice Marketplace Coming Soon
                </h4>
                <p className="text-sm text-muted-foreground">
                  Access licensed SAG actor voices and celebrity AI voices for professional productions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};