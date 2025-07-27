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

// Helper: Convert AudioBuffer to WAV Blob (browser compatible)
function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArray = new ArrayBuffer(length);
  const view = new DataView(bufferArray);

  function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  let offset = 0;
  writeString(view, offset, 'RIFF'); offset += 4;
  view.setUint32(offset, 36 + buffer.length * numOfChan * 2, true); offset += 4;
  writeString(view, offset, 'WAVE'); offset += 4;
  writeString(view, offset, 'fmt '); offset += 4;
  view.setUint32(offset, 16, true); offset += 4;
  view.setUint16(offset, 1, true); offset += 2;
  view.setUint16(offset, numOfChan, true); offset += 2;
  view.setUint32(offset, buffer.sampleRate, true); offset += 4;
  view.setUint32(offset, buffer.sampleRate * numOfChan * 2, true); offset += 4;
  view.setUint16(offset, numOfChan * 2, true); offset += 2;
  view.setUint16(offset, 16, true); offset += 2;
  writeString(view, offset, 'data'); offset += 4;
  view.setUint32(offset, buffer.length * numOfChan * 2, true); offset += 4;

  // Interleave PCM samples
  let index = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      let sample = buffer.getChannelData(channel)[i];
      sample = Math.max(-1, Math.min(1, sample));
      view.setInt16(index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      index += 2;
    }
  }

  return new Blob([bufferArray], { type: 'audio/wav' });
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