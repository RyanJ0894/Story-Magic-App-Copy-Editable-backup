import { ParsedScript, Character, DialogueLine } from './scriptParser';

export interface AudioSegment {
  character: string;
  voiceId: string;
  text: string;
  startTime: number;
  endTime: number;
  audioBlob?: Blob;
  audioUrl?: string;
}

export interface GenerationProgress {
  current: number;
  total: number;
  character: string;
  text: string;
}

// Function to clean script content for better audio generation (same as edge function)
function filterScriptForAudio(scriptText: string): string {
  if (!scriptText || typeof scriptText !== 'string') {
    return '';
  }
  
  const lines = scriptText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const filteredLines: string[] = [];
  
  // Patterns to remove script formatting elements
  const pageNumberPattern = /^\d+$|^Page\s+\d+|^PAGE\s+\d+/i;
  const stageDirectionPattern = /^\([^)]+\)|^\[[^\]]+\]|^\{[^}]+\}|^CONT'D$|^CONTINUED$|^MORE$/i;
  const sceneNumberPattern = /^SCENE\s+\d+|^ACT\s+\d+|^CHAPTER\s+\d+/i;
  const characterNamePattern = /^[A-Z][A-Z\s\-'\.]{2,}$|^[A-Z][A-Z\s\-'\.]+:$/;
  const transitionPattern = /^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|INT\.|EXT\.|INT\/EXT\.|INTERIOR|EXTERIOR)/i;
  const sceneHeadingPattern = /^(INT\.|EXT\.|INTERIOR|EXTERIOR)\s+.+\s+[-–—]\s+(DAY|NIGHT|MORNING|EVENING|DAWN|DUSK|LATER|CONTINUOUS)/i;
  
  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;
    
    // Skip script formatting elements
    if (pageNumberPattern.test(line) || 
        stageDirectionPattern.test(line) || 
        sceneNumberPattern.test(line) || 
        characterNamePattern.test(line) || 
        transitionPattern.test(line) || 
        sceneHeadingPattern.test(line)) {
      continue;
    }
    
    // Keep dialogue and narration
    if (line.length > 2) {
      filteredLines.push(line);
    }
  }
  
  // Join and clean up
  let result = filteredLines.join(' ').replace(/\s+/g, ' ').trim();
  
  // Additional cleanup
  result = result
    .replace(/\b(CONT'D|CONTINUED|MORE)\b/gi, '')
    .replace(/\([^)]*\)/g, '') // Remove parentheticals
    .replace(/\[[^\]]*\]/g, '') // Remove brackets
    .replace(/\{[^}]*\}/g, '') // Remove braces
    .replace(/\s+/g, ' ')
    .trim();
  
  return result;
}

// Helper function to convert AudioBuffer to WAV Blob
function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const numChannels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  
  // Create a buffer for the WAV file
  const buffer = new ArrayBuffer(44 + length * numChannels * 2);
  const view = new DataView(buffer);
  
  // WAV file header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };
  
  const writeUint32 = (offset: number, value: number) => {
    view.setUint32(offset, value, true);
  };
  
  const writeUint16 = (offset: number, value: number) => {
    view.setUint16(offset, value, true);
  };
  
  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  writeUint32(4, 36 + length * numChannels * 2);
  writeString(8, 'WAVE');
  
  // fmt sub-chunk
  writeString(12, 'fmt ');
  writeUint32(16, 16); // fmt chunk size
  writeUint16(20, 1); // audio format (PCM)
  writeUint16(22, numChannels);
  writeUint32(24, sampleRate);
  writeUint32(28, sampleRate * numChannels * 2); // byte rate
  writeUint16(32, numChannels * 2); // block align
  writeUint16(34, 16); // bits per sample
  
  // data sub-chunk
  writeString(36, 'data');
  writeUint32(40, length * numChannels * 2);
  
  // Write audio data
  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

export class MultiVoiceGenerator {
  private apiKey: string;
  private onProgress?: (progress: GenerationProgress) => void;

  constructor(apiKey: string, onProgress?: (progress: GenerationProgress) => void) {
    this.apiKey = apiKey;
    this.onProgress = onProgress;
  }

