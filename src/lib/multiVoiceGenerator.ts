import { ParsedScript, Character, DialogueLine } from './scriptParser';
import toWav from 'audiobuffer-to-wav';

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
        const characterVoice = characterVoices.find(cv => cv.name === line.character);
        if (!characterVoice) {
          console.warn(`No voice assigned for character: ${line.character}`);
          continue;
        }

        try {
          // Generate audio for this line
          const audioBlob = await this.generateSingleVoiceAudio(line.text, characterVoice.voiceId);
          
          // Create audio element to get duration
          const audioUrl = URL.createObjectURL(audioBlob);
          const duration = await this.getAudioDuration(audioUrl);

          const segment: AudioSegment = {
            character: line.character,
            voiceId: characterVoice.voiceId,
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
              character: line.character,
              text: line.text.substring(0, 50) + (line.text.length > 50 ? '...' : '')
            });
          }
        } catch (error) {
          console.error(`Failed to generate audio for ${line.character}:`, error);
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
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to generate audio: ${response.statusText}`);
    }

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
    const wav = toWav(outputBuffer);
    const wavBlob = new Blob([wav], { type: 'audio/wav' });
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