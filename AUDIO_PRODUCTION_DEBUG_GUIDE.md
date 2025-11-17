# 🎬 Audio Production Pipeline - Debug Guide

## ✅ What I Just Added

I've added **comprehensive debug logging** throughout the audio production pipeline to help diagnose why your generated audio is only 2-5 seconds instead of the full 5-10 minutes with music, ambience, and SFX.

### Files Modified:

1. **`src/features/projects/hooks/useSimpleProduction.tsx`** (Lines 193-226)
   - Added detailed logging when Director JSON is retrieved from database
   - Logs scene count, dialogue lines, music/ambience/SFX presence
   - Logs each scene's details individually
   - Shows complete JSON structure being sent to Railway

2. **`src/integrations/supabase/railwayOrchestrator.ts`** (Lines 60-121)
   - Added request details logging (payload size, scene count, etc.)
   - Logs first and last scenes being sent to Railway
   - Logs Railway's response status and headers
   - Shows generated audio manifest details

## 🔍 How to Debug the Issue

### Step 1: Create a Test Project

1. Open Story Magic application: http://localhost:5000 (or your deployed URL)
2. Sign in with your credentials
3. Upload a 2-3 page screenplay PDF
4. Click "Generate Audio" or trigger the production process

### Step 2: Open Browser Console

1. **Chrome/Edge**: Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
2. **Firefox**: Press `F12` or `Ctrl+Shift+K` (Windows) / `Cmd+Option+K` (Mac)
3. Click on the **Console** tab

### Step 3: Watch for Debug Logs

As the production runs, you'll see logs appear in this sequence:

#### 📊 **Stage 1: RelevanceAI Trigger**
```
🎬 Triggering RelevanceAI agent for project: <project-id>
📤 Calling trigger-relevance with: {project_id: "...", script_length: ...}
✅ RelevanceAI agent triggered successfully
```

#### 📊 **Stage 2: Polling for Director JSON**
```
📊 Starting to poll for Director JSON...
📊 Polling attempt 1/60 for project <project-id>
✅ Found director JSON in director_json table
```

#### 🎬 **Stage 3: Director JSON Analysis (CRITICAL)**
```
🎬 Director JSON retrieved from database: {
  project_id: "uuid-here",
  scene_count: X,                    // ❗ Should be > 1 for multi-scene scripts
  total_dialogue_lines: Y,           // ❗ Should match total lines in your script
  has_music: true/false,             // ❗ Should be TRUE
  has_ambience: true/false,          // ❗ Should be TRUE
  has_sfx: true/false,               // ❗ May be true or false
  first_scene_summary: "...",
  last_scene_summary: "..."
}
```

**Then for EACH scene:**
```
📋 Scene 1 Details: {
  scene_id: "scene_001",
  summary: "INT. MEDICAL TENT - NIGHT",
  mood: "tense",
  intensity: 0.8,
  dialogue_count: X,                 // ❗ Should have dialogue
  music_cues: Y,                     // ❗ Should have music cues
  ambience_cues: Z,                  // ❗ Should have ambience
  sfx_cues: 0,
  first_dialogue: "...",
  last_dialogue: "..."
}
```

#### 📤 **Stage 4: Sending to Railway**
```
📤 Sending to Railway orchestrator: {
  url: "https://web-production-7c7a9.up.railway.app/orchestrate",
  payload_size: XXXXX,
  scenes_being_sent: X,              // ❗ Should match scene_count
  complete_json_structure: {...}     // ❗ Full JSON here
}
```

#### 🎯 **Stage 5: Railway Request**
```
🎯 Railway Request Details: {
  url: "...",
  project_id: "...",
  scene_count: X,
  total_dialogue_lines: Y,
  has_music_cues: true/false,
  has_ambience_cues: true/false,
  payload_size_kb: "XX.XX"
}

📦 First scene being sent to Railway: {...}
📦 Last scene being sent to Railway: {...}
```

