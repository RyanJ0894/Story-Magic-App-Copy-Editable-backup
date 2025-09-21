import { Database } from '../../../supabase/type';

export type Project = Database['public']['Tables']['projects']['Row'];

export interface ProjectFormData {
  title: string;
  script: string;
  doDirector: boolean;
  doAudio: boolean;
}

export interface CreateProjectData {
  title: string;
  script: string;
  user_id: string;
}

export interface ProjectWithDetails extends Project {
  ai_director_json?: any | null;
  audio_url?: string | null;
}

export interface ProjectStatus {
  status: 'draft' | 'analyzed' | 'complete';
  hasDirectorJson: boolean;
  hasAudio: boolean;
}