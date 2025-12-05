import { ChunkProgressData } from "../project-chunk.type";

export type AudioGenerationRequest = {
  project: {
    id: string;
    title: string;
    created_at: string;
  };
  chunks: Array<{
    chunk_id: string;
    project_id: string;
    scene_title: string;
    lines: Array<{
      line_id: string;
      text: string;
      type: string;
      start: number;
      duration: number;
      volume: number;
      src: string | null;
      tts_settings: {
        style: string;
        status: string;
        language: string;
        provider: string;
        character: string | null;
        voice_key: string;
        stability: number;
        similarity_boost: number;
        credits_used: number;
      };
    }>;
    audio_direction: {
      music: Array<{
        track_id: string;
        label: string;
        src: string | null;
        start: number;
        duration: number;
        volume: number;
        fade_in: number;
        fade_out: number;
      }>;
      ambience: Array<{
        track_id: string;
        label: string;
        src: string | null;
        start: number;
        duration: number;
        volume: number;
        fade_in: number;
        fade_out: number;
      }>;
      sfx: Array<{
        track_id: string;
        label: string;
        src: string | null;
        start: number;
        duration: number;
        volume: number;
        fade_in: number;
        fade_out: number;
      }>;
    };
    estimated_chunk_duration: number;
    global_start: number;
  }>;
  metadata: {
    total_chunks: number;
    generated_at: string;
    version: string;
  };
};

export type AudioGenerationResponse = {
  success: boolean;
  message: string;
  download_url: string;
  public_url: string;
  output_filename: string;
};

const SERVER_URL = import.meta.env.VITE_SERVER_URL;

export const audioGenerationApi = {
  // Generate combined audio for project
  generateProjectAudio: async (request: AudioGenerationRequest): Promise<AudioGenerationResponse> => {
    const response = await fetch(`${SERVER_URL}/api/audio/project-combine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },
};
