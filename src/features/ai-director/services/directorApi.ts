import { supabase } from '@/integrations/supabase/client';

export type DirectorAnalysis = {
  id: string;
  project_id: string;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
  error?: string;
  created_at: string;
};

export const directorApi = {
  trigger: async (projectId: string, script: string) => {
    const { data, error } = await supabase.functions.invoke("ai-director", {
      body: { project_id: projectId, script },
    });

    if (error) throw error;
    return data;
  },

  getByProjectId: async (projectId: string) => {
    const { data, error } = await supabase
      .from("user_projects")
      .select("ai_director_json")
      .eq("id", projectId)
      .single();

    if (error) throw error;
    return data?.ai_director_json;
  },

  subscribe: (projectId: string, callback: (analysis: any) => void) => {
    const channel = supabase
      .channel('director-updates')
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
          if (newData.ai_director_json) {
            callback(newData.ai_director_json);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