#### 📥 **Stage 6: Railway Response**
```
📥 Railway Response Status: {
  status: 200,
  statusText: "OK",
  ok: true
}

✅ Railway orchestration complete
🎵 Generated audio details: {
  status: "success",
  has_public_url: true,
  manifest_total_duration: XXX,      // ❗ Should be 300-600 seconds (5-10 min)
  manifest_scene_count: X,
  public_url: "..."
}
```

## 🔴 What to Look For (Critical Checks)

### ❌ **Problem 1: Director JSON is Incomplete**

**Symptoms:**
- `scene_count: 1` (should be multiple scenes)
- `total_dialogue_lines: 1` (should be 10-50 lines)
- `has_music: false` (should be true)
- `has_ambience: false` (should be true)
- Individual scenes have `music_cues: 0` and `ambience_cues: 0`

**Root Cause:** RelevanceAI agent is not processing the complete script or not selecting music/ambience

**Solution:** Need to fix RelevanceAI agent configuration (this is in RelevanceAI dashboard, not in this codebase)

### ❌ **Problem 2: Frontend Not Sending Complete JSON**

**Symptoms:**
- Director JSON looks complete in Stage 3
- But `scenes_being_sent` is less than `scene_count` in Stage 4
- Or `payload_size` is suspiciously small

**Root Cause:** Frontend is truncating data before sending to Railway

**Solution:** Need to check the code between retrieving Director JSON and calling Railway (unlikely with current code)

### ❌ **Problem 3: Railway Not Processing Complete JSON**

**Symptoms:**
- Director JSON is complete (Stage 3 ✅)
- All scenes sent to Railway (Stage 4 ✅)
- Railway response shows `manifest_scene_count: 1` or `manifest_total_duration: 5` (only 5 seconds)

**Root Cause:** Railway orchestrator is receiving complete JSON but only processing first scene

**Solution:** Need to check Railway backend logs and code (this is on Railway, not in this codebase)

## 📋 What to Report Back

After running a test, copy and paste from your browser console:

1. **The Director JSON summary:**
```
🎬 Director JSON retrieved from database: {
  // Copy this entire object
}
```

2. **All scene details:**
```
📋 Scene 1 Details: {...}
📋 Scene 2 Details: {...}
// etc.
```

3. **What's being sent to Railway:**
```
📤 Sending to Railway orchestrator: {
  // Copy this
}
```

4. **Railway's response:**
```
🎵 Generated audio details: {
  // Copy this
}
```

## 🎯 Expected Values for Success

For a **3-page screenplay** with **3 scenes** and **15 dialogue lines total**:

```javascript
{
  scene_count: 3,                    // ✅ Multiple scenes
  total_dialogue_lines: 15,          // ✅ All dialogue
  has_music: true,                   // ✅ Music cues present
  has_ambience: true,                // ✅ Ambience present
  
  // Each scene should have:
  dialogue_count: 5,                 // ✅ ~5 lines per scene
  music_cues: 1-2,                   // ✅ At least 1 music cue
  ambience_cues: 1-2,                // ✅ At least 1 ambience cue
  
  // Railway should return:
  manifest_total_duration: 300-600,  // ✅ 5-10 minutes
  manifest_scene_count: 3            // ✅ All scenes processed
}
```

## 🚀 Next Steps

1. **Run a test production** with the browser console open
2. **Copy all the debug logs** from the console
3. **Share the logs** so we can identify exactly where the pipeline is failing
4. Based on the logs, we'll know if the issue is:
   - **A)** RelevanceAI not generating complete JSON → Fix RelevanceAI agent
   - **B)** Frontend not sending complete JSON → Fix frontend code
   - **C)** Railway not processing complete JSON → Fix Railway backend

## 📝 Quick Reference: Finding Logs

All logs are prefixed with emojis for easy searching:

- 🎬 = Director JSON / RelevanceAI
- 📋 = Scene details
- 📤 = Sending to Railway
- 🎯 = Railway request
- 📥 = Railway response
- 🎵 = Final audio details
- ❌ = Errors
- ✅ = Success

**To filter in console:** Type the emoji or keyword in the console filter box.

---

The comprehensive logging is now active. Run a test and share the console output!
