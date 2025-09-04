import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Play, RotateCcw, Crown, Pause } from "lucide-react";
import { useElevenLabsVoices, type ElevenLabsVoice } from "@/hooks/useElevenLabsVoices";

interface CharacterVoice {
  id: string;
  name: string;
  role: string;
  age: string;
  personality: string;
  avatar: string;
  voiceId: string;
  elevenlabsVoice?: ElevenLabsVoice;
}

const characterRoles = [
  {
    id: "1",
    name: "STACY",
    role: "Lead",
    age: "28-35",
    personality: "Determined entrepreneur",
    avatar: "S"
  },
  {
    id: "2", 
    name: "PLACEHOLDER_MALE",
    role: "Supporting",
    age: "28-35",
    personality: "Tech-savvy assistant",
    avatar: "M"
  },
  {
    id: "3",
    name: "CODY MCAVOY",
    role: "Supporting",
    age: "28-38",
    personality: "Deep, calm",
    avatar: "C"
  },
  {
    id: "4",
    name: "PLACEHOLDER_NARRATOR",
    role: "Narrator",
    age: "40-45",
    personality: "Deep, authoritative",
    avatar: "N"
  }
];

export const VoiceCasting = () => {
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [charactersWithVoices, setCharactersWithVoices] = useState<CharacterVoice[]>([]);
  
  const { voices, loading: voicesLoading } = useElevenLabsVoices();

  // Create characters using actual user voices with specific assignments
  useEffect(() => {
    if (voices.length > 0) {
      console.log('Available voices:', voices.map(v => ({ name: v.name, category: v.category, id: v.voice_id })));
      
      const assignments = [];
      
      // 1. STACY - find Stacy Clone voice
      const stacyVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('stacy') && 
        voice.name.toLowerCase().includes('clone')
      );
      if (stacyVoice) {
        assignments.push({
          ...characterRoles[0],
          voiceId: stacyVoice.voice_id,
          elevenlabsVoice: stacyVoice
        });
      }
      
      // 2. Male 20s to 30s (NOT Cody McAvoy and not the first one) - find a different male voice
      const maleVoices = voices.filter(voice => 
        voice.category === 'Male 20s to 30s' &&
        !voice.name.toLowerCase().includes('cody') &&
        !voice.name.toLowerCase().includes('mcavoy')
      );
      const maleVoice = maleVoices[1] || maleVoices[0]; // Get second one if available, otherwise first
      if (maleVoice) {
        // Clean up the name - remove descriptions after dashes or hyphens and remove "CLONE"
        const cleanName = maleVoice.name
          .split('-')[0]
          .split('—')[0]
          .replace(/clone/gi, '')
          .trim()
          .toUpperCase();
        assignments.push({
          ...characterRoles[1],
          name: cleanName,
          avatar: cleanName.charAt(0).toUpperCase(),
          voiceId: maleVoice.voice_id,
          elevenlabsVoice: maleVoice
        });
      }
      
      // 3. CODY MCAVOY - find Cody McAvoy voice
      const codyVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('cody') && 
        voice.name.toLowerCase().includes('mcavoy')
      );
      if (codyVoice) {
        assignments.push({
          ...characterRoles[2],
          voiceId: codyVoice.voice_id,
          elevenlabsVoice: codyVoice
        });
      }
      
      // 4. Female Narrator - find a female narrator voice
      const femaleNarratorVoice = voices.find(voice => 
        voice.category === 'Narrator' &&
        (voice.name.toLowerCase().includes('female') || 
         voice.name.toLowerCase().includes('woman') ||
         !voice.name.toLowerCase().includes('male'))
      );
      if (femaleNarratorVoice) {
        // Clean up the name - remove descriptions after dashes or hyphens
        const cleanName = femaleNarratorVoice.name.split('-')[0].split('—')[0].trim().toUpperCase();
        assignments.push({
          ...characterRoles[3],
          name: cleanName,
          avatar: cleanName.charAt(0).toUpperCase(),
          voiceId: femaleNarratorVoice.voice_id,
          elevenlabsVoice: femaleNarratorVoice
        });
      }
      
      console.log('Voice assignments:', assignments);
      setCharactersWithVoices(assignments);
    }
  }, [voices]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, []);

  const handleRegenerateVoice = (characterId: string) => {
    setIsProcessing(true);
    // In a real implementation, this would call an API to regenerate the voice
    setTimeout(() => {
      setIsProcessing(false);
    }, 1500);
  };

  const handlePreviewVoice = async (character: CharacterVoice) => {
    if (!character.elevenlabsVoice?.preview_url) {
      console.error('No preview URL available for voice:', character.elevenlabsVoice?.name);
      return;
    }

    try {
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setCurrentAudio(null);
        setPlayingVoiceId(null);
      }

      // If clicking the same voice, just stop
      if (playingVoiceId === character.voiceId) {
        return;
      }

      console.log('Playing voice preview:', character.elevenlabsVoice.name, character.elevenlabsVoice.preview_url);

      // Create and play new audio
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      
      audio.onloadstart = () => {
        console.log('Audio loading started');
      };
      
      audio.oncanplaythrough = () => {
        console.log('Audio can play through');
        audio.play().catch(error => {
          console.error('Audio play failed:', error);
          setPlayingVoiceId(null);
          setCurrentAudio(null);
        });
      };
      
      audio.onended = () => {
        console.log('Audio ended');
        setPlayingVoiceId(null);
        setCurrentAudio(null);
      };
      
      audio.onerror = (error) => {
        console.error('Audio error:', error);
        setPlayingVoiceId(null);
        setCurrentAudio(null);
      };
      
      setCurrentAudio(audio);
      setPlayingVoiceId(character.voiceId);
      audio.src = character.elevenlabsVoice.preview_url;
      
    } catch (error) {
      console.error('Error in handlePreviewVoice:', error);
      setPlayingVoiceId(null);
      setCurrentAudio(null);
    }
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
              {voicesLoading ? (
                <div className="grid gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="p-4 rounded-lg border border-border animate-pulse">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-20 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-32 mb-1"></div>
                          <div className="h-3 bg-muted rounded w-16"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="h-8 w-20 bg-muted rounded"></div>
                          <div className="h-8 w-16 bg-muted rounded"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4">
                  {charactersWithVoices.map((character) => (
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
                            {character.role === "Narrator" && (
                              <Crown className="h-4 w-4 text-cinema-gold" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {character.personality} • {character.age}
                          </p>
                          <div className="flex items-center gap-2">
                            {character.elevenlabsVoice && (
                              <Badge variant="secondary" className="text-xs">
                                {character.elevenlabsVoice.category}
                              </Badge>
                            )}
                          </div>
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(character);
                          }}
                          disabled={!character.elevenlabsVoice?.preview_url}
                        >
                          {playingVoiceId === character.voiceId ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
              
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