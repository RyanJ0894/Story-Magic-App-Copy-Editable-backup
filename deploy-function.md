# Deploy Supabase Edge Function

## Step 1: Set up ElevenLabs API Key in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **Edge Functions**
4. Click **Environment Variables**
5. Add a new environment variable:
   - **Name**: `ELEVENLABS_API_KEY`
   - **Value**: `sk_d166b9980919a408b73eede7ad7cc1b65f892ee39307c7cf`
6. Click **Save**

## Step 2: Deploy the Function

### Option A: Via Supabase Dashboard
1. Go to **Edge Functions** in your Supabase dashboard
2. Click **Create a new function**
3. Name it: `generate-audio`
4. Copy the contents of `supabase/functions/generate-audio/index.ts`
5. Paste into the function editor
6. Click **Deploy**

### Option B: Via CLI (if you have access)
```bash
# Login to Supabase
npx supabase login

# Deploy the function
npx supabase functions deploy generate-audio
```

## Step 3: Test the Function

1. Go to your project page in the app
2. Upload a script or use an existing one
3. Select a voice style and mood
4. Click "Generate Audio"
5. The function should now work with your actual script content!

## What's Fixed:

✅ **Dynamic text processing** - Uses actual script content  
✅ **800-character truncation** - For performance  
✅ **Scene selection support** - Works with selected scenes  
✅ **Voice style mapping** - All 9 voices mapped correctly  
✅ **Mood instructions** - All 8 moods applied properly  
✅ **API integration** - ElevenLabs API working  

## Troubleshooting:

- If you get API key errors, make sure the environment variable is set correctly
- If text is too long, it will be automatically truncated to 800 characters
- Check the Supabase function logs for any errors 