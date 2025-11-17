# 🎬 RelevanceAI Agent Fix Checklist

## ✅ Diagnosis Confirmed

**Problem**: RelevanceAI "Ace, the AI Director" agent is only processing the FIRST scene of the screenplay instead of ALL scenes.

**Evidence**: Console logs show `scene_count: 1` with only 28 dialogue lines in a single scene, when a 3-page screenplay should have 3-5+ scenes.

**Impact**: Generated audio is only ~1 minute (voice-only) instead of 5-10 minutes with full music, ambience, and SFX across all scenes.

---

## 🔧 RelevanceAI Agent Configuration Checklist

Use this checklist to fix the agent in your RelevanceAI dashboard.

### 📋 Step 1: Access Agent Configuration

- [ ] Log into RelevanceAI dashboard
- [ ] Navigate to **Agents** section
- [ ] Find agent: **"Ace, the AI Director"** (or whatever name you gave it)
- [ ] Click **Edit** or **Configure**

### 📋 Step 2: Review Agent Prompt/Instructions

The agent prompt should explicitly instruct it to:

- [ ] **Process the ENTIRE screenplay** from beginning to end
- [ ] **Identify ALL scenes** in the script (not just the first one)
- [ ] **Generate scene breakdown for EVERY scene**
- [ ] **Assign dialogue to characters for EVERY scene**
- [ ] **Select music tracks for EVERY scene**
- [ ] **Select ambience tracks for EVERY scene**
- [ ] **Identify SFX opportunities in scenes** (optional but recommended)

**Example prompt language that should be present:**

```
Analyze the COMPLETE screenplay provided. Break down EVERY SINGLE SCENE 
from start to finish. For EACH scene, you must:

1. Create a unique scene_id (scene_001, scene_002, etc.)
2. Write a summary of the scene
3. Identify mood and intensity
4. Extract ALL dialogue with character assignments
5. Select appropriate music track from catalog
6. Select appropriate ambience from catalog
7. Identify any sound effects needed

Continue processing until you reach the END of the screenplay.
Do not stop after the first scene.
```

**Red flags to check for:**
- [ ] Does the prompt say "analyze the first scene"? ❌ Remove this
- [ ] Does it say "process the opening"? ❌ Change to "process ALL scenes"
- [ ] Are there instructions to "stop after analyzing one scene"? ❌ Remove this
- [ ] Does it have iteration limits? ❌ Remove or increase to 50+ scenes

### 📋 Step 3: Check Agent Tools/Actions

Verify the agent has access to:

- [ ] **Script parsing tool** - Can extract all scenes from screenplay
- [ ] **Music catalog** - Has list of all available music tracks
- [ ] **Ambience catalog** - Has list of all available ambience tracks
- [ ] **SFX catalog** - Has list of available sound effects (optional)
- [ ] **Callback webhook** - Can send results back to Supabase

### 📋 Step 4: Verify Output Schema

The agent's output schema should include:

```json
{
  "type": "object",
  "properties": {
    "project_id": { "type": "string" },
    "scenes": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "scene_id": { "type": "string" },
          "summary": { "type": "string" },
          "mood": { "type": "string" },
          "intensity": { "type": "number" },
          "dialogue": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "line_id": { "type": "string" },
                "character": { "type": "string" },
                "text": { "type": "string" },
                "voice_key": { "type": "string" }
              }
            }
          },
          "music": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "track_id": { "type": "string" },
                "volume": { "type": "number" },
                "fade_in": { "type": "number" },
                "fade_out": { "type": "number" }
              }
            }
          },
          "ambience": {
            "type": "object",
            "properties": {
              "track_id": { "type": "string" },
              "volume": { "type": "number" },
              "fade_in": { "type": "number" },
              "fade_out": { "type": "number" }
            }
          },
          "sfx": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "cue_id": { "type": "string" },
                "timestamp": { "type": "number" }
              }
            }
          }
        }
      }
    }
  }
}
```

**Check:**
- [ ] Schema requires `scenes` to be an **array** (not a single object)
- [ ] Each scene must have `music` (currently missing in output)
- [ ] Each scene must have `ambience` (currently missing in output)
- [ ] Schema doesn't limit array to 1 item

### 📋 Step 5: Check Token Limits

- [ ] Agent has sufficient token limit to process 3-page scripts (need ~4000-8000 tokens)
- [ ] Output token limit allows for multiple scenes (need ~3000-5000 output tokens)
- [ ] No artificial limits on response length

### 📋 Step 6: Review Agent Execution Flow

The agent workflow should:

1. [ ] **Receive full screenplay text** from Supabase edge function
2. [ ] **Parse screenplay** to identify scene headers (INT., EXT., etc.)
3. [ ] **Loop through ALL scenes** (not just first one)
4. [ ] **For each scene**:
   - [ ] Extract dialogue
   - [ ] Determine mood/intensity
   - [ ] Select music from catalog based on mood
   - [ ] Select ambience from catalog based on location
   - [ ] Identify SFX opportunities
5. [ ] **Assemble complete JSON** with ALL scenes
6. [ ] **Call callback webhook** to save to Supabase

### 📋 Step 7: Music & Ambience Catalog Configuration

Verify the agent has access to catalogs with entries like:

