import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, User, Volume2 } from "lucide-react";
import { Character } from "@/lib/scriptParser";

const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Female, English)" },
  { id: "AZnzlk1XvdvUeBnXmlld", name: "Adam (Male, English)" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Female, English)" },
  { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Male, English)" },
  { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli (Female, English)" },
  { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh (Male, English)" },
  { id: "VR6AewLTigWG4xSOukaG", name: "Arnold (Male, English)" },
];

interface CharacterVoiceAssignmentProps {
  characters: string[];
  characterVoices: Character[];
  onVoiceChange: (characterName: string, voiceId: string, voiceName: string) => void;
  onAssignAll: () => void;
}

export default function CharacterVoiceAssignment({
  characters,
  characterVoices,
  onVoiceChange,
  onAssignAll,
}: CharacterVoiceAssignmentProps) {
  const getVoiceForCharacter = (characterName: string) => {
    return characterVoices.find(cv => cv.name === characterName);
  };

  const getAvailableVoices = (currentVoiceId?: string) => {
    return ELEVENLABS_VOICES.filter(voice => 
      !characterVoices.some(cv => cv.voiceId === voice.id && cv.name !== currentVoiceId)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Character Voice Assignment
          <Badge variant="secondary" className="ml-2">
            {characters.length} characters
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Assign different voices to each character
          </p>
          <Button onClick={onAssignAll} variant="outline" size="sm">
            Auto-Assign All
          </Button>
        </div>

        <div className="space-y-3">
          {characters.map((character) => {
            const currentVoice = getVoiceForCharacter(character);
            const availableVoices = getAvailableVoices(currentVoice?.voiceId);

            return (
              <div
                key={character}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{character}</p>
                    {currentVoice && (
                      <p className="text-sm text-muted-foreground">
                        {currentVoice.voiceName}
                      </p>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Volume2 className="h-4 w-4" />
                      {currentVoice ? "Change Voice" : "Select Voice"}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    {availableVoices.length === 0 ? (
                      <DropdownMenuItem disabled>
                        No available voices
                      </DropdownMenuItem>
                    ) : (
                      availableVoices.map((voice) => (
                        <DropdownMenuItem
                          key={voice.id}
                          onClick={() => onVoiceChange(character, voice.id, voice.name)}
                          className="flex flex-col items-start gap-1"
                        >
                          <span className="font-medium">{voice.name}</span>
                          <span className="text-xs text-muted-foreground">
                            Voice ID: {voice.id}
                          </span>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>

        {characterVoices.length > 0 && (
          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
            <p className="text-sm font-medium mb-2">Voice Assignment Summary:</p>
            <div className="space-y-1">
              {characterVoices.map((cv) => (
                <div key={cv.name} className="flex justify-between text-sm">
                  <span>{cv.name}:</span>
                  <span className="text-muted-foreground">{cv.voiceName}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 