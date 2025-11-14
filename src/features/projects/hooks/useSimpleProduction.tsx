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
        console.log('📤 Calling trigger-relevance with:', { project_id: projectId, script_length: script.length });
        
        const result = await supabase.functions.invoke('trigger-relevance', {
          body: { project_id: projectId, script_text: script },
        });
        
        triggerData = result.data;
        triggerError = result.error;
        
        console.log('📥 Raw invoke result:', JSON.stringify({ 
          hasData: !!triggerData, 
          hasError: !!triggerError,
          dataKeys: triggerData ? Object.keys(triggerData) : [],
          errorKeys: triggerError ? Object.keys(triggerError) : []
        }, null, 2));
        console.log('📥 Full data:', JSON.stringify(triggerData, null, 2));
        console.log('📥 Full error:', JSON.stringify(triggerError, null, 2));
        
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
        console.error('❌ Trigger error after retries:', JSON.stringify(triggerError, null, 2));
        // Extract error message from various possible locations
        const errorMsg = triggerError.message || 
                        triggerError.error?.message || 
                        (typeof triggerError === 'string' ? triggerError : JSON.stringify(triggerError));
        throw new Error(`Edge function error: ${errorMsg}`);
      }
      if (!triggerData?.success) {
        console.error('❌ Trigger failed after retries:', JSON.stringify(triggerData, null, 2));
        // Extract error from response data
        const errorMsg = triggerData?.error || 'No error details provided';
        const details = triggerData?.details || '';
        const responseData = triggerData?.data || '';
        throw new Error(
          `RelevanceAI webhook call failed after ${maxTriggerAttempts} attempts.\n\n` +
          `Error: ${errorMsg}\n` +
          (details ? `Details: ${details}\n` : '') +
          (responseData ? `Response: ${responseData}\n` : '') +
          '\nCheck edge function logs in Supabase dashboard for more details.'
        );
      }

      setState(prev => ({ ...prev, step: 'Waiting for AI Director to generate Director JSON...' }));

      // 3. Poll for Director JSON with 2-minute timeout (fail fast if misconfigured)
      let attempts = 0;
      const pollInterval = 5000;
      const maxAttempts = 24; // 2 minutes (24 attempts * 5 seconds)
      let directorJson: any = null;

      console.log(`⏳ Starting to poll for director_json (max ${maxAttempts} attempts = ${(maxAttempts * pollInterval) / 1000}s)`);
      console.log(`🔍 Looking for director_json from job:`, triggerData?.job_id || 'no job_id returned');

      while (attempts < maxAttempts && !directorJson) {
        console.log(`📊 Polling attempt ${attempts + 1}/${maxAttempts} for project ${projectId}`);
        
        // Check director_json table (where callback webhook saves)
        const { data, error: pollError } = await supabase
          .from('director_json')
          .select('json_data')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (pollError) {
          console.error('❌ Polling error from director_json table:', pollError);
        }

        const json = data?.json_data as Record<string, any> | null;
        if (json?.scenes?.length) {
          console.log('✅ Found director JSON in director_json table:', { 
            hasScenes: true,
            sceneCount: json.scenes.length 
          });
          directorJson = json;
          break;
        } else if (json) {
          console.log('⚠️  Found director JSON in director_json table but no scenes:', Object.keys(json));
        }

        // Also check user_projects table (where direct Supabase action might save)
        const { data: projectData, error: projectError } = await supabase
          .from('user_projects')
          .select('ai_director_json')
          .eq('id', projectId)
          .maybeSingle();

        if (projectError) {
          console.error('❌ Polling error from user_projects table:', projectError);
        }

        const projectJson = projectData?.ai_director_json as Record<string, any> | null;
        if (projectJson?.scenes?.length) {
          console.log('✅ Found director JSON in user_projects table:', { 
            hasScenes: true,
            sceneCount: projectJson.scenes.length 
          });
          directorJson = projectJson;
          break;
        } else if (projectJson) {
          console.log('⚠️  Found director JSON in user_projects table but no scenes:', Object.keys(projectJson));
        }

        attempts++;
        await new Promise(r => setTimeout(r, pollInterval));
      }

      if (!directorJson) {
        console.error('❌ Timeout: No director JSON found after', attempts, 'attempts (2 minutes)');
        const jobInfo = triggerData?.job_id ? `\nJob ID: ${triggerData.job_id}` : '\n⚠️  No job ID was returned by RelevanceAI';
        throw new Error(
          `⏱️ Timeout after 2 minutes waiting for AI Director.${jobInfo}\n\n` +
          `DIAGNOSIS: RelevanceAI agent accepted the trigger but never executed or called back.\n\n` +
          `REQUIRED FIXES in RelevanceAI dashboard (https://relevance.ai):\n\n` +
          `1. CHECK AGENT DEPLOYMENT\n` +
          `   - Agent MUST be deployed (not in draft mode)\n` +
          `   - Look for "Deploy" button and click it\n\n` +
          `2. ENABLE API TRIGGER\n` +
          `   - Go to agent settings → API & Tools\n` +
          `   - Enable "API Trigger" option\n\n` +
          `3. SET CALLBACK WEBHOOK\n` +
          `   - In agent configuration, set callback URL to:\n` +
          `     https://bcuhyyyerxwgkrkbrqbs.supabase.co/functions/v1/ai-director-callback\n\n` +
          `4. TEST THE AGENT\n` +
          `   - Run the agent manually first to verify it works\n` +
          `   - Check execution logs for errors\n\n` +
          `After fixing the above, try creating the project again.`
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
