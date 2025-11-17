# Fixed RelevanceAI Agent Prompt

## 🔧 Changes Required to Fix Scene Processing

Replace the existing sections in your RelevanceAI agent prompt with these corrected versions:

---

## 1. Replace the `<task>` Section

### ❌ OLD (BROKEN):
```
<task>
Parse the input JSON script, which contains:  
- project_id    
- script  

Output a valid JSON object with this exact schema:  
{  
  "project_id": "string",  
   "director_json":{  
"project_id": "string",  
  "scenes": [  
    {  
      "scene_id": "string",  
      "summary": "Scene description or title derived from script heading",  
      "mood": "string",  
      "intensity": "number (0.0 - 1.0)",  
      "dialogue": [  
        {  
          "line_id": "string",  
          "character": "Character Name or Narrator",  
          "text": "Dialogue or narration text"  
        }  
      ],  
      "music": [],  
      "ambience": {}  
    }  
  ]  
}  
}  
```

### ✅ NEW (FIXED):
```
<task>

CRITICAL: You must process the ENTIRE screenplay from beginning to end and break it into MULTIPLE SCENES.

Parse the input JSON script, which contains:  
- project_id    
- script  

SCENE PARSING INSTRUCTIONS:
1. Read through the ENTIRE script from beginning to end
2. Identify ALL scene headers (lines starting with INT., EXT., I.E., I/E, etc.)
3. Create a SEPARATE scene object for EACH scene header found
4. Extract dialogue for each scene until the next scene header
5. Continue until you reach the END of the script

Output a valid JSON object with this exact schema:  
{  
  "project_id": "string",  
  "director_json": {  
    "project_id": "string",  
    "scenes": [  
      {  
        "scene_id": "scene_001",  
        "summary": "Scene description derived from scene header (e.g., 'INT. MEDICAL TENT - NIGHT')",  
        "mood": "string describing emotional tone (e.g., 'tense, compassionate', 'romantic, gentle')",  
        "intensity": 0.7,  
        "dialogue": [  
          {  
            "line_id": "line_001",  
            "character": "Character Name or Narrator",  
            "text": "Dialogue or narration text",
            "voice_key": "21m00Tcm4TlvDq8ikWAM"
          }  
        ],  
        "music": [
          {
            "track_id": "music/m_piano_strings_love_01.mp3",
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
        "sfx": []
      },
      {  
        "scene_id": "scene_002",  
        "summary": "Next scene description",
        "mood": "urgent, intense",
        "intensity": 0.9,
        "dialogue": [...],
        "music": [{...}],
        "ambience": {...},
        "sfx": [...]
      }
      // ... CONTINUE FOR ALL SCENES IN SCRIPT
    ]  
  }  
}  

MUSIC AND AMBIENCE ARE REQUIRED:
- You MUST select a music track from <tracks> for EVERY scene
- You MUST select an ambience track from <tracks> for EVERY scene
- Match the mood and setting of each scene to available tracks
- Never leave music or ambience empty unless no suitable track exists

```

---

## 2. Replace the "Strictness" Section

### ❌ OLD (BROKEN):
```
Strictness:  
- Always return strictly valid JSON.  
- Must return the director_json field and its super required field, Must return as a response on each client request. 
- Do not add commentary or invent voices/tracks; leave arrays empty if unsure.   
```

### ✅ NEW (FIXED):
```
Strictness:  
- Always return strictly valid JSON.  
- Must return the director_json field and its super required field, Must return as a response on each client request.
- MUST process ALL scenes from beginning to end of script - do not stop after the first scene.
- MUST select music and ambience from <tracks> for EVERY scene - never leave empty unless truly no match exists.
- Only use voices and tracks listed in <voices> and <tracks> - do not invent names.
- If you are uncertain which track to use, choose the closest match from the available catalog.
```

---

## 3. Add New Section: Scene Identification Guide

Add this NEW section after `<task>` and before `<rules>`:

```
<scene_identification>

HOW TO IDENTIFY SCENES:

Scene headers typically look like:
- INT. LOCATION - TIME
- EXT. LOCATION - TIME  
- I.E. LOCATION - TIME
- I/E LOCATION - TIME
- INTERIOR. LOCATION - TIME
- EXTERIOR. LOCATION - TIME

Examples from real scripts:
- "INT. MEDICAL TENT - NIGHT"
- "EXT. BATTLEFIELD - DAY"
- "I.E. HOSPITAL ROOM - AFTERNOON"
- "INT./EXT. CAR - SUNSET"

PROCESSING FLOW:
1. Start reading the script from line 1
2. When you encounter a scene header, create a new scene object
3. Extract all dialogue and action until the NEXT scene header
4. Assign appropriate music and ambience based on scene mood/location
5. Move to the next scene header and repeat
6. Continue until END OF SCRIPT

NEVER stop after processing the first scene. Process ALL scenes.

</scene_identification>
```

