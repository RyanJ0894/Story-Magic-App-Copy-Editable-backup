import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { orchestrateAudio, DirectorJSON, OrchestrationResult } from '@/integrations/supabase/railwayOrchestrator';

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

  const processProductionMutation = useMutation({
    mutationFn: async (script: string): Promise<OrchestrationResult> => {
      setState({
        isProcessing: true,
        step: 'Sending script to AI Director...',
        audioUrl: null,
        error: null,
      });

      // Step 1: Call RelevanceAI "Ace" agent via webhook
        const webhookUrl = 'https://api-bcbe5a.stack.tryrelevance.com/latest/agents/hooks/custom-trigger/234084c7-e850-4e25-8a73-103f803cfd41/c79e2bc6-9126-455d-9623-a50b703605e1';      if (!webhookUrl) {
        throw new Error('RelevanceAI webhook URL not configured');
      }

      console.log('📤 Sending script to RelevanceAI Ace agent...');
      setState(prev => ({ ...prev, step: 'AI Director analyzing script...' }));

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          script: script,
        }),
      });

      if (!webhookResponse.ok) {
        throw new Error(`RelevanceAI webhook failed: ${webhookResponse.status}`);
      }

      // Wait a moment for RelevanceAI to process and post to Supabase
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Fetch Director JSON from Supabase
      setState(prev => ({ ...prev, step: 'Retrieving Director JSON...' }));
      console.log('📥 Fetching Director JSON from Supabase...');

      // Use type assertion to work around TypeScript types not being regenerated yet
      const { data: directorData, error: fetchError } = await supabase
        .from('director_json' as any)
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError || !directorData) {
        throw new Error('Failed to retrieve Director JSON from database');
      }

      const directorJSON: DirectorJSON = (directorData as any).json_data;
      console.log('✅ Director JSON retrieved:', directorJSON);

      // Step 3: Send to Railway Orchestrator
      setState(prev => ({ ...prev, step: 'Generating audio (this may take 5-10 minutes)...' }));
      console.log('🎵 Sending to Railway orchestrator...');

      const result = await orchestrateAudio(directorJSON);

      if (result.status === 'error') {
        throw new Error(result.error || 'Audio generation failed');
      }

      return result;
    },
    onSuccess: (result) => {
      console.log('🎉 Production complete!', result);
      setState({
        isProcessing: false,
        step: 'Complete!',
        audioUrl: result.public_url || null,
        error: null,
      });
      toast.success('Audio production complete!');
    },
    onError: (error) => {
      console.error('❌ Production failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Production failed';
      setState({
        isProcessing: false,
        step: '',
        audioUrl: null,
        error: errorMessage,
      });
      toast.error(errorMessage);
    },
  });

  return {
    ...state,
    startProduction: processProductionMutation.mutate,
  };
};
