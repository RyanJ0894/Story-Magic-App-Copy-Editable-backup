# Railway Backend - Complete Audio Mixing Implementation

## Overview

This document guides the implementation of full audio mixing capabilities for the Story Magic Railway orchestrator backend.

## Current State (Beta Mode)

**What Works:**
- ✅ ElevenLabs TTS dialogue generation
- ✅ Timeline event creation (music/ambience/SFX cues)
- ✅ Scene concatenation with crossfades
- ✅ Supabase upload

**What's Missing:**
- ❌ Actual catalog audio files on Railway server
- ❌ Catalog loader to map track_ids to file paths
- ❌ FFmpeg audio mixer to combine all tracks

**Current Behavior:**
- Orchestrator only copies the first dialogue stem as scene output
- Music/ambience/SFX are planned in timeline but never mixed into audio

## Required Catalog Files

### Directory Structure on Railway

```
/app/catalog/
├── music/
│   ├── m_piano_strings_dramatic_01.mp3
│   ├── m_orchestral_action_01.mp3
│   ├── m_ambient_suspense_01.mp3
│   └── ... (all music files from music_catalog knowledge base)
├── ambience/
│   ├── a_military_medical_tent_01.wav
│   ├── a_city_street_day_01.wav
│   ├── a_forest_night_01.wav
│   └── ... (all ambience files from ambience_catalog knowledge base)
└── sfx/
    ├── s_beeping_medical_equipment_01.mp3
    ├── s_walking_fast_creeking_01.mp3
    ├── s_door_close_01.wav
    └── ... (all SFX files from sfx_catalog knowledge base)
```

### Track ID Format

Director JSON uses track_ids like:
- `music/m_piano_strings_dramatic_01.mp3`
- `ambience/a_military_medical_tent_01.wav`
- `sfx/s_beeping_medical_equipment_01.mp3`

These map to actual files:
- `/app/catalog/music/m_piano_strings_dramatic_01.mp3`
- `/app/catalog/ambience/a_military_medical_tent_01.wav`
- `/app/catalog/sfx/s_beeping_medical_equipment_01.mp3`

## Implementation Steps

### 1. Catalog Loader (`lib/catalog-loader.js`)

Create module that:
- Scans `/app/catalog/` directory structure
- Builds metadata index for all audio files
- Provides lookup function: `trackId → filePath`
- Validates file existence before returning paths

### 2. Audio Mixer (`workers/mixer.js`)

Implement FFmpeg-based mixer that:
- Takes timeline events + dialogue stems + catalog paths
- Builds complex FFmpeg filter graph
- Applies volume levels, fades, ducking
- Outputs single mixed scene audio file

**Key Features:**
- **Ducking**: Music volume reduces during dialogue
- **Fades**: Smooth in/out for music and ambience
- **Layering**: All tracks mixed with proper gain levels
- **Timeline sync**: All events triggered at correct timestamps

### 3. Update Orchestrator

Replace this code in `workers/orchestrator.js`:

**OLD (lines 47-54):**
```javascript
console.log('🎵 Step 5: Mixing scene audio...');
console.log('   ℹ️  Note: Full mixing requires music/ambience files');
console.log('   ℹ️  For beta, using dialogue stem as scene output');

const sceneOutput = path.join(projectDir, `scene-${scene.scene_id}.m4a`);

if (stems.length > 0) {
  fs.copyFileSync(stems[0].path, sceneOutput);
  console.log(`   ✅ Scene output created: ${path.basename(sceneOutput)}\n`);
}
```

**NEW:**
```javascript
console.log('🎵 Step 5: Mixing scene audio with background tracks...');
const sceneOutput = path.join(projectDir, `scene-${scene.scene_id}.m4a`);

// Mix dialogue + music + ambience + SFX
await mixScene({
  scene,
  timeline,
  stems,
  cues,
  output: sceneOutput
});

console.log(`   ✅ Scene mixed: ${path.basename(sceneOutput)}\n`);
```

### 4. Catalog Audio Files

**Source:** Knowledge base files (music_catalog, ambience_catalog, sfx_catalog)

**Deploy Method:**
- Upload to Railway via Git LFS (for large binary files)
- Or use Railway persistent volume storage
- Or upload to Supabase Storage and download on Railway startup

## File Sizes & Deployment

**Estimated catalog size:** 500MB - 2GB
- Music: ~5-10MB per track, 20-30 tracks = 100-300MB
- Ambience: ~3-8MB per track, 15-25 tracks = 45-200MB
- SFX: ~100KB-2MB per file, 50-100 files = 5-200MB

**Recommended approach:**
- Store catalog files in Supabase Storage bucket
- Railway downloads them on first startup to `/app/catalog/`
- Cache locally for subsequent requests

## Testing Checklist

- [ ] Catalog loader finds all audio files
- [ ] Mixer generates voice + music + ambience
- [ ] Ducking works (music quieter during dialogue)
- [ ] Fades are smooth
- [ ] SFX trigger at correct times
- [ ] Final audio is normalized to -16 LUFS
- [ ] All 5 scenes process correctly
- [ ] Upload to Supabase succeeds

## Next Steps

1. ✅ Create catalog loader module
2. ✅ Implement audio mixer
3. ✅ Update orchestrator to use mixer
4. Upload catalog audio files to deployment
5. Test complete pipeline
