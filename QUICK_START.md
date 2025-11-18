# Railway Backend - Quick Start Guide

## What I Created For You

All code is ready in the `railway-backend-files/` directory. Here's what you need to do:

## ⚡ 3-Step Quick Deploy

### 1️⃣ Copy Files to Railway Repo

In your `story-magic-orchestrator` directory:

```bash
# Copy catalog loader (NEW FILE)
cp [path-to-replit]/railway-backend-files/lib/catalog-loader.js lib/catalog-loader.js

# Copy audio mixer (NEW FILE)
cp [path-to-replit]/railway-backend-files/workers/mixer.js workers/mixer.js

# Replace orchestrator (UPDATED FILE)
cp [path-to-replit]/railway-backend-files/workers/orchestrator-updated.js workers/orchestrator.js
```

### 2️⃣ Add Catalog Audio Files

**YOU NEED TO PROVIDE:** The actual audio files from your knowledge base

Create this structure in Railway repo:
```
story-magic-orchestrator/
└── catalog/
    ├── music/
    │   ├── m_piano_strings_dramatic_01.mp3
    │   ├── m_orchestral_action_01.mp3
    │   └── ... (all music files)
    ├── ambience/
    │   ├── a_military_medical_tent_01.wav
    │   ├── a_city_street_day_01.wav
    │   └── ... (all ambience files)
    └── sfx/
        ├── s_beeping_medical_equipment_01.mp3
        ├── s_walking_fast_creeking_01.mp3
        └── ... (all SFX files)
```

**Where to get these files:**
- Check your local machine for the knowledge base audio files
- Or extract them from the original Story Magic Lovable project
- File names MUST match exactly what's in the Director JSON

### 3️⃣ Deploy to Railway

```bash
# Commit all changes
git add lib/catalog-loader.js workers/mixer.js workers/orchestrator.js catalog/

# If using Git LFS for large files (recommended):
git lfs install
git lfs track "catalog/**/*.mp3"
git lfs track "catalog/**/*.wav"
git lfs track "catalog/**/*.m4a"
git add .gitattributes

# Commit and push
git commit -m "Add full audio mixing with catalog files"
git push origin main
```

Railway will auto-deploy. Watch logs at: https://railway.app

---

## ✅ Verification Checklist

After deployment, check Railway logs for:

```
✅ 📂 Loading audio catalog from: /app/catalog
   ✅ Loaded 25 music tracks
   ✅ Loaded 18 ambience tracks
   ✅ Loaded 87 SFX files
✅ 🚀 Story Magic Orchestrator running on port 3000
```

Then test from Replit frontend - create new project with ANSWERS.pdf.

Railway logs should show:
```
✅ 🎵 Music track 1: music/m_piano_strings_dramatic_01.mp3
✅ 🌊 Ambience: ambience/a_military_medical_tent_01.wav
✅ 🔊 SFX 1: sfx/s_beeping_medical_equipment_01.mp3 @ 2s
✅ 🎬 Running FFmpeg mixer...
✅ ✅ Scene mixed successfully
```

Audio should have voice + music + ambience + SFX! 🎉

---

## 🚨 Common Issues

**Issue:** "Track not found in catalog"
→ Audio files not uploaded or wrong file names

**Issue:** "FFmpeg mixing error"  
→ Check Railway logs for FFmpeg stderr output

**Issue:** Audio is still voice-only
→ Catalog directory doesn't exist at `/app/catalog/`

**Issue:** Git LFS files not uploaded
→ Make sure you ran `git lfs install` before committing

---

## 📁 Files You Have Available

**In this Replit:**
- `railway-backend-files/lib/catalog-loader.js` - Loads catalog from filesystem
- `railway-backend-files/workers/mixer.js` - FFmpeg audio mixing engine
- `railway-backend-files/workers/orchestrator-updated.js` - Updated orchestrator using mixer
- `RAILWAY_DEPLOYMENT_GUIDE.md` - Detailed deployment instructions
- `RAILWAY_BACKEND_IMPLEMENTATION.md` - Technical implementation docs

**What you need to provide:**
- Catalog audio files (music/ambience/SFX from knowledge base)

**Where to put catalog files:**
- In Railway repo at: `catalog/music/`, `catalog/ambience/`, `catalog/sfx/`

---

## 🎯 Expected Result

After successful deployment, when you upload ANSWERS.pdf:

- ✅ All **5 scenes** process (not just 1)
- ✅ Audio has **dialogue + background music**
- ✅ **Ambience** loops throughout scenes
- ✅ **Sound effects** trigger at correct times
- ✅ **Music ducks** (gets quieter) during dialogue
- ✅ Total duration: **~5-8 minutes** (full story, not 1 minute)

---

## Need Help?

1. Check Railway logs for detailed error messages
2. Verify catalog files exist: `ls -la /app/catalog/music` (in Railway console)
3. Review `RAILWAY_DEPLOYMENT_GUIDE.md` for troubleshooting

---

**Ready to deploy? Start with Step 1 above!** 🚀
