# Check Director JSON Data in Supabase

## Problem
Audio is only 2 seconds long. Need to verify if RelevanceAI is sending complete JSON or if it's getting truncated.

## Run This SQL in Supabase

Go to: https://supabase.com/dashboard/project/bcuhyyyerxwgkrkbrqbs/sql/new

```sql
-- Check the most recent director_json entries
SELECT 
  project_id,
  created_at,
  jsonb_array_length(json_data->'scenes') as scene_count,
  (json_data->'scenes'->0->>'scene_id') as first_scene_id,
  (json_data->'scenes'->0->>'summary') as first_scene_summary,
  jsonb_array_length(json_data->'scenes'->0->'dialogue') as first_scene_dialogue_count,
  jsonb_array_length(json_data->'scenes'->0->'music') as first_scene_music_count,
  CASE 
    WHEN json_data->'scenes'->0->'ambience' IS NOT NULL THEN true 
    ELSE false 
  END as first_scene_has_ambience,
  jsonb_array_length(json_data->'scenes'->0->'sfx') as first_scene_sfx_count,
  pg_column_size(json_data) as json_size_bytes,
  (pg_column_size(json_data) / 1024.0)::numeric(10,2) as json_size_kb
FROM director_json
ORDER BY created_at DESC
LIMIT 5;
```

## What to Look For

**If scene_count = 1:**
- ❌ RelevanceAI is only analyzing the first scene
- Need to fix RelevanceAI agent configuration

**If scene_count > 1:**
- ✅ RelevanceAI is working correctly
- Problem is in the frontend reading the data or Railway processing it

**If first_scene_has_ambience = false:**
- ❌ RelevanceAI isn't selecting ambience tracks
- Need to update agent prompt/knowledge base

## Next Step: Check Full JSON Structure

If you see multiple scenes, run this to see the complete JSON:

```sql
SELECT 
  project_id,
  created_at,
  jsonb_pretty(json_data) as full_json
FROM director_json
WHERE project_id = 'YOUR_PROJECT_ID_HERE'
ORDER BY created_at DESC
LIMIT 1;
```

Replace `'YOUR_PROJECT_ID_HERE'` with the actual project_id from the first query.

## Expected Good Result

```
scene_count: 3-5
first_scene_dialogue_count: 10-30
first_scene_music_count: 1-2
first_scene_has_ambience: true
first_scene_sfx_count: 1-5
json_size_kb: 15-50
```

If you see these numbers, RelevanceAI is working and the problem is downstream (frontend or Railway).
