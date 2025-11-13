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

      // 2. Trigger RelevanceAI with retry logic
      console.log('🎬 Triggering RelevanceAI agent for project:', projectId);
      
      let triggerAttempts = 0;
      const maxTriggerAttempts = 3;
      let triggerData: any = null;
      let triggerError: any = null;

      while (triggerAttempts < maxTriggerAttempts) {
        triggerAttempts++;
        console.log(`🔄 Trigger attempt ${triggerAttempts}/${maxTriggerAttempts}`);
        
        const result = await supabase.functions.invoke('trigger-relevance', {
          body: { project_id: projectId, script_text: script },
        });
        
        triggerData = result.data;
        triggerError = result.error;
        
        console.log('📥 Full trigger result:', { data: triggerData, error: triggerError });
        console.log('📥 Trigger data type:', typeof triggerData);
        console.log('📥 Trigger data keys:', triggerData ? Object.keys(triggerData) : 'null');
        
        if (!triggerError && triggerData?.success) {
          console.log('✅ RelevanceAI agent triggered successfully on attempt', triggerAttempts);
          break;
        }
        
        console.warn(`⚠️ Trigger attempt ${triggerAttempts} failed, retrying...`);
        if (triggerAttempts < maxTriggerAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between retries
        }
      }

      if (triggerError) {
        console.error('❌ Trigger error after retries:', triggerError);
        throw new Error(`RelevanceAI trigger failed after ${maxTriggerAttempts} attempts: ${triggerError.message}`);
      }
      if (!triggerData?.success) {
        console.error('❌ Trigger failed after retries:', triggerData);
        const errorMsg = triggerData?.error || 'Unknown error';
        const details = triggerData?.details || '';
        throw new Error(
          `RelevanceAI agent trigger failed after ${maxTriggerAttempts} attempts.\n\n` +
          `Error: ${errorMsg}\n` +
          (details ? `\nDetails: ${details}\n` : '') +
          '\nPlease check RelevanceAI agent configuration:\n' +
          '1. Agent must be deployed (not in draft mode)\n' +
          '2. API trigger must be enabled\n' +
          '3. Callback webhook URL must be set correctly'
        );
      }

      setState(prev => ({ ...prev, step: 'Waiting for AI Director to generate Director JSON...' }));

      // 3. Poll for Director JSON
      let attempts = 0;
      const pollInterval = 5000;
      const maxAttempts = (20 * 60 * 1000) / pollInterval;
      let directorJson: any = null;

      while (attempts < maxAttempts && !directorJson) {
        console.log(`📊 Polling attempt ${attempts + 1}/${maxAttempts} for project ${projectId}`);
        
        const { data, error: pollError } = await supabase
          .from('director_json')
          .select('json_data')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pollError) {
          console.error('❌ Polling error:', pollError);
        }

        const json = data?.json_data as Record<string, any> | null;
        if (json?.scenes?.length) {
          console.log('✅ Found director JSON:', { 
            hasScenes: true,
            sceneCount: json.scenes.length 
          });
          directorJson = json;
          break;
        } else if (json) {
          console.log('⚠️  Found director JSON but no scenes:', Object.keys(json));
        }

        attempts++;
        await new Promise(r => setTimeout(r, pollInterval));
      }

      if (!directorJson) {
        console.error('❌ Timeout: No director JSON found after', attempts, 'attempts');
        throw new Error(
          'Timed out waiting for Director JSON with scenes. ' +
          'Check Supabase logs: https://supabase.com/dashboard/project/bcuhyyyerxwgkrkbrqbs/logs/edge-functions'
        );
      }

      // 4. Run orchestration
      setState(prev => ({ ...prev, step: 'Generating audio with Railway Orchestrator...' }));
      console.log('🎵 Starting audio orchestration...');
      const result = await orchestrateAudio(directorJson);
      console.log('🎵 Orchestration result:', result);
      
      if (result.status === 'error') {
        console.error('❌ Orchestration error:', result.error);
        throw new Error(`Railway orchestration failed: ${result.error || 'Unknown error'}`);
      }

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
      const currentStep = state.step || 'Unknown step';
      console.error(`❌ Production failed at step "${currentStep}":`, message, err);
      
      setState({
        isProcessing: false,
        step: `❌ Failed at: ${currentStep}`,
        audioUrl: null,
        error: `${currentStep}\n\n${message}`,
      });
      throw err;
    }
  };

  return {
    ...state,
    processProduction,
  };
};
