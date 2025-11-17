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
5. MUST select music + ambience for every scene from catalogs below

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
      "voice_key": "voice_id_from_catalog"
    }
  ],
  "music": [
    {
      "track_id": "music/track_name.mp3",
      "volume": 0.25,
      "fade_in": 2,
      "fade_out": 2
    }
  ],
  "ambience": {
    "track_id": "ambience/track_name.wav",
    "volume": 0.28,
    "fade_in": 1.5,
    "fade_out": 1.5
  },
  "sfx": []
}

VOICES:
21m00Tcm4TlvDq8ikWAM (Rachel, female 20-30, calm)
EXAVITQu4vr4xnSDxMaL (Sarah, female 20-30, soft)
MF3mGyEYCl7XYWbV9V6O (Elli, female 20-30, warm)
TxGEqnHWrfWFTfGW9XjX (Josh, male 30-40, steady)
pNInz6obpgDQGcFmaJgB (Adam, male 30-40, narration)
2EiwWnXFnvU5JabPnv8n (Clyde, neutral, narrator)

TRACKS: [See full catalog in knowledge base]

PROCESSING:
1. Read script from line 1
2. Find scene header → create scene object
3. Extract dialogue until next header
4. Select music (matches mood) + ambience (matches location)
5. Repeat until END OF SCRIPT
6. Call "Save to Supabase" tool with complete JSON

NEVER stop processing early. ALWAYS complete entire script.
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
