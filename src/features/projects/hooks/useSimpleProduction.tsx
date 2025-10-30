import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { orchestrateAudio, OrchestrationResult } from '@/integrations/supabase/railwayOrchestrator';

interface ProductionState {
  isProcessing: boolean;
  step: string;
  audioUrl: string | null;
  error: string | null;
}

export const useSimpleProduction = (projectId: string) => {
  const [state, setState] = useState<ProductionState>({
    isProcessing: false,
    step: '',
    audioUrl: null,
    error: null,
  });

  const processProductionMutation = {
    mutationFn: async (script: string): Promise<OrchestrationResult> => {
      setState({
        isProcessing: true,
        step: 'Sending script to AI Director...',
        audioUrl: null,
        error: null,
      });

      // Step 1: Get current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Step 2: Call Supabase Edge Function to trigger RelevanceAI
      console.log('📤 Sending script to RelevanceAI via Edge Function...');
      setState(prev => ({ ...prev, step: 'AI Director analyzing script...' }));

      const { data: triggerData, error: triggerError } = await supabase.functions.invoke('trigger-relevance', {
        body: {
          project_id: projectId,
          script_text: script
        }
      });

      if (triggerError) {
        throw new Error(`RelevanceAI webhook failed: ${triggerError.message}`);
      }

      console.log('✅ RelevanceAI triggered successfully');

      // Step 3: Poll Supabase for Director JSON (wait for RelevanceAI to save it)
      setState(prev => ({ ...prev, step: 'Retrieving Director JSON...' }));

      let attempts = 0;
      const maxAttempts = 30;
      let directorJson = null;

      while (attempts < maxAttempts && !directorJson) {
        const { data, error } = await supabase
          .from('director_json')
          .select('json_data')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (data?.json_data) {
          directorJson = data.json_data;
          break;
        }

        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (!directorJson) {
        throw new Error('Failed to retrieve Director JSON from database');
      }

      console.log('✅ Director JSON retrieved from Supabase');

      // Step 4: Send Director JSON to Railway orchestrator
      setState(prev => ({ ...prev, step: 'Generating audio...' }));

      const result = await orchestrateAudio(directorJson);

      setState({
        isProcessing: false,
        step: 'Complete',
        audioUrl: result.public_url || null,
        error: null,
      });

      return result;
    },
    onError: (error: Error) => {
      setState({
        isProcessing: false,
        step: '',
        audioUrl: null,
        error: error.message,
      });
    },
  };

  return {
    ...state,
    processProduction: processProductionMutation.mutationFn,
  };
};
