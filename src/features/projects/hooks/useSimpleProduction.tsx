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
      // Step 1: Ensure the user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated. Please log in.');
      }

      // Step 2: Trigger RelevanceAI agent via Supabase Edge Function
      const { data: triggerData, error: triggerError } = await supabase.functions.invoke('trigger-relevance', {
        body: { project_id: projectId, script_text: script },
      });

      if (triggerError || !triggerData?.success) {
        console.error('❌ Edge Function error:', triggerError, triggerData);
        throw new Error(`RelevanceAI webhook failed: ${triggerError?.message || 'Unknown error'}`);
      }

      console.log('✅ RelevanceAI triggered successfully!', triggerData);

      // Step 3: Poll Supabase for Director JSON (wait for AI Director output)
      setState(prev => ({ ...prev, step: 'Waiting for AI Director (RelevanceAI) to generate Director JSON...' }));

      let attempts = 0;
      const maxAttempts = 60; // up to 60 seconds total
      let directorJson: any = null;

    while (attempts < maxAttempts && !directorJson) {
  console.log(`🔍 Poll attempt ${attempts + 1}/${maxAttempts} for project ${projectId}`);

  const { data, error } = await supabase
    .from('director_json')
    .select('json_data')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) console.error('❌ Supabase query error:', error);

  const json = data?.json_data as unknown as Record<string, any>; // 👈 fix here

  if (json && typeof json === 'object' && Array.isArray(json.scenes)) {
    console.log('✅ Valid Director JSON found!');
    directorJson = json;
    break;
  } else if (json) {
    console.warn('⚠️ Director JSON found but not ready yet (missing scenes)');
  }

  attempts++;
  await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s
}


      if (!directorJson) {
        throw new Error('❌ Timed out waiting for Director JSON with scenes. Please check RelevanceAI agent output.');
      }

      console.log('✅ Director JSON retrieved successfully from Supabase.');

      // Step 4: Send valid Director JSON to Railway orchestrator
      setState(prev => ({ ...prev, step: 'Generating audio with Railway Orchestrator...' }));

      const result = await orchestrateAudio(directorJson);

      if (result.status === 'error') {
        throw new Error(result.error || 'Railway orchestration failed');
      }

      // Step 5: Update final state
      setState({
        isProcessing: false,
        step: '✅ Complete',
        audioUrl: result.public_url || result.manifest?.public_url || null,
        error: null,
      });

      console.log('🎵 Audio generation completed successfully:', result);
      return result;

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Production failed:', message);

      setState({
        isProcessing: false,
        step: '❌ Failed',
        audioUrl: null,
        error: message,
      });

      throw error;
    }
  };

  return {
    ...state,
    processProduction,
  };
};
