export interface Character {
  name: string;
  voiceId: string;
  voiceName: string;
}

export interface NarratorVoice {
  voiceId: string;
  voiceName: string;
}

export interface DialogueLine {
  type: 'dialogue' | 'narrator';
  speaker: string; // Character name or 'NARRATOR'
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
  narrator: NarratorVoice;
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

  // Patterns for narrator text (scene descriptions, action lines)
  private static readonly NARRATOR_PATTERNS = [
    /^[a-z]/, // Lines starting with lowercase (often action/description)
    /^The\s+/, // Description lines starting with "The"
    /^We\s+(see|hear)/, // Common narrative phrases
    /^Close\s+up/i,
    /^Wide\s+shot/i,
    /^Medium\s+shot/i,
    /^Camera\s+/i,
    /^Sound\s+of/i,
  ];

  static parseScript(scriptText: string): ParsedScript {
    const lines = scriptText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    const scenes: Scene[] = [];
    const characters = new Set<string>();
    let currentScene: Scene | null = null;
    let sceneIndex = 0;
    let lineIndex = 0;

    // Skip unwanted elements during initial filtering
    const filteredLines = lines.filter(line => 
      !this.isPageNumber(line) && 
      !this.isStageDirection(line) &&
      line.length > 2 // Skip very short lines that are likely formatting artifacts
    );

    for (let i = 0; i < filteredLines.length; i++) {
      const line = filteredLines[i];
      
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
        
        // Add scene header as narrator text (INT./EXT. should be read)
        if (this.shouldReadSceneHeader(line)) {
          currentScene.lines.push({
            type: 'narrator',
            speaker: 'NARRATOR',
            text: this.cleanSceneTitle(line),
            sceneIndex: currentScene.index,
            lineIndex: lineIndex++
          });
        }
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
        
        while (j < filteredLines.length) {
          const nextLine = filteredLines[j];
          
          // Stop if we hit another character name or scene header
          if (this.isCharacterName(nextLine) || this.isSceneHeader(nextLine)) {
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
            type: 'dialogue',
            speaker: characterName,
            text: this.cleanDialogueText(dialogueText),
            sceneIndex: currentScene.index,
            lineIndex: lineIndex++
          });
        }
        
        // Skip the dialogue lines we just processed
        i = j - 1;
      } else if (this.isNarratorText(line)) {
        // This is narrator/action text that should be read
        const cleanedText = this.cleanNarratorText(line);
        if (cleanedText.length > 0) {
          currentScene.lines.push({
            type: 'narrator',
            speaker: 'NARRATOR',
            text: cleanedText,
            sceneIndex: currentScene.index,
            lineIndex: lineIndex++
          });
        }
      }
    }

    // Add the last scene if it exists
    if (currentScene) {
      scenes.push(currentScene);
    }

    // Assign default narrator voice
    const narrator: NarratorVoice = {
      voiceId: 'JBFqnCBsd6RMkjVDRZzb', // George - Deep narrator voice
      voiceName: 'George (Narrator, Deep)'
    };

    return {
      scenes,
      characters: Array.from(characters),
      narrator,
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

  private static shouldReadSceneHeader(line: string): boolean {
    // Read INT./EXT. location headings but skip scene numbers
    return /^(INT\.|EXT\.|INT\/EXT\.)/i.test(line);
  }

  private static isNarratorText(line: string): boolean {
    // Check if this line should be read by the narrator
    return this.NARRATOR_PATTERNS.some(pattern => pattern.test(line)) ||
           (!this.isCharacterName(line) && !this.isSceneHeader(line) && line.length > 10);
  }

  private static cleanNarratorText(text: string): string {
    return text
      .replace(/\([^)]*\)/g, '') // Remove (stage directions)
      .replace(/\[[^\]]*\]/g, '') // Remove [stage directions]
      .replace(/\{[^}]*\}/g, '') // Remove {stage directions}
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
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
      { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah (Warm Female)" },
      { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica (Assertive Female)" },
      { id: "nPczCjzI2devNBz1zQrb", name: "Brian (Neutral Male)" },
      { id: "iP95p4xoKVk53GoZ742B", name: "Chris (Comedic Male)" },
      { id: "pqHfZKP75CvOlQylNhV4", name: "Bill (Elderly Male Mentor)" },
      { id: "XrExE9yKIg1WjnnlVkGX", name: "Matilda (Elderly Female Mentor)" },
      { id: "IKne3meq5aSn9XLyUdCD", name: "Charlie (Young Hero)" },
    ];

    return characters.map((character, index) => ({
      name: character,
      voiceId: defaultVoices[index % defaultVoices.length].id,
      voiceName: defaultVoices[index % defaultVoices.length].name
    }));
  }
} 