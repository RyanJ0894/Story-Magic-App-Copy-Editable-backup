export interface Character {
  name: string;
  voiceId: string;
  voiceName: string;
}

export interface DialogueLine {
  character: string;
  text: string;
  sceneIndex: number;
  lineIndex: number;
}

export interface Scene {
  index: number;
  title: string;
  lines: DialogueLine[];
}

export interface ParsedScript {
  scenes: Scene[];
  characters: string[];
  totalLines: number;
}

export class ScriptParser {
  private static readonly SCENE_PATTERNS = [
    /^SCENE\s+\d+/i,
    /^ACT\s+\d+/i,
    /^INT\.\s+/i,
    /^EXT\.\s+/i,
    /^INT\/EXT\.\s+/i,
    /^FADE\s+IN/i,
    /^FADE\s+OUT/i,
    /^CUT\s+TO/i,
    /^DISSOLVE\s+TO/i,
  ];

  private static readonly CHARACTER_PATTERNS = [
    /^[A-Z][A-Z\s]+$/m, // ALL CAPS character names
    /^[A-Z][a-z]+(\s+[A-Z][a-z]+)*$/m, // Title Case character names
  ];

  private static readonly STAGE_DIRECTION_PATTERNS = [
    /^\([^)]+\)/m, // (stage directions)
    /^\[[^\]]+\]/m, // [stage directions]
    /^\{[^}]+\}/m, // {stage directions}
    /^CONT'D$/i, // Continued
    /^CONTINUED$/i,
    /^\(CONT'D\)$/i,
    /^\(CONTINUED\)$/i,
  ];

  private static readonly PAGE_NUMBER_PATTERNS = [
    /^\d+$/m, // Standalone numbers
    /^Page\s+\d+/i,
    /^PAGE\s+\d+/i,
  ];

  static parseScript(scriptText: string): ParsedScript {
    const lines = scriptText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const scenes: Scene[] = [];
    const characters = new Set<string>();
    let currentScene: Scene | null = null;
    let sceneIndex = 0;
    let lineIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this is a scene header
      if (this.isSceneHeader(line)) {
        if (currentScene) {
          scenes.push(currentScene);
        }
        currentScene = {
          index: sceneIndex,
          title: this.cleanSceneTitle(line),
          lines: []
        };
        sceneIndex++;
        lineIndex = 0;
        continue;
      }

      // If no scene exists yet, create a default one
      if (!currentScene) {
        currentScene = {
          index: 0,
          title: "Scene 1",
          lines: []
        };
        sceneIndex++;
      }

      // Check if this is a character name
      if (this.isCharacterName(line)) {
        const characterName = this.cleanCharacterName(line);
        characters.add(characterName);
        
        // Look for dialogue in the next lines
        let dialogueText = '';
        let j = i + 1;
        
        while (j < lines.length) {
          const nextLine = lines[j];
          
          // Stop if we hit another character name, scene header, or stage direction
          if (this.isCharacterName(nextLine) || 
              this.isSceneHeader(nextLine) || 
              this.isStageDirection(nextLine) ||
              this.isPageNumber(nextLine)) {
            break;
          }
          
          // Add to dialogue if it's not empty
          if (nextLine.length > 0) {
            dialogueText += (dialogueText ? ' ' : '') + nextLine;
          }
          
          j++;
        }
        
        // Only add if we found actual dialogue
        if (dialogueText.trim()) {
          currentScene.lines.push({
            character: characterName,
            text: this.cleanDialogueText(dialogueText),
            sceneIndex: currentScene.index,
            lineIndex: lineIndex++
          });
        }
        
        // Skip the dialogue lines we just processed
        i = j - 1;
      }
    }

    // Add the last scene if it exists
    if (currentScene) {
      scenes.push(currentScene);
    }

    return {
      scenes,
      characters: Array.from(characters),
      totalLines: scenes.reduce((total, scene) => total + scene.lines.length, 0)
    };
  }

  private static isSceneHeader(line: string): boolean {
    return this.SCENE_PATTERNS.some(pattern => pattern.test(line));
  }

  private static isCharacterName(line: string): boolean {
    return this.CHARACTER_PATTERNS.some(pattern => pattern.test(line)) &&
           !this.isStageDirection(line) &&
           !this.isPageNumber(line);
  }

  private static isStageDirection(line: string): boolean {
    return this.STAGE_DIRECTION_PATTERNS.some(pattern => pattern.test(line));
  }

  private static isPageNumber(line: string): boolean {
    return this.PAGE_NUMBER_PATTERNS.some(pattern => pattern.test(line));
  }

  private static cleanSceneTitle(line: string): string {
    return line.replace(/^(SCENE|ACT)\s+\d+\s*[-:]*\s*/i, '').trim();
  }

  private static cleanCharacterName(line: string): string {
    return line.trim();
  }

  private static cleanDialogueText(text: string): string {
    return text
      .replace(/\([^)]*\)/g, '') // Remove (stage directions)
      .replace(/\[[^\]]*\]/g, '') // Remove [stage directions]
      .replace(/\{[^}]*\}/g, '') // Remove {stage directions}
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  static getFilteredTextForAudio(parsedScript: ParsedScript): string {
    return parsedScript.scenes
      .map(scene => 
        scene.lines
          .map(line => line.text)
          .filter(text => text.length > 0)
          .join(' ')
      )
      .filter(sceneText => sceneText.length > 0)
      .join(' ');
  }

  static assignDefaultVoices(characters: string[]): Character[] {
    const defaultVoices = [
      { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel (Female, English)" },
      { id: "AZnzlk1XvdvUeBnXmlld", name: "Adam (Male, English)" },
      { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella (Female, English)" },
      { id: "ErXwobaYiN019PkySvjV", name: "Antoni (Male, English)" },
      { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elli (Female, English)" },
      { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh (Male, English)" },
      { id: "VR6AewLTigWG4xSOukaG", name: "Arnold (Male, English)" },
    ];

    return characters.map((character, index) => ({
      name: character,
      voiceId: defaultVoices[index % defaultVoices.length].id,
      voiceName: defaultVoices[index % defaultVoices.length].name
    }));
  }
} 