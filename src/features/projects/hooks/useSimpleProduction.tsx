import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { orchestrateAudio, OrchestrationResult } from '@/integrations/supabase/railwayOrchestrator';

interface ProductionState {
  isProcessing: boolean;
  step: string;
  audioUrl: string | null;
  error: string | null;
}

export const useSimpleProduction = () => {
  const [state, setState] = useState<ProductionState>({
    isProcessing: false,
    step: '',
    audioUrl: null,
    error: null,
  });

  const processProduction = async (script: string, projectId: string): Promise<OrchestrationResult> => {
    setState({
      isProcessing: true,
      step: 'Sending script to AI Director...',
      audioUrl: null,
      error: null,
    });

    try {
      // 1. Ensure authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated. Please log in.');

      // 2. Trigger RelevanceAI
      const { data: triggerData, error: triggerError } = await supabase.functions.invoke('trigger-relevance', {
        body: { project_id: projectId, script_text: script },
      });
      if (triggerError || !triggerData?.success)
        throw new Error(`RelevanceAI webhook failed: ${triggerError?.message || 'Unknown error'}`);

      setState(prev => ({ ...prev, step: 'Waiting for AI Director to generate Director JSON...' }));

      // 3. Poll for Director JSON
      let attempts = 0;
      const pollInterval = 5000;
      const maxAttempts = (20 * 60 * 1000) / pollInterval;
      let directorJson: any = null;

      while (attempts < maxAttempts && !directorJson) {
        const { data } = await supabase
          .from('director_json')
          .select('json_data')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const json = data?.json_data as Record<string, any> | null;
        if (json?.scenes?.length) {
          directorJson = json;
          break;
        }

        attempts++;
        await new Promise(r => setTimeout(r, pollInterval));
      }

      if (!directorJson) throw new Error('Timed out waiting for Director JSON with scenes.');

      // 4. Run orchestration
      setState(prev => ({ ...prev, step: 'Generating audio with Railway Orchestrator...' }));
      const result = await orchestrateAudio(directorJson);
      if (result.status === 'error') throw new Error(result.error || 'Railway orchestration failed');

      // 5. Construct final public URL
      const publicUrl =
        result.public_url ||
        result.manifest?.public_url ||
        `https://bcuhyyyerxwgkrkbrqbs.supabase.co/storage/v1/object/public/audio/${projectId}/episode.m4a`;

      // 6. Update UI
      setState({
        isProcessing: false,
        step: '✅ Complete',
        audioUrl: publicUrl,
        error: null,
      });

      console.log('🎵 Final audio URL:', publicUrl);
      return { ...result, public_url: publicUrl };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Production failed:', message);
      setState({
        isProcessing: false,
        step: '❌ Failed',
        audioUrl: null,
        error: message,
      });
      throw err;
    }
  };

  return {
    ...state,
    processProduction,
  };
};
