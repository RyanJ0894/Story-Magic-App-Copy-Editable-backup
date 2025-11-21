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
    
    const response = await fetch(`${RAILWAY_ORCHESTRATOR_URL}/orchestrate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(directorJSON),
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