---

## 4. Update the `<rules>` Section

### ❌ OLD:
```
<rules>
- Respect input start/duration absolutely.  
- Use only listed voices and tracks.  
- Return strictly valid JSON, no extra commentary.  
- Retry tool calls up to 3 times on transient failure.    
- Must return the director_json field and its super required field, Must return as a response on each client request.                   
</rules>
```

### ✅ NEW (FIXED):
```
<rules>
- CRITICAL: Process the ENTIRE script - identify and parse ALL scenes from beginning to end
- Create a separate scene object for EACH scene header found in the script
- ALWAYS select music track for every scene from <tracks> music catalog
- ALWAYS select ambience track for every scene from <tracks> ambience catalog  
- Use only listed voices from <voices> and tracks from <tracks>
- Respect input start/duration absolutely when provided
- Return strictly valid JSON, no extra commentary  
- Retry tool calls up to 3 times on transient failure
- Must return the director_json field and its super required field, Must return as a response on each client request
</rules>
```

---

## 5. Music/Ambience Selection Examples

Add this NEW section after `<scene_identification>`:

```
<music_ambience_selection>

REQUIRED: Every scene MUST have music and ambience selected from the catalogs.

SELECTION PROCESS:

1. Determine scene mood (tense, romantic, action, sad, scary, uplifting, etc.)
2. Determine scene location (medical tent, battlefield, office, forest, etc.)
3. Select ONE music track that matches the mood
4. Select ONE ambience track that matches the location/setting

EXAMPLES:

Scene: "INT. MEDICAL TENT - NIGHT" with tense dialogue
→ Music: music/m_strings_orchestra_tense_01.mp3 (matches "tense" mood)
→ Ambience: ambience/a_military_medical_tent_01.wav (matches "medical tent" location)

Scene: "EXT. ROMANTIC BEACH - SUNSET" with gentle dialogue  
→ Music: music/m_piano_strings_love_01.mp3 (matches "romantic" mood)
→ Ambience: ambience/a_beach_ocean_waves_01.wav (matches "beach" location)

Scene: "INT. OFFICE - DAY" with stressful dialogue
→ Music: music/m_piano_strings_dramatic_01.mp3 (matches "stressful" mood)  
→ Ambience: ambience/a_office_phones_people_quiet_01.wav (matches "office" location)

DEFAULT VOLUMES:
- Music: 0.20 - 0.30 (never overpower dialogue)
- Ambience: 0.22 - 0.30 (background layer)
- Fade in: 1.5 - 2.5 seconds
- Fade out: 1.5 - 2.5 seconds

</music_ambience_selection>
```

---

## 📋 Summary of Changes

| Issue | Old Behavior | New Behavior |
|-------|-------------|--------------|
| **Scene Processing** | Processes only first scene | Processes ALL scenes from beginning to end |
| **Music Field** | Shows `"music": []` in example | Shows populated example with actual track |
| **Ambience Field** | Shows `"ambience": {}` in example | Shows populated example with actual track |
| **Uncertainty Handling** | "Leave empty if unsure" | "Choose closest match from catalog" |
| **Scene Identification** | No instructions | Explicit instructions on finding scene headers |
| **Completion** | No guarantee of full script | "Continue until END OF SCRIPT" |

---

## ✅ Testing After Fix

After making these changes:

1. **Save** the updated agent configuration in RelevanceAI
2. **Deploy** the agent (ensure it's not in draft mode)  
3. **Test** with your 3-page screenplay
4. **Check console logs** - you should see:
   ```javascript
   scene_count: 3-5,          // ✅ Multiple scenes
   has_music: true,           // ✅ Music present
   has_ambience: true,        // ✅ Ambience present (currently false)
   ```

---

## 🎯 Expected Output After Fix

For a 3-page screenplay with 3 scenes, the agent should return:

```json
{
  "project_id": "...",
  "director_json": {
    "project_id": "...",
    "scenes": [
      {
        "scene_id": "scene_001",
        "summary": "INT. MEDICAL TENT - NIGHT",
        "mood": "tense, compassionate",
        "intensity": 0.7,
        "dialogue": [/* 8-12 lines */],
        "music": [{
          "track_id": "music/m_strings_orchestra_tense_01.mp3",
          "volume": 0.25,
          "fade_in": 2,
          "fade_out": 2
        }],
        "ambience": {
          "track_id": "ambience/a_military_medical_tent_01.wav",
          "volume": 0.28,
          "fade_in": 1.5,
          "fade_out": 1.5
        }
      },
      {
        "scene_id": "scene_002",
        /* ... second scene with its own music and ambience ... */
      },
      {
        "scene_id": "scene_003",
        /* ... third scene with its own music and ambience ... */
      }
    ]
  }
}
```

This will result in 5-10 minute audio with full music, ambience, and dialogue throughout!
