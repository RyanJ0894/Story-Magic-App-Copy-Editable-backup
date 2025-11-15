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
      
      // Retry up to 25 attempts with 5-second delays (125 seconds total)
      let triggerAttempts = 0;
      const maxTriggerAttempts = 25;
      let triggerData: any = null;
      let triggerError: any = null;

      while (triggerAttempts < maxTriggerAttempts) {
        triggerAttempts++;
        console.log(`🔄 Trigger attempt ${triggerAttempts}/${maxTriggerAttempts}`);
        console.log('📤 Calling trigger-relevance with:', { project_id: projectId, script_length: script.length });
        
        const triggerResult = await supabase.functions.invoke('trigger-relevance', {
          body: { project_id: projectId, script_text: script },
        });
        
        triggerData = triggerResult.data;
        triggerError = triggerResult.error;
        
        console.log('📥 Raw invoke result:', JSON.stringify({ 
          hasData: !!triggerData, 
          hasError: !!triggerError,
          dataKeys: triggerData ? Object.keys(triggerData) : [],
          errorKeys: triggerError ? Object.keys(triggerError) : [],
          fullData: triggerData,
          fullError: triggerError
        }, null, 2));
        
        if (!triggerError && (triggerData?.success || triggerData?.message === "Webhook executed successfully")) {
          console.log('✅ RelevanceAI agent triggered successfully on attempt', triggerAttempts);
          break;
        }
        
        console.warn(`⚠️ Trigger attempt ${triggerAttempts} failed, retrying...`);
        if (triggerAttempts < maxTriggerAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s between retries
        }
      }

      if (triggerError) {
        console.error('❌ Edge function error:', JSON.stringify(triggerError, null, 2));
        const errorMsg = triggerError.message || 
                        triggerError.error?.message || 
                        (typeof triggerError === 'string' ? triggerError : JSON.stringify(triggerError));
        throw new Error(`Edge function error: ${errorMsg}`);
      }
      
      if (!triggerData?.success && triggerData?.message !== "Webhook executed successfully") {
        console.error('❌ RelevanceAI did not return success:', JSON.stringify(triggerData, null, 2));
        const errorMsg = triggerData?.error || 'No error details provided';
        throw new Error(
          `RelevanceAI webhook call failed after ${maxTriggerAttempts} attempts.\n\n` +
          `Error: ${errorMsg}\n` +
          '\nCheck edge function logs in Supabase dashboard for more details.'
        );
      }

      console.log('✅ RelevanceAI agent triggered successfully!');

      setState(prev => ({ ...prev, step: 'Waiting for AI Director to generate Director JSON...' }));

      // 3. Poll for Director JSON with 5-minute timeout
      let attempts = 0;
      const pollInterval = 5000; // Check every 5 seconds
      const maxAttempts = 60; // Try for 5 minutes (60 * 5 seconds = 300 seconds)
      let directorJson: any = null;

      console.log('📊 Starting to poll for Director JSON...');
      console.log(`⏱️ Will check every ${pollInterval/1000}s for up to ${maxAttempts * pollInterval/1000}s`);
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
        } else {
          console.log('⏳ No data yet in director_json table');
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
        
        if (attempts < maxAttempts) {
          setState(prev => ({ ...prev, step: `Waiting for AI Director (${attempts}/${maxAttempts})...` }));
          await new Promise(r => setTimeout(r, pollInterval));
        }
      }

      if (!directorJson) {
        console.error('❌ Timeout: No director JSON found after', attempts, 'attempts (5 minutes)');
        const jobInfo = triggerData?.job_id ? `\nJob ID: ${triggerData.job_id}` : '\n⚠️  No job ID was returned by RelevanceAI';
        throw new Error(
          `⏱️ Timeout after 5 minutes waiting for AI Director.${jobInfo}\n\n` +
          `DIAGNOSIS: RelevanceAI webhook was triggered successfully, but no Director JSON was returned.\n\n` +
          `Project ID: ${projectId}\n\n` +
          `POSSIBLE CAUSES:\n\n` +
          `1. RelevanceAI agent is still processing (may take longer than 5 minutes)\n` +
          `   - Check RelevanceAI dashboard for job status\n` +
          `   - Check the 'director_json' table in Supabase for project_id: ${projectId}\n\n` +
          `2. Callback webhook not configured\n` +
          `   - Agent must call back to: https://bcuhyyyerxwgkrkbrqbs.supabase.co/functions/v1/ai-director-callback\n` +
          `   - Check RelevanceAI agent configuration\n\n` +
          `3. Agent execution error\n` +
          `   - Check RelevanceAI execution logs for errors\n` +
          `   - Verify agent is deployed (not in draft mode)\n\n` +
          `To manually check: Open Supabase dashboard → Table Editor → 'director_json' → Search for project_id`
        );
      }

      console.log('✅ Director JSON retrieved successfully');

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
