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
      step: 'Sending script to Groq AI Director...',
      audioUrl: null,
      error: null,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated. Please log in.');

      console.log('🎬 Triggering Groq AI Director for project:', projectId);
      console.log('📝 Script length:', script.length, 'characters');
      
      const startTime = Date.now();

      setState(prev => ({ ...prev, step: 'Processing script with Groq LPU (ultra-fast AI)...' }));

      const { data: groqResult, error: groqError } = await supabase.functions.invoke('groq-ai-director', {
        body: { project_id: projectId, script },
      });

      const groqElapsed = Date.now() - startTime;
      console.log(`⚡ Groq AI Director response in ${groqElapsed}ms`);

      if (groqError) {
        console.error('❌ Groq AI Director error:', groqError);
        throw new Error(`Groq AI Director error: ${groqError.message || JSON.stringify(groqError)}`);
      }

      if (!groqResult?.success) {
        console.error('❌ Groq AI Director failed:', groqResult);
        throw new Error(groqResult?.error || 'Groq AI Director returned unsuccessful response');
      }

      console.log('✅ Groq AI Director completed:', {
        scene_count: groqResult.scene_count,
        processing_time_ms: groqResult.processing_time_ms,
      });

      setState(prev => ({ ...prev, step: 'Retrieving Director JSON...' }));

      let directorJson: any = null;
      let attempts = 0;
      const maxAttempts = 6;
      const pollInterval = 2000;

      while (attempts < maxAttempts && !directorJson) {
        console.log(`📊 Checking for Director JSON (attempt ${attempts + 1}/${maxAttempts})`);
        
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
          console.log('✅ Found Director JSON:', { sceneCount: json.scenes.length });
          directorJson = json;
          break;
        }

        const { data: projectData, error: projectError } = await supabase
          .from('user_projects')
          .select('ai_director_json')
          .eq('id', projectId)
          .maybeSingle();

        if (projectError) {
          console.error('❌ Project polling error:', projectError);
        }

        const projectJson = projectData?.ai_director_json as Record<string, any> | null;
        if (projectJson?.scenes?.length) {
          console.log('✅ Found Director JSON in user_projects:', { sceneCount: projectJson.scenes.length });
          directorJson = projectJson;
          break;
        }

        attempts++;
        
        if (attempts < maxAttempts) {
          await new Promise(r => setTimeout(r, pollInterval));
        }
      }

      if (!directorJson) {
        throw new Error(
          `Director JSON not found after Groq processing.\n\n` +
          `The AI processed the script successfully but the data wasn't saved.\n` +
          `Project ID: ${projectId}\n\n` +
          `Please try again or check Supabase logs.`
        );
      }

      const totalAiTime = Date.now() - startTime;
      console.log(`⏱️ Total AI Director time: ${totalAiTime}ms (target: <15000ms)`);

      setState(prev => ({ ...prev, step: 'Generating audio with Railway Orchestrator...' }));
      console.log('🎵 Starting audio orchestration...');
      
      const result = await orchestrateAudio(directorJson);
      console.log('🎵 Orchestration result:', result);
      
      if (result.status === 'error') {
        console.error('❌ Orchestration error:', result.error);
        throw new Error(`Railway orchestration failed: ${result.error || 'Unknown error'}`);
      }

      const publicUrl =
        result.public_url ||
        result.manifest?.public_url ||
        `https://bcuhyyyerxwgkrkbrqbs.supabase.co/storage/v1/object/public/audio/${projectId}/episode.m4a`;

      const totalTime = Date.now() - startTime;
      console.log(`✅ Total production time: ${totalTime}ms`);
      console.log(`   - AI Director: ${groqResult.processing_time_ms}ms`);
      console.log(`   - Orchestration: ${totalTime - totalAiTime}ms`);

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
