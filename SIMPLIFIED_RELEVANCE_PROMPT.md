# Simplified RelevanceAI Agent Prompt (Token-Optimized)

## 🎯 Purpose
This is a **dramatically simplified** version of the agent prompt that reduces input token usage, leaving more room for complete output.

---

## ✅ Simplified Prompt (Use This Instead)

```
You are Script-to-JSON Agent. Convert film scripts into strictly valid JSON for audio production.

INPUT: { "project_id": "string", "script": "string" }

OUTPUT: { "project_id": "string", "director_json": { "project_id": "string", "scenes": [...] } }

CRITICAL RULES:
1. Process ENTIRE script from beginning to end
2. Identify ALL scene headers (INT., EXT., I.E., I/E)  
3. Create separate scene object for EACH header
4. Never stop until end of script is reached
5. MUST select music + ambience for every scene

KNOWLEDGE BASE FILES - USE ONLY THESE:
You MUST ONLY use voice IDs, music tracks, ambience tracks, and SFX from these knowledge base files:
- Voice IDs: eleven_labs_voices_current_docx
- Music: music_catalog_full_json
- Ambience: ambience_catalog_enriched_json
- SFX: sfx_catalog_enriched_json

DO NOT invent or make up any voice IDs, track names, or file paths. 
ONLY use exact IDs and file paths found in the knowledge base files listed above.

SCENE STRUCTURE:
{
  "scene_id": "scene_001",
  "summary": "Scene heading from script",
  "mood": "emotional tone",
  "intensity": 0.7,
  "dialogue": [
    {
      "line_id": "line_001",
      "character": "Character Name or Narrator",
      "text": "dialogue text",
      "voice_key": "voice_id_from_eleven_labs_voices_current_docx"
    }
  ],
  "music": [
    {
      "track_id": "music/track_from_music_catalog_full_json.mp3",
      "volume": 0.25,
      "fade_in": 2,
      "fade_out": 2
    }
  ],
  "ambience": {
    "track_id": "ambience/track_from_ambience_catalog_enriched_json.wav",
    "volume": 0.28,
    "fade_in": 1.5,
    "fade_out": 1.5
  },
  "sfx": [
    {
      "track_id": "sfx/track_from_sfx_catalog_enriched_json.wav",
      "volume": 0.6,
      "start": 10.5
    }
  ]
}

PROCESSING:
1. Read script from line 1
2. Find scene header → create scene object
3. Extract dialogue until next header
4. Query knowledge base for voice IDs (eleven_labs_voices_current_docx)
5. Query knowledge base for music (music_catalog_full_json) that matches mood
6. Query knowledge base for ambience (ambience_catalog_enriched_json) that matches location
7. Query knowledge base for SFX (sfx_catalog_enriched_json) if scene needs sound effects
8. Repeat until END OF SCRIPT
9. Call "Save to Supabase" tool with complete JSON

NEVER stop processing early. ALWAYS complete entire script.
NEVER invent voice IDs or track names. ONLY use knowledge base files.
```

---

## 📊 Token Savings

| Version | Estimated Tokens |
|---------|------------------|
| **Current prompt** | ~800-1000 tokens |
| **Simplified prompt** | ~300-400 tokens |
| **Tokens saved** | ~500-600 tokens |
| **Extra output space** | Enough for 2-3 more scenes |

---

## 🔧 Implementation Steps

1. **Copy the simplified prompt above**
2. **Replace your current 401-line prompt** in RelevanceAI agent
3. **Keep the full track/voice catalogs** in the **Knowledge Base** (not in prompt)
4. **Test immediately** - should now process 3-5 scenes

---

## 💡 Why This Works

**Before:**
- 90% tokens → Long prompt + Knowledge Base = **800+ tokens used**
- 10% tokens → Output = **Not enough for full JSON**
- Result: Agent stops after 1 scene

**After:**
- 90% tokens → Short prompt + Knowledge Base = **400 tokens used**  
- 10% tokens → Output = **Enough for 3-5 scenes of complete JSON**
- Result: Agent processes entire script

---

## ✅ Additional Optimizations

### Move Catalogs to Knowledge Base

Instead of listing all tracks in the prompt, create a knowledge base document:

**Document: "Audio Catalogs"**
```markdown
# Music Tracks
- music/m_piano_strings_love_01.mp3 (romantic, gentle)
- music/m_strings_orchestra_tense_01.mp3 (tense, dramatic)
[... rest of catalog ...]

# Ambience Tracks  
- ambience/a_military_medical_tent_01.wav (medical tent setting)
- ambience/a_beach_ocean_waves_01.wav (beach, ocean setting)
[... rest of catalog ...]

# Voice Catalog
- 21m00Tcm4TlvDq8ikWAM: Rachel (female 20-30, calm)
[... rest of voices ...]
```

Then the agent can query this knowledge base when needed, without loading it all into the prompt.

---

## 🎯 Expected Results

After simplifying the prompt:

```javascript
🎬 Director JSON: {
  scene_count: 3-5,          // ✅ Multiple scenes now!
  has_music: true,           // ✅ Music
  has_ambience: true,        // ✅ Ambience
  total_dialogue_lines: 60+  // ✅ All dialogue
}

📋 Scene 1: { dialogue: 12, music: 1, ambience: 1 }
📋 Scene 2: { dialogue: 15, music: 1, ambience: 1 }
📋 Scene 3: { dialogue: 18, music: 1, ambience: 1 }
📋 Scene 4: { dialogue: 14, music: 1, ambience: 1 }

🎵 Audio: {
  duration: 480 seconds      // ✅ ~8 minutes (was 60)
}
```

---

## 📋 Implementation Checklist

- [ ] Copy simplified prompt above
- [ ] Replace current 401-line prompt in RelevanceAI
- [ ] (Optional) Move track catalogs to Knowledge Base
- [ ] Reduce Knowledge Base page size to 10-20
- [ ] Switch to Claude Sonnet 4.5 if available
- [ ] Test with 3-page screenplay
- [ ] Verify console shows 3-5 scenes
- [ ] Confirm audio is 5-10 minutes long

The simplified prompt focuses on **what** the agent needs to do, not **how** to do every detail. This frees up massive output token space for complete JSON generation.
