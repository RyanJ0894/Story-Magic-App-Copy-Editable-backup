import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { orchestrateAudio, OrchestrationResult } from '@/integrations/supabase/railwayOrchestrator';
import type { ChunkProgressData } from '../project-chunk.type';

interface ProductionState {
  isProcessing: boolean;
  step: string;
  audioUrl: string | null;
  error: string | null;
  chunks: ChunkProgressData[];
  originalScript: string;
}

export const useSimpleProduction = () => {
  const [state, setState] = useState<ProductionState>({
    isProcessing: false,
    step: '',
    audioUrl: null,
    error: null,
    chunks: [],
    originalScript: '',
  });

  const processProduction = async (script: string, projectId: string): Promise<OrchestrationResult> => {
    setState({
      isProcessing: true,
      step: 'Sending script to Groq AI Director...',
      audioUrl: null,
      error: null,
      chunks: [],
      originalScript: script,
    });

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated. Please log in.');

      console.log('🎬 Triggering Groq AI Director for project:', projectId);
      console.log('📝 Script length:', script.length, 'characters');
      
      const startTime = Date.now();

      setState(prev => ({ ...prev, step: 'Processing script with Director Agent ...' }));

      // Use fetch directly to get better error messages
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const fetchResponse = await fetch(`https://story-magic-director-agent-production.up.railway.app/generate-scenes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ project_id: projectId, script_text:script }),
      });

      const groqElapsed = Date.now() - startTime;
      console.log(`⚡ Groq AI Director response in ${groqElapsed}ms`);

      const responseText = await fetchResponse.text();
      console.log('📥 Response status:', fetchResponse.status);
      console.log('📥 Response body:', responseText);

      if (!fetchResponse.ok) {
        console.error('❌ Groq AI Director error:', responseText);
        let errorMessage = `HTTP ${fetchResponse.status}`;
        try {
          const errorJson = JSON.parse(responseText);
          errorMessage = errorJson.error || errorJson.message || responseText;
        } catch {
          errorMessage = responseText || `HTTP ${fetchResponse.status}`;
        }
        throw new Error(`Groq AI Director error: ${errorMessage}`);
      }

      let groqResult;
      try {
        groqResult = JSON.parse(responseText);
      } catch {
        throw new Error('Failed to parse Groq AI Director response');
      }
      if (!groqResult?.success) {
        console.error('❌ Groq AI Director failed:', groqResult);
        throw new Error(groqResult?.error || 'Groq AI Director returned unsuccessful response');
      }

      console.log('✅ Groq AI Director completed:', {
        scene_count: groqResult.scene_count,
        processing_time_ms: groqResult.processing_time,
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

      const scenesArray = Array.isArray(directorJson) ? directorJson : (directorJson.scenes || []);
      
      const manifestOrder = result.manifest?.order || [];
      const manifestMap = new Map(manifestOrder.map((m: any) => [m.scene_id, m]));
      
      let fallbackCumulativeTime = 0;
      
      const convertedChunks: ChunkProgressData[] = scenesArray.map((scene: any, sceneIndex: number) => {
        const sceneDialogue = scene.dialogue || [];
        const sceneId = scene.scene_id || `scene_${sceneIndex + 1}`;
        
        const manifestTiming = manifestMap.get(sceneId);
        const sceneOffset = manifestTiming?.offset ?? fallbackCumulativeTime;
        const sceneDurationFromManifest = manifestTiming?.duration ?? 0;
        
        const sceneLines = Array.isArray(sceneDialogue) ? sceneDialogue.map((line: any, lineIndex: number) => {
          const lineText = line.text || '';
          const lineCharacter = line.character || 'NARRATOR';
          
          const isNarrator = lineCharacter.toUpperCase() === 'NARRATOR';
          const lineType = isNarrator ? 'action' : 'dialogue';
          
          const totalCharsInScene = sceneDialogue.reduce((sum: number, l: any) => sum + (l.text?.length || 0), 0);
          const lineWeight = lineText.length / Math.max(totalCharsInScene, 1);
          const lineDuration = sceneDurationFromManifest > 0 
            ? lineWeight * sceneDurationFromManifest 
            : Math.max(2, Math.ceil(lineText.length / 15));
          
          const priorChars = sceneDialogue.slice(0, lineIndex).reduce((sum: number, l: any) => sum + (l.text?.length || 0), 0);
          const priorWeight = priorChars / Math.max(totalCharsInScene, 1);
          const lineStart = sceneOffset + (sceneDurationFromManifest > 0 ? priorWeight * sceneDurationFromManifest : fallbackCumulativeTime - sceneOffset);
          
          if (!manifestTiming) {
            fallbackCumulativeTime += lineDuration;
          }
          
          return {
            line_id: line.line_id || `line_${sceneIndex}_${lineIndex}`,
            type: lineType as 'action' | 'dialogue',
            text: lineText,
            character: lineCharacter,
            voice_key: line.voice_key || null,
            tts_settings: {
              character: lineCharacter,
              voice_style: line.voice_style || 'Natural',
            },
            start: lineStart,
            duration: lineDuration,
            src: null,
            volume: 0.8,
          };
        }) : [];
        
        const computedSceneDuration = sceneLines.reduce((sum, line) => sum + line.duration, 0);
        const finalSceneDuration = sceneDurationFromManifest > 0 ? sceneDurationFromManifest : computedSceneDuration;
        
        if (!manifestTiming) {
          fallbackCumulativeTime = sceneOffset + finalSceneDuration;
        }
        
        return {
          chunk_id: String(sceneId),
          project_id: projectId,
          scene_title: scene.scene_id || `Scene ${sceneIndex + 1}`,
          version: 1,
          director_notes: scene.mood || '',
          lines: sceneLines,
          audio_direction: {
            music: scene.music?.map((m: any, idx: number) => ({
              track_id: m.track_id || `music_${sceneIndex}_${idx}`,
              name: m.track_id || '',
              start: sceneOffset,
              duration: finalSceneDuration,
              volume: m.volume || 0.25,
              src: null,
            })) || [],
            ambience: scene.ambience?.map((a: any, idx: number) => ({
              track_id: a.track_id || `ambience_${sceneIndex}_${idx}`,
              name: a.track_id || '',
              start: sceneOffset,
              duration: finalSceneDuration,
              volume: a.volume || 0.28,
              src: null,
            })) || [],
            sfx: scene.sfx?.map((s: any, idx: number) => ({
              track_id: s.track_id || `sfx_${sceneIndex}_${idx}`,
              name: s.track_id || '',
              start: sceneOffset + (s.at || 0),
              duration: 2,
              volume: s.volume || 0.5,
              src: null,
            })) || [],
          },
        };
      });

      console.log('📦 Converted chunks:', convertedChunks.length);

      setState(prev => ({
        isProcessing: false,
        step: 'Complete',
        audioUrl: publicUrl,
        error: null,
        chunks: convertedChunks,
        originalScript: prev.originalScript,
      }));

      console.log('🎵 Final audio URL:', publicUrl);
      return { ...result, public_url: publicUrl };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const currentStep = state.step || 'Unknown step';
      console.error(`Production failed at step "${currentStep}":`, message, err);
      
      setState(prev => ({
        isProcessing: false,
        step: `Failed at: ${currentStep}`,
        audioUrl: null,
        error: `${currentStep}\n\n${message}`,
        chunks: [],
        originalScript: prev.originalScript,
      }));
      throw err;
    }
  };

  const regenerateWithVoices = async (
    projectId: string,
    voiceAssignments: Record<string, string>
  ): Promise<OrchestrationResult> => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
      step: 'Retrieving Director JSON for voice update...',
      error: null,
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated. Please log in.');

      console.log('🔄 Regenerating audio with new voice assignments:', voiceAssignments);

      const { data: directorData, error: fetchError } = await supabase
        .from('director_json')
        .select('json_data')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;
      
      let directorJson = directorData?.json_data as Record<string, any> | null;
      
      if (!directorJson) {
        const { data: projectData, error: projectError } = await supabase
          .from('user_projects')
          .select('ai_director_json')
          .eq('id', projectId)
          .maybeSingle();
          
        if (projectError) throw projectError;
        directorJson = projectData?.ai_director_json as Record<string, any> | null;
      }

      if (!directorJson || !directorJson.scenes) {
        throw new Error('Director JSON not found. Please regenerate the script first.');
      }

      const updatedScenes = directorJson.scenes.map((scene: any) => ({
        ...scene,
        dialogue: (scene.dialogue || []).map((line: any) => {
          const character = line.character || 'NARRATOR';
          const newVoiceKey = voiceAssignments[character];
          return newVoiceKey ? { ...line, voice_key: newVoiceKey } : line;
        }),
      }));

      const updatedDirectorJson = { 
        ...directorJson, 
        scenes: updatedScenes,
        project_id: projectId,
      };

      console.log('📝 Updated Director JSON with new voices');

      const { error: updateError } = await supabase
        .from('director_json')
        .update({ json_data: updatedDirectorJson })
        .eq('project_id', projectId);

      if (updateError) {
        console.warn('Failed to persist voice changes:', updateError.message);
      }

      setState(prev => ({ 
        ...prev, 
        step: 'Regenerating audio with Railway Orchestrator...',
      }));

      const result = await orchestrateAudio(updatedDirectorJson as any);

      if (result.status === 'error') {
        throw new Error(`Railway orchestration failed: ${result.error || 'Unknown error'}`);
      }

      const publicUrl =
        result.public_url ||
        result.manifest?.public_url ||
        `https://bcuhyyyerxwgkrkbrqbs.supabase.co/storage/v1/object/public/audio/${projectId}/episode.m4a`;

      const scenesArray = Array.isArray(updatedDirectorJson) ? updatedDirectorJson : (updatedDirectorJson.scenes || []);
      
      const manifestOrder = result.manifest?.order || [];
      const manifestMap = new Map(manifestOrder.map((m: any) => [m.scene_id, m]));
      
      let fallbackCumulativeTime = 0;
      
      const convertedChunks: ChunkProgressData[] = scenesArray.map((scene: any, sceneIndex: number) => {
        const sceneDialogue = scene.dialogue || [];
        const sceneId = scene.scene_id || `scene_${sceneIndex + 1}`;
        
        const manifestTiming = manifestMap.get(sceneId);
        const sceneOffset = manifestTiming?.offset ?? fallbackCumulativeTime;
        const sceneDurationFromManifest = manifestTiming?.duration ?? 0;
        
        const sceneLines = Array.isArray(sceneDialogue) ? sceneDialogue.map((line: any, lineIndex: number) => {
          const lineText = line.text || '';
          const lineCharacter = line.character || 'NARRATOR';
          
          const isNarrator = lineCharacter.toUpperCase() === 'NARRATOR';
          const lineType = isNarrator ? 'action' : 'dialogue';
          
          const totalCharsInScene = sceneDialogue.reduce((sum: number, l: any) => sum + (l.text?.length || 0), 0);
          const lineWeight = lineText.length / Math.max(totalCharsInScene, 1);
          const lineDuration = sceneDurationFromManifest > 0 
            ? lineWeight * sceneDurationFromManifest 
            : Math.max(2, Math.ceil(lineText.length / 15));
          
          const priorChars = sceneDialogue.slice(0, lineIndex).reduce((sum: number, l: any) => sum + (l.text?.length || 0), 0);
          const priorWeight = priorChars / Math.max(totalCharsInScene, 1);
          const lineStart = sceneOffset + (sceneDurationFromManifest > 0 ? priorWeight * sceneDurationFromManifest : fallbackCumulativeTime - sceneOffset);
          
          if (!manifestTiming) {
            fallbackCumulativeTime += lineDuration;
          }
          
          return {
            line_id: line.line_id || `line_${sceneIndex}_${lineIndex}`,
            type: lineType as 'action' | 'dialogue',
            text: lineText,
            character: lineCharacter,
            voice_key: line.voice_key || null,
            tts_settings: {
              character: lineCharacter,
              voice_style: line.voice_style || 'Natural',
            },
            start: lineStart,
            duration: lineDuration,
            src: null,
            volume: 0.8,
          };
        }) : [];
        
        const computedSceneDuration = sceneLines.reduce((sum, line) => sum + line.duration, 0);
        const finalSceneDuration = sceneDurationFromManifest > 0 ? sceneDurationFromManifest : computedSceneDuration;
        
        if (!manifestTiming) {
          fallbackCumulativeTime = sceneOffset + finalSceneDuration;
        }
        
        return {
          chunk_id: String(sceneId),
          project_id: projectId,
          scene_title: scene.scene_id || `Scene ${sceneIndex + 1}`,
          version: 1,
          director_notes: scene.mood || '',
          lines: sceneLines,
          audio_direction: {
            music: scene.music?.map((m: any, idx: number) => ({
              track_id: m.track_id || `music_${sceneIndex}_${idx}`,
              name: m.track_id || '',
              start: sceneOffset,
              duration: finalSceneDuration,
              volume: m.volume || 0.25,
              src: null,
            })) || [],
            ambience: scene.ambience?.map((a: any, idx: number) => ({
              track_id: a.track_id || `ambience_${sceneIndex}_${idx}`,
              name: a.track_id || '',
              start: sceneOffset,
              duration: finalSceneDuration,
              volume: a.volume || 0.28,
              src: null,
            })) || [],
            sfx: scene.sfx?.map((s: any, idx: number) => ({
              track_id: s.track_id || `sfx_${sceneIndex}_${idx}`,
              name: s.track_id || '',
              start: sceneOffset + (s.at || 0),
              duration: 2,
              volume: s.volume || 0.5,
              src: null,
            })) || [],
          },
        };
      });

      console.log('✅ Audio regenerated with new voices');

      setState(prev => ({
        isProcessing: false,
        step: 'Complete',
        audioUrl: publicUrl,
        error: null,
        chunks: convertedChunks,
        originalScript: prev.originalScript,
      }));

      return { ...result, public_url: publicUrl };

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error('Voice regeneration failed:', message, err);
      
      setState(prev => ({
        ...prev,
        isProcessing: false,
        step: 'Failed',
        error: message,
      }));
      throw err;
    }
  };

  return {
    ...state,
    processProduction,
    regenerateWithVoices,
  };
};
