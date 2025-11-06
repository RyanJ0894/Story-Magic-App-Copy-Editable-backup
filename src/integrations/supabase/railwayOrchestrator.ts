// 🎬 Story Magic – Railway Orchestrator Integration (Upgraded)
// Processes Director JSON scene-by-scene, with ambience/music layering and voice ID mapping.

const RAILWAY_ORCHESTRATOR_URL =
  import.meta.env.VITE_RAILWAY_ORCHESTRATOR_URL ||
  "https://web-production-7c7a9.up.railway.app";

export interface DirectorJSON {
  project_id: string;
  scenes: Array<{
    scene_id: string;
    summary: string;
    mood?: string;
    intensity?: number;
    dialogue: Array<{
      line_id: string;
      character: string;
      text: string;
      voice_key2?: string;
    }>;
    music?: Array<{
      cue_id: string;
      intensity2?: number;
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
  status: "success" | "error";
  project_id: string;
  public_url?: string;
  manifest?: {
    project_id: string;
    order: Array<{ scene_id: string; offset: number; duration: number }>;
    total: number;
    public_url: string;
  };
  error?: string;
}

/**
 * Scene-by-scene orchestration for full script coverage.
 */
export async function orchestrateAudio(
  directorJSON: DirectorJSON
): Promise<OrchestrationResult> {
  try {
    console.log(`🎬 Starting orchestration for project ${directorJSON.project_id}`);

    const sceneResults: any[] = [];

    for (const [index, scene] of directorJSON.scenes.entries()) {
      console.log(`🎧 Processing scene ${index + 1}/${directorJSON.scenes.length}: ${scene.scene_id}`);

      const body = {
        project_id: directorJSON.project_id,
        scene_id: scene.scene_id,
        dialogue: scene.dialogue.map((d) => ({
          text: d.text,
          voice_id: d.voice_key2 || "default-voice",
          character: d.character,
        })),
        music: scene.music || [],
        ambience: scene.ambience || [],
        mood: scene.mood,
        intensity: scene.intensity,
      };

      const response = await fetch(`${RAILWAY_ORCHESTRATOR_URL}/orchestrate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`❌ Scene ${scene.scene_id} failed: ${errorText}`);
      }

      const sceneResult = await response.json();
      sceneResults.push({
        scene_id: scene.scene_id,
        ...sceneResult,
      });

      console.log(`✅ Scene ${scene.scene_id} complete`);
    }

    // Combine results
    const manifest = {
      project_id: directorJSON.project_id,
      order: sceneResults.map((r, i) => ({
        scene_id: r.scene_id,
        offset: i,
        duration: r.manifest?.duration || 0,
      })),
      total: sceneResults.length,
      public_url: sceneResults[sceneResults.length - 1]?.public_url || "",
    };

    console.log("🎵 Orchestration complete for all scenes:", manifest);

    return {
      status: "success",
      project_id: directorJSON.project_id,
      manifest,
      public_url: manifest.public_url,
    };
  } catch (error) {
    console.error("❌ Orchestration failed:", error);
    return {
      status: "error",
      project_id: directorJSON.project_id,
      error:
        error instanceof Error
          ? error.message
          : "Unknown orchestration error",
    };
  }
}

/**
 * Optional status check function
 */
export async function checkOrchestrationStatus(
  projectId: string
): Promise<OrchestrationResult> {
  try {
    const response = await fetch(
      `${RAILWAY_ORCHESTRATOR_URL}/status/${projectId}`
    );

    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Status check failed:", error);
    return {
      status: "error",
      project_id: projectId,
      error:
        error instanceof Error ? error.message : "Status check failed",
    };
  }
}
