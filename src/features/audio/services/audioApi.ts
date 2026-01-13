import { supabase } from '@/integrations/supabase/client';
import { runAudio } from '../../../../supabase/filmDirectorApi';

export type AudioGeneration = {
  id: string;
  project_id: string;
  status: 'pending' | 'completed' | 'failed';
  audio_url?: string;
  error?: string;
  created_at: string;
};

export const audioApi = {
  generateMerged: async (projectId: string, directorJson: any) => {
    const { data, error } = await supabase.functions.invoke("generate-audio", {
      body: { project_id: projectId, director: directorJson },
    });

    if (error) throw error;
    return data;
  },

  generateWithRunAudio: async (projectId: string, directorJson: any) => {
    return runAudio(projectId, directorJson);
  },

  getByProjectId: async (projectId: string) => {
    const { data, error } = await supabase
      .from("user_projects")
      .select("audio_url")
      .eq("id", projectId)
      .single();

    if (error) throw error;
    return data?.audio_url;
  },

  subscribe: (projectId: string, callback: (audio: AudioGeneration) => void) => {
    const channel = supabase
      .channel('audio-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_projects',
          filter: `id=eq.${projectId}`
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.audio_url) {
            callback({
              id: projectId,
              project_id: projectId,
              status: 'completed',
              audio_url: newData.audio_url,
              created_at: new Date().toISOString()
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
