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
    name: "LUCKY",
    role: "Supporting",
    age: "28-35",
    personality: "Tech-savvy assistant",
    avatar: "L"
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
    name: "NATHANIEL C",
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
      console.log('=== VOICE DEBUG INFO ===');
      console.log('Available voices:', voices.map(v => ({ name: v.name, category: v.category, id: v.voice_id })));
      
      const assignments = [];
      
      // Map exact voices - try both demo voice IDs AND name matching for compatibility
      const voiceMap = {
        'STACY': voices.find(v => 
          v.voice_id === 'XhNlP8uwiH6XZSFnH1yL' || // Regular STACY voice (not African American)
          (v.name.toLowerCase().includes('stacy') && !v.name.toLowerCase().includes('african'))
        ),
        'LUCKY': voices.find(v => 
          v.voice_id === 'PSqRw3ln34TxQZrTS6Wt' || // LUCKY voice - Male 20s to 30s
          v.name.toLowerCase().includes('lucky')
        ),
        'CODY MCAVOY': voices.find(v => 
          v.voice_id === '1RVpBInY9YUYMLSUQReV' || // Demo voice ID
          v.name.toLowerCase().includes('cody')     // Name fallback
        ),
        'NATHANIEL C': voices.find(v => 
          v.voice_id === 'AeRdCCKzvd23BpJoofzx' || // Demo voice ID
          v.name.toLowerCase().includes('nathaniel') // Name fallback
        )
      };
      
      // Create assignments for each character
      characterRoles.forEach((character, index) => {
        const voice = voiceMap[character.name];
        if (voice) {
          assignments.push({
            ...character,
            voiceId: voice.voice_id,
            elevenlabsVoice: voice
          });
          console.log(`Assigned ${character.name} → ${voice.name} (${voice.category})`);
        } else {
          console.log(`No voice found for ${character.name}`);
        }
      });
      
      console.log('Final voice assignments:', assignments.length);
      setCharactersWithVoices(assignments);
    } else {
      console.log('No voices available');
      setCharactersWithVoices([]);
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

      // Create audio element with mobile-optimized settings
      const audio = new Audio();
      
      // Mobile-friendly audio settings
      audio.crossOrigin = 'anonymous';
      audio.preload = 'metadata'; // Changed from 'auto' for better mobile compatibility
      audio.setAttribute('playsinline', 'true'); // Important for iOS
      
      // Set up event handlers
      const playAudio = async () => {
        try {
          setPlayingVoiceId(character.voiceId);
          await audio.play();
          console.log('Audio started playing successfully');
        } catch (error) {
          console.error('Audio play failed:', error);
          setPlayingVoiceId(null);
          setCurrentAudio(null);
          
          // Specific error handling for mobile constraints
          if (error.name === 'NotAllowedError') {
            console.error('Audio play blocked - user interaction required');
          } else if (error.name === 'NotSupportedError') {
            console.error('Audio format not supported');
          }
        }
      };
      
      audio.onloadeddata = () => {
        console.log('Audio data loaded, attempting to play');
        playAudio();
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
      
      audio.onpause = () => {
        console.log('Audio paused');
        setPlayingVoiceId(null);
      };
      
      // Set current audio reference and source
      setCurrentAudio(audio);
      audio.src = character.elevenlabsVoice.preview_url;
      
      // Load the audio - this will trigger onloadeddata when ready
      audio.load();
      
    } catch (error) {
      console.error('Error in handlePreviewVoice:', error);
      setPlayingVoiceId(null);
      setCurrentAudio(null);
    }
  };

  return (
    <section className="py-8 md:py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
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
                    className={`p-3 md:p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                      selectedCharacter === character.id 
                        ? 'border-cinema-gold bg-cinema-gold/10' 
                        : 'border-border hover:border-cinema-gold/50 hover:bg-cinema-surface/50'
                    }`}
                    onClick={() => setSelectedCharacter(character.id)}
                  >
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <div className="flex items-start gap-3 md:gap-4 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                          <AvatarImage src={character.avatar} />
                          <AvatarFallback className="bg-cinema-surface text-cinema-gold font-bold text-sm md:text-base">
                            {character.avatar}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-base md:text-lg truncate">{character.name}</h3>
                            <Badge variant="secondary" className="text-xs flex-shrink-0">
                              {character.role}
                            </Badge>
                            {character.role === "Narrator" && (
                              <Crown className="h-4 w-4 text-cinema-gold flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mb-2 line-clamp-2">
                            {character.personality} • {character.age}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            {character.elevenlabsVoice && (
                              <Badge variant="secondary" className="text-xs">
                                {character.elevenlabsVoice.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1 sm:gap-2 flex-shrink-0">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="px-2 py-1 h-auto text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRegenerateVoice(character.id);
                          }}
                          disabled={isProcessing}
                        >
                          <RotateCcw className="h-3 w-3" />
                          <span className="hidden lg:inline ml-1">Regen</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="px-2 py-1 h-auto text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePreviewVoice(character);
                          }}
                          disabled={!character.elevenlabsVoice?.preview_url}
                        >
                          {playingVoiceId === character.voiceId ? (
                            <Pause className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                          <span className="hidden lg:inline ml-1">Play</span>
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