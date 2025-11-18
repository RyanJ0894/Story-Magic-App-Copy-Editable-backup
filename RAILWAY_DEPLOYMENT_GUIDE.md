# Railway Backend Deployment Guide

## Files Created

I've created the complete implementation files in `railway-backend-files/`:

```
railway-backend-files/
├── lib/
│   └── catalog-loader.js          (NEW - Load catalog from filesystem)
├── workers/
│   ├── mixer.js                   (NEW - FFmpeg audio mixer)
│   └── orchestrator-updated.js    (UPDATED - Use mixer instead of copying dialogue)
```

## Deployment Steps

### STEP 1: Update Railway Repository Code

1. **Clone your Railway repo locally** (if you haven't already):
   ```bash
   git clone https://github.com/RyanJ0894/story-magic-orchestrator.git
   cd story-magic-orchestrator
   ```

2. **Copy the new files**:
   
   **Add catalog loader:**
   ```bash
   cp /path/to/replit/railway-backend-files/lib/catalog-loader.js lib/catalog-loader.js
   ```

   **Add audio mixer:**
   ```bash
   cp /path/to/replit/railway-backend-files/workers/mixer.js workers/mixer.js
   ```

   **Update orchestrator:**
   ```bash
   cp /path/to/replit/railway-backend-files/workers/orchestrator-updated.js workers/orchestrator.js
   ```

3. **Commit and push**:
   ```bash
   git add lib/catalog-loader.js workers/mixer.js workers/orchestrator.js
   git commit -m "Add full audio mixing with catalog support"
   git push origin main
   ```

### STEP 2: Prepare Catalog Audio Files

You need to gather the catalog audio files. These should come from your **knowledge base files**:

- `music_catalog` → Music tracks (MP3/WAV files)
- `ambience_catalog` → Ambience tracks (MP3/WAV files)
- `sfx_catalog` → Sound effect files (MP3/WAV files)
- `eleven_labs_voices` → Voice metadata (already used by TTS, no files needed)

**Expected catalog structure:**
```
catalog/
├── music/
│   ├── m_piano_strings_dramatic_01.mp3
│   ├── m_orchestral_action_01.mp3
│   └── ... (20-30 music tracks)
├── ambience/
│   ├── a_military_medical_tent_01.wav
│   ├── a_city_street_day_01.wav
│   └── ... (15-25 ambience tracks)
└── sfx/
    ├── s_beeping_medical_equipment_01.mp3
    ├── s_walking_fast_creeking_01.mp3
    └── ... (50-100 SFX files)
```

### STEP 3: Upload Catalog to Railway

**Option A: Using Git LFS (Recommended for <500MB)**

1. **Install Git LFS**:
   ```bash
   git lfs install
   ```

2. **Track audio files**:
   ```bash
   git lfs track "catalog/**/*.mp3"
   git lfs track "catalog/**/*.wav"
   git lfs track "catalog/**/*.m4a"
   ```

3. **Add catalog directory**:
   ```bash
   mkdir -p catalog/music catalog/ambience catalog/sfx
   # Copy your audio files into these directories
   ```

4. **Commit and push**:
   ```bash
   git add .gitattributes catalog/
   git commit -m "Add audio catalog files via Git LFS"
   git push origin main
   ```

**Option B: Upload to Supabase Storage (Recommended for >500MB)**

1. **Upload catalog to Supabase**:
   - Go to Supabase Dashboard → Storage
   - Create bucket: `audio-catalog` (public)
   - Upload all music/ambience/sfx files organized in folders

2. **Add download script to Railway** (create `scripts/download-catalog.js`):
   ```javascript
   import { createClient } from '@supabase/supabase-js';
   import fs from 'fs';
   import path from 'path';
   import https from 'https';

   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_ANON_KEY
   );

   async function downloadFile(url, dest) {
     const file = fs.createWriteStream(dest);
     return new Promise((resolve, reject) => {
       https.get(url, response => {
         response.pipe(file);
         file.on('finish', () => file.close(resolve));
       }).on('error', reject);
     });
   }

   async function downloadCatalog() {
     console.log('📥 Downloading catalog from Supabase...');
     
     // List all files in audio-catalog bucket
     const { data: files, error } = await supabase.storage
       .from('audio-catalog')
       .list('', { limit: 1000, recursive: true });

     if (error) throw error;

     for (const file of files) {
       const { data } = supabase.storage
         .from('audio-catalog')
         .getPublicUrl(file.name);

       const dest = path.join('/app/catalog', file.name);
       fs.mkdirSync(path.dirname(dest), { recursive: true });
       
       console.log(`  Downloading: ${file.name}`);
       await downloadFile(data.publicUrl, dest);
     }

     console.log('✅ Catalog downloaded!');
   }

   downloadCatalog().catch(console.error);
   ```

3. **Update `server.js` to run download on startup**:
   ```javascript
   // Add at top of server.js
   import { exec } from 'child_process';
   import { promisify } from 'util';
   const execAsync = promisify(exec);

   // Run before starting server
   if (process.env.NODE_ENV === 'production') {
     console.log('📥 Checking catalog...');
     try {
       await execAsync('node scripts/download-catalog.js');
     } catch (error) {
       console.error('⚠️  Catalog download failed:', error);
     }
   }
   ```

### STEP 4: Verify Railway Deployment

1. **Check Railway logs**:
   ```
   https://railway.app/project/[your-project]
   ```

2. **Look for successful deployment messages**:
   ```
   📂 Loading audio catalog from: /app/catalog
      ✅ Loaded 25 music tracks
      ✅ Loaded 18 ambience tracks
      ✅ Loaded 87 SFX files
   🚀 Story Magic Orchestrator running on port 3000
   ```

3. **Test health endpoint**:
   ```bash
   curl https://web-production-7c7a9.up.railway.app/health
   ```

   Should return:
   ```json
   {
     "status": "ok",
     "timestamp": "2025-11-18T...",
     "service": "story-magic-orchestrator"
   }
   ```

### STEP 5: Test Complete Audio Production

1. **In Replit frontend**, create a new project with ANSWERS.pdf

2. **Monitor Railway logs** to see:
   ```
   🎬 SCENE 1/5: scene_001
   🔊 Step 1: Generating TTS for 28 lines...
   ⏱️  Step 2: Computing dialogue alignment...
   🎵 Step 3: Selecting music and ambience cues...
   📅 Step 4: Building scene timeline...
   🎵 Step 5: Mixing scene audio with background tracks...
      📝 Concatenating 28 dialogue stems...
      ✅ Dialogue duration: 62.34s
      🎵 Music track 1: music/m_piano_strings_dramatic_01.mp3
      🌊 Ambience: ambience/a_military_medical_tent_01.wav
      🔊 SFX 1: sfx/s_beeping_medical_equipment_01.mp3 @ 2s
      🔧 Building FFmpeg filter graph...
      🎬 Running FFmpeg mixer...
      ✅ Scene mixed successfully
   ```

3. **Play the audio** - Should now hear:
   - ✅ Dialogue voices (ElevenLabs TTS)
   - ✅ Background music (fades in/out smoothly)
   - ✅ Ambience (loops throughout scene)
   - ✅ Sound effects (triggered at correct times)
   - ✅ Music ducking (gets quieter during dialogue)

### STEP 6: Troubleshooting

**If audio is still voice-only:**

1. **Check Railway logs for errors**:
   ```
   ⚠️  Some tracks are missing from catalog:
      - music/m_piano_strings_dramatic_01.mp3
   ```
   → Catalog files not uploaded correctly

2. **Check catalog paths**:
   ```bash
   # In Railway console
   ls -la /app/catalog/music
   ls -la /app/catalog/ambience
   ls -la /app/catalog/sfx
   ```

3. **Verify FFmpeg is available**:
   ```bash
   # In Railway console
   which ffmpeg
   which ffprobe
   ```

**If FFmpeg is missing:**
Add to `package.json` dependencies (should already be there):
```json
{
  "dependencies": {
    "ffmpeg-static": "^5.2.0",
    "ffprobe-static": "^3.1.0"
  }
}
```

## Success Criteria

✅ Railway logs show catalog loaded successfully
✅ All 5 scenes process with background tracks
✅ Final audio has voice + music + ambience + SFX
✅ Music ducks during dialogue
✅ Smooth fades and transitions
✅ Total duration is ~5+ minutes (all scenes)

## Next Steps After Successful Deployment

1. Test with multiple different screenplays
2. Adjust volume levels if needed (in `mixer.js`)
3. Add EBU R128 loudness normalization (optional enhancement)
4. Monitor Railway resource usage and adjust dyno size if needed