  async generateMultiVoiceAudio(
    parsedScript: ParsedScript,
    characterVoices: Character[]
  ): Promise<{ audioUrl: string; segments: AudioSegment[] }> {
    console.log('🚨 USING LOCAL MultiVoiceGenerator (NOT Edge Function)');
    console.error('🚨 USING LOCAL MultiVoiceGenerator (NOT Edge Function)');  // Force error log
    alert('🚨 USING LOCAL MultiVoiceGenerator - Check console for filtering logs!');  // Force visible alert
    console.log('📋 Parsed script scenes:', parsedScript.scenes.length);
    console.log('👥 Character voices:', characterVoices.map(cv => `${cv.name}: ${cv.voiceId}`));
    const segments: AudioSegment[] = [];
    let currentTime = 0;
    let totalLines = 0;
    let processedLines = 0;

    // Count total lines for progress
    parsedScript.scenes.forEach(scene => {
      totalLines += scene.lines.length;
    });

    // Generate audio for each line
    for (const scene of parsedScript.scenes) {
      for (const line of scene.lines) {
        let voiceId: string;
        let speaker: string;
        
        if (line.type === 'narrator') {
          // Use narrator voice
          voiceId = parsedScript.narrator.voiceId;
          speaker = 'NARRATOR';
        } else {
          // Use character voice
          const characterVoice = characterVoices.find(cv => cv.name === line.speaker);
          if (!characterVoice) {
            console.warn(`No voice assigned for character: ${line.speaker}`);
            continue;
          }
          voiceId = characterVoice.voiceId;
          speaker = line.speaker;
        }

        try {
          // Generate audio for this line
          const audioBlob = await this.generateSingleVoiceAudio(line.text, voiceId);
          
          // Create audio element to get duration
          const audioUrl = URL.createObjectURL(audioBlob);
          const duration = await this.getAudioDuration(audioUrl);

          const segment: AudioSegment = {
            character: speaker,
            voiceId: voiceId,
            text: line.text,
            startTime: currentTime,
            endTime: currentTime + duration,
            audioBlob,
            audioUrl
          };

          segments.push(segment);
          currentTime += duration + 0.5; // Add 0.5s pause between lines
          processedLines++;

          // Report progress
          if (this.onProgress) {
            this.onProgress({
              current: processedLines,
              total: totalLines,
              character: speaker,
              text: line.text.substring(0, 50) + (line.text.length > 50 ? '...' : '')
            });
          }
        } catch (error) {
          console.error(`Failed to generate audio for ${speaker}:`, error);
        }
      }
    }

    // Combine all audio segments
    const combinedAudioUrl = await this.combineAudioSegments(segments);

    return {
      audioUrl: combinedAudioUrl,
      segments
    };
  }

  private async generateSingleVoiceAudio(text: string, voiceId: string): Promise<Blob> {
    console.log('🎵 MultiVoiceGenerator.generateSingleVoiceAudio called');
    console.log('📝 Original text:', text);
    console.log('🎤 Voice ID:', voiceId);
    
    // Apply script filtering to clean up the text
    const filteredText = filterScriptForAudio(text);
    console.log('✨ Filtered text:', filteredText);
    console.log('📊 Text comparison:');
    console.log('  - Original length:', text.length);
    console.log('  - Filtered length:', filteredText.length);
    console.log('  - Text changed:', text !== filteredText);
    
    // If filtered text is empty, skip generation
    if (!filteredText || filteredText.trim().length === 0) {
      console.log('⏭️  Skipping empty text after filtering:', text);
      // Return a very short silent audio blob
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const buffer = audioContext.createBuffer(1, audioContext.sampleRate * 0.1, audioContext.sampleRate); // 0.1 second silence
      const wavBlob = audioBufferToWavBlob(buffer);
      return wavBlob;
    }

    const payload = {
      text: filteredText, // Use filtered text instead of original
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
      },
    };
    
    console.log('🚀 Sending to ElevenLabs API:', payload);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ ElevenLabs API error:', response.status, errorText);
      throw new Error(`Failed to generate audio: ${response.statusText}`);
    }

    console.log('✅ Audio generated successfully');
    return await response.blob();
  }

  private async getAudioDuration(audioUrl: string): Promise<number> {
    return new Promise((resolve) => {
      const audio = new Audio(audioUrl);
      audio.addEventListener('loadedmetadata', () => {
        resolve(audio.duration);
      });
      audio.addEventListener('error', () => {
        resolve(2); // Default duration if we can't get it
      });
    });
  }

  private async combineAudioSegments(segments: AudioSegment[]): Promise<string> {
    if (segments.length === 0) {
      throw new Error('No audio segments to combine');
    }
    if (segments.length === 1) {
      return segments[0].audioUrl!;
    }

    // Use Web Audio API to concatenate all audio blobs
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const audioBuffers = await Promise.all(
      segments.map(segment =>
        segment.audioBlob!.arrayBuffer().then(buffer => audioContext.decodeAudioData(buffer))
      )
    );

    // Calculate total length
    const totalLength = audioBuffers.reduce((sum, buffer) => sum + buffer.length, 0);

    // Create a new buffer
    const outputBuffer = audioContext.createBuffer(
      audioBuffers[0].numberOfChannels,
      totalLength,
      audioBuffers[0].sampleRate
    );

    // Copy each buffer into the output buffer
    let offset = 0;
    for (const buffer of audioBuffers) {
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        outputBuffer.getChannelData(channel).set(buffer.getChannelData(channel), offset);
      }
      offset += buffer.length;
    }

    // Export the buffer to a WAV file
    const wavBlob = audioBufferToWavBlob(outputBuffer);
    return URL.createObjectURL(wavBlob);
  }

  static downloadAudio(audioUrl: string, filename: string = 'multi-voice-audio.wav') {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  static cleanupAudioUrls(segments: AudioSegment[]) {
    segments.forEach(segment => {
      if (segment.audioUrl) {
        URL.revokeObjectURL(segment.audioUrl);
      }
    });
  }
} 