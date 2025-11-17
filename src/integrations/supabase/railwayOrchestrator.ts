// Railway Orchestrator API Integration
// Handles communication with the Story Magic backend

const RAILWAY_ORCHESTRATOR_URL = import.meta.env.VITE_RAILWAY_ORCHESTRATOR_URL || 'https://web-production-7c7a9.up.railway.app';

export interface DirectorJSON {
  project_id: string;
  scenes: Array<{
    scene_id: string;
    summary?: string;
    mood?: string;
    intensity?: number;
    dialogue: Array<{
      line_id: string;
      character: string;
      text: string;
      voice_key?: string;
    }>;
    music?: Array<{
      cue_id: string;
      intensity?: number;
      enter?: { at: number; fade: number };
      exit?: { at: number; fade: number };
    }>;
    ambience?: Array<{
      cue_id: string;
      enter?: { at: number; fade: number };
      exit?: { at: number; fade: number };
    }>;
  }>;
}

export interface OrchestrationResult {
  status: 'success' | 'error';
  project_id: string;
  public_url?: string;
  manifest?: {
    project_id: string;
    order: Array<{
      scene_id: string;
      offset: number;
      duration: number;
    }>;
    total: number;
    public_url: string;
  };
  error?: string;
}

/**
 * Send Director JSON to Railway Orchestrator for audio generation
 */
export async function orchestrateAudio(directorJSON: DirectorJSON): Promise<OrchestrationResult> {
  try {
    console.log('🚀 Sending Director JSON to Railway Orchestrator:', directorJSON.project_id);
    
    // === RAILWAY ORCHESTRATOR DEBUG LOGGING ===
    console.log('🎯 Railway Request Details:', {
      url: `${RAILWAY_ORCHESTRATOR_URL}/orchestrate`,
      method: 'POST',
      project_id: directorJSON.project_id,
      scene_count: directorJSON.scenes?.length || 0,
      total_dialogue_lines: directorJSON.scenes?.reduce((sum, scene) => sum + (scene.dialogue?.length || 0), 0),
      has_music_cues: directorJSON.scenes?.some(scene => scene.music && scene.music.length > 0),
      has_ambience_cues: directorJSON.scenes?.some(scene => scene.ambience && scene.ambience.length > 0),
      payload_size_bytes: JSON.stringify(directorJSON).length,
      payload_size_kb: (JSON.stringify(directorJSON).length / 1024).toFixed(2)
    });

    // Log sample of what's being sent
    console.log('📦 First scene being sent to Railway:', {
      scene_id: directorJSON.scenes?.[0]?.scene_id,
      dialogue_count: directorJSON.scenes?.[0]?.dialogue?.length,
      music_count: directorJSON.scenes?.[0]?.music?.length,
      ambience_count: directorJSON.scenes?.[0]?.ambience?.length,
      first_dialogue: directorJSON.scenes?.[0]?.dialogue?.[0]?.text
    });

    if (directorJSON.scenes && directorJSON.scenes.length > 1) {
      console.log('📦 Last scene being sent to Railway:', {
        scene_id: directorJSON.scenes[directorJSON.scenes.length - 1]?.scene_id,
        dialogue_count: directorJSON.scenes[directorJSON.scenes.length - 1]?.dialogue?.length,
        music_count: directorJSON.scenes[directorJSON.scenes.length - 1]?.music?.length,
        ambience_count: directorJSON.scenes[directorJSON.scenes.length - 1]?.ambience?.length
      });
    }
    
    const response = await fetch(`${RAILWAY_ORCHESTRATOR_URL}/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(directorJSON),
    });

    console.log('📥 Railway Response Status:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Railway returned error response:', errorText);
      throw new Error(`Railway orchestrator returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Railway orchestration complete:', result);
    console.log('🎵 Generated audio details:', {
      status: result.status,
      has_public_url: !!result.public_url,
      has_manifest: !!result.manifest,
      manifest_total_duration: result.manifest?.total,
      manifest_scene_count: result.manifest?.order?.length,
      public_url: result.public_url || result.manifest?.public_url
    });

    return {
      status: 'success',
      project_id: directorJSON.project_id,
      ...result,
    };
  } catch (error) {
    console.error('❌ Railway orchestration failed:', error);
    return {
      status: 'error',
      project_id: directorJSON.project_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Poll for orchestration status (if needed for async processing)
 * Currently the Railway orchestrator is synchronous, but this allows for future async support
 */
export async function checkOrchestrationStatus(projectId: string): Promise<OrchestrationResult> {
  try {
    const response = await fetch(`${RAILWAY_ORCHESTRATOR_URL}/status/${projectId}`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('❌ Status check failed:', error);
    return {
      status: 'error',
      project_id: projectId,
      error: error instanceof Error ? error.message : 'Status check failed',
    };
  }
}
