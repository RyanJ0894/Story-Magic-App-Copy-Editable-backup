# Latest Fix: SFX Schema Mismatch

## 🎉 **Great Progress!**

Your RelevanceAI agent is now:
- ✅ Processing scripts
- ✅ Querying all knowledge base catalogs correctly
- ✅ Selecting music tracks
- ✅ Selecting ambience tracks
- ✅ Selecting SFX tracks
- ✅ Calling "Save to Supabase" tool successfully

## ❌ **But Railway Rejected the JSON**

The Railway orchestrator validation failed with this error:

```
Invalid Director JSON: [
  {"expected":"string","received":"undefined","path":["scenes",0,"sfx",0,"cue_id"],"message":"Required"},
  {"expected":"number","received":"undefined","path":["scenes",0,"sfx",0,"at"],"message":"Required"}
]
```

### **The Problem:**

The agent generated SFX with wrong field names:

```json
// ❌ WRONG (what agent generated)
"sfx": [
  {
    "start": 0,        // Wrong field name
    "volume": 0.6,
    "track_id": "sfx/s_beeping_medical_equipment_01.wav"
    // Missing "cue_id"
  }
]

// ✅ CORRECT (what Railway expects)
"sfx": [
  {
    "cue_id": "cue_001",  // Required ID field
    "at": 0,              // Use "at" not "start"
    "track_id": "sfx/s_beeping_medical_equipment_01.wav",
    "volume": 0.6
  }
]
```

## 🔧 **What I Fixed in the Prompt**

### **1. Updated SFX Example Structure**

Changed from:
```json
"sfx": [{ "start": 10.5, ... }]
```

To:
```json
"sfx": [{ "cue_id": "cue_001", "at": 10.5, ... }]
```

### **2. Added Explicit Field Name Rules**

```
CRITICAL FIELD NAMES:
- For SFX timing: Use "at" (not "start" or "time")
- For SFX ID: Use "cue_id" (required, use format "cue_001", "cue_002", etc.)
- For dialogue ID: Use "line_id" (required, use format "line_001", "line_002", etc.)
- For scene ID: Use "scene_id" (required, use format "scene_001", "scene_002", etc.)
```

This makes it crystal clear which exact field names to use.

## 📋 **Next Steps**

1. **Copy the updated prompt** from `SIMPLIFIED_RELEVANCE_PROMPT.md`
2. **Replace your RelevanceAI agent prompt** with the new version
3. **Test again** with a screenplay upload
4. **Check console logs** - Railway should now accept the JSON

## ✅ **Expected Result After Fix**

After updating the prompt, the agent will generate:

```json
{
  "scenes": [
    {
      "scene_id": "scene_001",
      "dialogue": [
        {
          "line_id": "line_001",
          "character": "SOLDIER",
          "text": "Pipe down Nelson.",
          "voice_key": "PSqRw3ln34TxQZrTS6Wt"
        }
      ],
      "music": [
        {
          "track_id": "music/m_piano_strings_dramatic_01.mp3",
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
          "cue_id": "cue_001",               // ✅ Now included
          "at": 0,                           // ✅ Correct field name
          "track_id": "sfx/s_beeping_medical_equipment_01.wav",
          "volume": 0.6
        }
      ]
    }
  ]
}
```

Railway will accept this and generate audio!

## 🐛 **Remaining Issue to Fix**

After this works, we still need to fix:
- **Still only processing 1 scene** instead of entire script

This is likely still a token output limit issue. Once the SFX validation passes, we can revisit the multi-scene processing.

## 📊 **Progress Summary**

| Issue | Status |
|-------|--------|
| Agent not triggering | ✅ **FIXED** |
| Agent not querying catalogs | ✅ **FIXED** |
| Music not selected | ✅ **FIXED** |
| Ambience not selected | ✅ **FIXED** |
| SFX not selected | ✅ **FIXED** |
| SFX wrong schema | 🔧 **FIX READY** (update prompt) |
| Save to Supabase not called | ✅ **FIXED** |
| Only 1 scene processed | ⏳ **NEXT** (after SFX fix validates) |

You're making excellent progress! After this SFX schema fix, the system should generate working audio (even if still only 1 scene for now).
