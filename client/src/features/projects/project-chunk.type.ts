import { Database } from '../../../supabase/type';

export type ProjectChunk = Database['public']['Tables']['project_chunks']['Row'];

export interface ChunkCreateData {
  projectId: string;
  script: string;
}

export interface ChunkProgressData {
  chunk_id: string;
  project_id: string;
  scene_title: string;
  version: number;
  director_notes: string;
  lines: any[];
  audio_direction: {
    music: any[];
    ambience: any[];
    sfx: any[];
  };
}

export interface ChunkRef {
  chunk_id: string;
  scene_title: string;
  order: number;
  start: number;
  duration: number;
}

export interface ChunkState {
  chunkId: string;
  isLoading: boolean;
  data?: ProjectChunk;
  error?: string;
}