**Music Catalog:**
```
music/m_piano_strings_love_01.mp3 - Romantic, tender
music/m_strings_orchestra_tense_01.mp3- Tense, dramatic
music/m_electronic_action_01.mp3 - Action, intense
music/m_ambient_mysterious_01.mp3 - Mysterious, eerie
... (50+ tracks across various moods)
```

**Ambience Catalog:**
```
ambience/a_military_medical_tent_01.wav - Medical tent sounds
ambience/a_city_street_day_01.wav - City street ambience
ambience/a_forest_birds_01.wav - Forest with birds
ambience/a_office_busy_01.wav - Busy office sounds
... (30+ ambience tracks for various locations)
```

**Check:**
- [ ] Agent has read access to catalogs
- [ ] Catalogs are comprehensive enough for scene selection
- [ ] Agent is instructed to **select from catalog** (not make up track names)

### 📋 Step 8: Callback Webhook Configuration

- [ ] Callback URL is set to: `https://bcuhyyyerxwgkrkbrqbs.supabase.co/functions/v1/ai-director-callback`
- [ ] Callback sends complete Director JSON (all scenes)
- [ ] Callback includes `project_id` for matching
- [ ] Webhook has proper authentication/headers configured

### 📋 Step 9: Test Agent in RelevanceAI

Before deploying:

- [ ] Run test with sample 2-3 page screenplay in RelevanceAI dashboard
- [ ] Verify output contains multiple scenes (3-5+)
- [ ] Verify each scene has music cues
- [ ] Verify each scene has ambience cues
- [ ] Check execution logs for errors or warnings
- [ ] Confirm no truncation in output

### 📋 Step 10: Deploy & Test

- [ ] **Save** agent configuration
- [ ] **Deploy** agent (make sure it's not in draft mode)
- [ ] Test with a new screenplay upload in Story Magic
- [ ] Check browser console logs for `scene_count` (should be > 1)
- [ ] Verify audio is 5-10 minutes long with music and ambience

---

## 🎯 Expected vs. Current Output

### ❌ Current Output (BROKEN):
```json
{
  "project_id": "...",
  "scenes": [
    {
      "scene_id": "scene_001",
      "summary": "Medical tent scene",
      "dialogue": [28 lines],
      "music": [1 cue],
      "ambience": {},           // ❌ MISSING
      "sfx": []                 // ❌ MISSING
    }
    // ❌ NO OTHER SCENES
  ]
}
```

### ✅ Expected Output (CORRECT):
```json
{
  "project_id": "...",
  "scenes": [
    {
      "scene_id": "scene_001",
      "summary": "Medical tent scene",
      "dialogue": [8-12 lines],
      "music": [
        {
          "track_id": "music/m_strings_orchestra_tense_01.mp3",
          "volume": 0.25,
          "fade_in": 2,
          "fade_out": 2
        }
      ],
      "ambience": {
        "track_id": "ambience/a_military_medical_tent_01.wav",
        "volume": 0.28,
        "fade_in": 1.5,
        "fade_out": 1.5
      },
      "sfx": [
        {
          "cue_id": "sfx/door_slam.wav",
          "timestamp": 15.3
        }
      ]
    },
    {
      "scene_id": "scene_002",
      "summary": "Outdoor battlefield scene",
      "dialogue": [6-10 lines],
      "music": [
        {
          "track_id": "music/m_electronic_action_01.mp3",
          "volume": 0.30,
          "fade_in": 1,
          "fade_out": 3
        }
      ],
      "ambience": {
        "track_id": "ambience/a_battlefield_distant_01.wav",
        "volume": 0.22,
        "fade_in": 2,
        "fade_out": 2
      },
      "sfx": [
        {
          "cue_id": "sfx/gunshot.wav",
          "timestamp": 8.5
        }
      ]
    },
    {
      "scene_id": "scene_003",
      "summary": "Return to medical tent",
      // ... more dialogue, music, ambience
    }
    // ... scenes 4, 5, etc.
  ]
}
```

---

## 🚨 Common Issues & Fixes

### Issue: Agent stops after first scene
**Fix**: Remove any "analyze first scene" language from prompt. Add explicit instruction to "process ALL scenes until end of screenplay"

### Issue: No ambience in output
**Fix**: Verify agent has ambience catalog access. Add explicit instruction: "MUST select ambience track for every scene"

### Issue: Music present but only 1 cue
**Fix**: Check if agent is selecting music per-scene or globally. Should be per-scene.

### Issue: Agent times out
**Fix**: Increase timeout limit, or optimize agent to process faster (remove unnecessary steps)

### Issue: Output truncated
**Fix**: Increase output token limit to 5000+ tokens

---

## 📞 Need Help?

If you've gone through this checklist and the issue persists:

1. Export the agent configuration from RelevanceAI
2. Check RelevanceAI execution logs for the failed run
3. Share the execution logs and agent config for deeper diagnosis

---

## ✅ Success Criteria

After fixing, you should see in browser console:
```javascript
🎬 Director JSON retrieved from database: {
  scene_count: 3-5+,              // ✅ Multiple scenes
  total_dialogue_lines: 30-100+,  // ✅ All dialogue
  has_music: true,                // ✅ Music cues present
  has_ambience: true,             // ✅ Ambience present
  has_sfx: true/false             // ✅ Optional
}
```

And generated audio will be **5-10 minutes long** with **music**, **ambience**, and **dialogue** throughout.
