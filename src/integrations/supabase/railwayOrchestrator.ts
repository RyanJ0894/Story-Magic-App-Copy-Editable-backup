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
      volume?: number;
      enter?: { at: number; fade: number };
      exit?: { at: number; fade: number };
    }>;
    ambience?: Array<{
      cue_id: string;
      volume?: number;
      enter?: { at: number; fade: number };
      exit?: { at: number; fade: number };
    }>;
    sfx?: Array<{
      cue_id: string;
      volume?: number;
      enter?: { at: number; fade: number };
      exit?: { at: number; fade: number };
    }>;
  }>;
}

function sanitizeDirectorJSON(directorJSON: DirectorJSON): DirectorJSON {
  return {
    ...directorJSON,
    scenes: directorJSON.scenes.map(scene => ({
      ...scene,
      music: scene.music?.map(m => ({
        ...m,
        volume: m.volume !== undefined ? Math.max(0, m.volume) : undefined,
        intensity: m.intensity !== undefined ? Math.max(0, Math.min(1, m.intensity)) : undefined,
      })),
      ambience: scene.ambience?.map(a => ({
        ...a,
        volume: a.volume !== undefined ? Math.max(0, a.volume) : undefined,
      })),
      sfx: scene.sfx?.map(s => ({
        ...s,
        volume: s.volume !== undefined ? Math.max(0, s.volume) : undefined,
      })),
    })),
  };
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
    
    const sanitizedJSON = sanitizeDirectorJSON(directorJSON);
    console.log('🧹 Sanitized Director JSON (fixed any negative volumes)');
    
    const response = await fetch(`${RAILWAY_ORCHESTRATOR_URL}/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sanitizedJSON),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Railway orchestrator returned ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Railway orchestration complete:', result);

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
