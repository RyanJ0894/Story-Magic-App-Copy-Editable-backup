// Railway Orchestrator API Integration
// Handles communication with the Story Magic backend

const RAILWAY_ORCHESTRATOR_URL = import.meta.env.VITE_RAILWAY_ORCHESTRATOR_URL || 'https://web-production-7c7a9.up.railway.app';

// RelevanceAI schema (what we receive)
export interface RelevanceAIDirectorJSON {
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
      track_id: string;
      volume?: number;
      fade_in?: number;
      fade_out?: number;
    }>;
    ambience?: {
      track_id: string;
      volume?: number;
      fade_in?: number;
      fade_out?: number;
    };
    sfx?: Array<{
      cue_id: string;
      track_id: string;
      at: number;
      volume?: number;
    }>;
  }>;
}

// Railway schema (what Railway expects)
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
      voice?: string;  // Railway expects 'voice', not 'voice_key'
    }>;
    music?: Array<{
      cue_id: string;
      volume?: number;  // Railway expects 'volume', not 'intensity'
      enter?: { at: number; fade: number };
      exit?: { at: number; fade: number };
    }>;
    ambience?: {
      cue_id: string;
      volume?: number;  // Railway needs 'volume' for ambience too
      enter?: { at: number; fade: number };
      exit?: { at: number; fade: number };
    };
    sfx?: Array<{
      cue_id: string;
      at: number;
      volume?: number;
    }>;
  }>;
}

/**
 * Transform RelevanceAI schema to Railway schema
 */
function transformToRailwaySchema(relevanceJSON: RelevanceAIDirectorJSON): DirectorJSON {
  console.log('🔄 Transforming RelevanceAI schema to Railway schema...');
  
  return {
    project_id: relevanceJSON.project_id,
    scenes: relevanceJSON.scenes.map((scene, index) => {
      console.log(`  📝 Transforming scene ${index + 1}: ${scene.scene_id}`);
      
      // Transform music array - keep 'volume', don't rename to 'intensity'
      const music = scene.music?.map((m, i) => ({
        cue_id: m.track_id || `music_${i + 1}`,
        volume: m.volume || 0.25,  // Railway expects 'volume', not 'intensity'
        enter: { at: 0, fade: m.fade_in || 2 },
        exit: { at: -1, fade: m.fade_out || 2 }  // -1 means "at end of scene"
      }));
      
      // Transform ambience object - include 'volume'
      const ambience = scene.ambience ? {
        cue_id: scene.ambience.track_id || `ambience_1`,
        volume: scene.ambience.volume || 0.28,  // Railway needs 'volume' for ambience
        enter: { at: 0, fade: scene.ambience.fade_in || 1.5 },
        exit: { at: -1, fade: scene.ambience.fade_out || 1.5 }
      } : undefined;
      
      // Transform SFX array - pass through
      const sfx = scene.sfx?.map(s => ({
        cue_id: s.cue_id,
        at: s.at,
        volume: s.volume || 0.5
      }));
      
      // Transform dialogue - map 'voice_key' to 'voice'
      const dialogue = scene.dialogue.map(d => ({
        line_id: d.line_id,
        character: d.character,
        text: d.text,
        voice: d.voice_key  // Railway expects 'voice', not 'voice_key'
      }));
      
      console.log(`    ✅ Transformed music cues: ${music?.length || 0}`);
      console.log(`    ✅ Transformed ambience: ${ambience ? 'yes' : 'no'}`);
      console.log(`    ✅ Transformed SFX cues: ${sfx?.length || 0}`);
      console.log(`    ✅ Dialogue lines: ${dialogue?.length || 0}`);
      
      return {
        scene_id: scene.scene_id,
        summary: scene.summary,
        mood: scene.mood,
        intensity: scene.intensity,
        dialogue: scene.dialogue,
        music,
        ambience
      };
    })
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
export async function orchestrateAudio(rawJSON: any): Promise<OrchestrationResult> {
  try {
    console.log('🚀 Received Director JSON for Railway Orchestrator:', rawJSON.project_id);
    
    // Transform RelevanceAI schema to Railway schema
    const directorJSON = transformToRailwaySchema(rawJSON as RelevanceAIDirectorJSON);
    console.log('✅ Schema transformation complete');
    
    // === RAILWAY ORCHESTRATOR DEBUG LOGGING ===
    console.log('🎯 Railway Request Details:', {
      url: `${RAILWAY_ORCHESTRATOR_URL}/orchestrate`,
      method: 'POST',
      project_id: directorJSON.project_id,
      scene_count: directorJSON.scenes?.length || 0,
      total_dialogue_lines: directorJSON.scenes?.reduce((sum, scene) => sum + (scene.dialogue?.length || 0), 0),
      has_music_cues: directorJSON.scenes?.some(scene => scene.music && scene.music.length > 0),
      has_ambience_cues: directorJSON.scenes?.some(scene => !!scene.ambience),
      payload_size_bytes: JSON.stringify(directorJSON).length,
      payload_size_kb: (JSON.stringify(directorJSON).length / 1024).toFixed(2)
    });

    // Log sample of what's being sent
    console.log('📦 First scene being sent to Railway:', {
      scene_id: directorJSON.scenes?.[0]?.scene_id,
      dialogue_count: directorJSON.scenes?.[0]?.dialogue?.length,
      music_count: directorJSON.scenes?.[0]?.music?.length,
      has_ambience: !!directorJSON.scenes?.[0]?.ambience,
      first_music_cue: directorJSON.scenes?.[0]?.music?.[0],
      ambience_cue: directorJSON.scenes?.[0]?.ambience,
      first_dialogue: directorJSON.scenes?.[0]?.dialogue?.[0]?.text
    });

    if (directorJSON.scenes && directorJSON.scenes.length > 1) {
      console.log('📦 Last scene being sent to Railway:', {
        scene_id: directorJSON.scenes[directorJSON.scenes.length - 1]?.scene_id,
        dialogue_count: directorJSON.scenes[directorJSON.scenes.length - 1]?.dialogue?.length,
        music_count: directorJSON.scenes[directorJSON.scenes.length - 1]?.music?.length,
        has_ambience: !!directorJSON.scenes[directorJSON.scenes.length - 1]?.ambience
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
      project_id: rawJSON.project_id,
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
