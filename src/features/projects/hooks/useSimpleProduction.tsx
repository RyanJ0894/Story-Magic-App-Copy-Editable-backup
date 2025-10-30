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

      // Step 1: Call Supabase Edge Function to trigger RelevanceAI
      const { data: { session } } = await supabase.auth.getSession();
      const webhookUrl = `https://bcuhyyyerxwgkrkbrqbs.supabase.co/functions/v1/trigger-relevance`;
      
      if (!webhookUrl) {
        throw new Error('RelevanceAI webhook URL not configured');
      }

      console.log('🎬 Sending script to RelevanceAI Ace agent...');
      setState(prev => ({ ...prev, step: 'AI Director analyzing script...' }));

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjdWh5eXllcnh3Z2tya2JycWJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0MzQyOTEsImV4cCI6MjA3MDAxMDI5MX0.-9pGj4UEiT_3jC9hJit2LbCrXy2KlaqGgvv4giA6RV4'
        },
        body: JSON.stringify({
          project_id: projectId,
          script_text: script
        })
      });

      if (!webhookResponse.ok) {
        throw new Error(`RelevanceAI webhook failed: ${webhookResponse.status}`);
      }

      // Wait a moment for RelevanceAI to process and post to Supabase
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Fetch Director JSON from Supabase
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

      // Step 3: Send Director JSON to Railway orchestrator
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