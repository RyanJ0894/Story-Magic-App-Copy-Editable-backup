// lib/catalog-loader.js
import fs from 'fs';
import path from 'path';

const CATALOG_BASE = '/app/catalog';

/**
 * Load catalog metadata from filesystem
 * Scans catalog directory and builds index of available audio files
 */
export function loadCatalog() {
  console.log('📂 Loading audio catalog from:', CATALOG_BASE);

  const catalog = {
    music: [],
    ambience: [],
    sfx: []
  };

  try {
    // Check if catalog directory exists
    if (!fs.existsSync(CATALOG_BASE)) {
      console.warn(`⚠️  Catalog directory not found: ${CATALOG_BASE}`);
      console.warn(`⚠️  Creating empty catalog structure...`);
      fs.mkdirSync(path.join(CATALOG_BASE, 'music'), { recursive: true });
      fs.mkdirSync(path.join(CATALOG_BASE, 'ambience'), { recursive: true });
      fs.mkdirSync(path.join(CATALOG_BASE, 'sfx'), { recursive: true });
      return catalog;
    }

    // Load music catalog
    const musicDir = path.join(CATALOG_BASE, 'music');
    if (fs.existsSync(musicDir)) {
      const musicFiles = fs.readdirSync(musicDir).filter(f => 
        f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a')
      );
      
      for (const file of musicFiles) {
        catalog.music.push({
          id: `music/${file}`,
          path: path.join(musicDir, file),
          filename: file
        });
      }
      console.log(`   ✅ Loaded ${catalog.music.length} music tracks`);
    }

    // Load ambience catalog
    const ambienceDir = path.join(CATALOG_BASE, 'ambience');
    if (fs.existsSync(ambienceDir)) {
      const ambienceFiles = fs.readdirSync(ambienceDir).filter(f => 
        f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a')
      );
      
      for (const file of ambienceFiles) {
        catalog.ambience.push({
          id: `ambience/${file}`,
          path: path.join(ambienceDir, file),
          filename: file
        });
      }
      console.log(`   ✅ Loaded ${catalog.ambience.length} ambience tracks`);
    }

    // Load SFX catalog
    const sfxDir = path.join(CATALOG_BASE, 'sfx');
    if (fs.existsSync(sfxDir)) {
      const sfxFiles = fs.readdirSync(sfxDir).filter(f => 
        f.endsWith('.mp3') || f.endsWith('.wav') || f.endsWith('.m4a')
      );
      
      for (const file of sfxFiles) {
        catalog.sfx.push({
          id: `sfx/${file}`,
          path: path.join(sfxDir, file),
          filename: file
        });
      }
      console.log(`   ✅ Loaded ${catalog.sfx.length} SFX files`);
    }

    return catalog;
  } catch (error) {
    console.error('❌ Error loading catalog:', error);
    return catalog;
  }
}

/**
 * Get file path for a track ID
 * @param {string} trackId - Track ID from Director JSON (e.g., "music/m_piano_strings_dramatic_01.mp3")
 * @returns {string|null} - Absolute file path or null if not found
 */
export function getTrackPath(trackId) {
  if (!trackId) return null;

  // Track ID format: "music/filename.mp3" or "ambience/filename.wav"
  const filePath = path.join(CATALOG_BASE, trackId);

  if (fs.existsSync(filePath)) {
    return filePath;
  }

  console.warn(`⚠️  Track not found in catalog: ${trackId}`);
  console.warn(`   Looked for: ${filePath}`);
  return null;
}

/**
 * Validate that all required tracks exist
 * @param {Object} scene - Scene with music/ambience/sfx cues
 * @returns {Object} - { valid: boolean, missing: string[] }
 */
export function validateSceneTracks(scene) {
  const missing = [];

  // Check music tracks
  if (scene.music) {
    for (const musicCue of scene.music) {
      const trackPath = getTrackPath(musicCue.track_id);
      if (!trackPath) {
        missing.push(musicCue.track_id);
      }
    }
  }

  // Check ambience track
  if (scene.ambience?.track_id) {
    const trackPath = getTrackPath(scene.ambience.track_id);
    if (!trackPath) {
      missing.push(scene.ambience.track_id);
    }
  }

  // Check SFX tracks
  if (scene.sfx) {
    for (const sfxCue of scene.sfx) {
      const trackPath = getTrackPath(sfxCue.track_id);
      if (!trackPath) {
        missing.push(sfxCue.track_id);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}
