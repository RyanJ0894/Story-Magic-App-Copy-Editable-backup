export async function pickCues(scene, catalog) {
  const cues = {
    music: [],
    ambience: [],
    sfx: []
  };

  // Select music based on scene data
  if (scene.music && scene.music.length > 0) {
    for (const musicCue of scene.music) {
      const trackId = musicCue.track_id || musicCue.cue_id;
      
      // Validate track exists in catalog
      const exists = catalog.music.some(m => m.id === trackId);
      if (exists) {
        cues.music.push({
          cue_id: trackId,
          at: musicCue.at || 0,
          duration: musicCue.duration || null,
          volume: musicCue.volume || 0.3,
          fade_in: musicCue.fade_in || 1,
          fade_out: musicCue.fade_out || 2
        });
      } else {
        console.warn(`   ⚠️  Music track not in catalog: ${trackId}`);
      }
    }
  }

  // Select ambience based on scene data
  if (scene.ambience && scene.ambience.length > 0) {
    for (const ambienceCue of scene.ambience) {
      const trackId = ambienceCue.track_id || ambienceCue.cue_id;
      
      const exists = catalog.ambience.some(a => a.id === trackId);
      if (exists) {
        cues.ambience.push({
          cue_id: trackId,
          at: ambienceCue.at || 0,
          duration: ambienceCue.duration || null,
          volume: ambienceCue.volume || 0.2,
          fade_in: ambienceCue.fade_in || 1.5,
          fade_out: ambienceCue.fade_out || 1.5
        });
      } else {
        console.warn(`   ⚠️  Ambience track not in catalog: ${trackId}`);
      }
    }
  }

  // Select SFX based on scene data
  if (scene.sfx && scene.sfx.length > 0) {
    for (const sfxCue of scene.sfx) {
      const trackId = sfxCue.track_id || sfxCue.cue_id;
      
      const exists = catalog.sfx.some(s => s.id === trackId);
      if (exists) {
        cues.sfx.push({
          cue_id: trackId,
          at: sfxCue.at || 0,
          volume: sfxCue.volume || 0.5
        });
      } else {
        console.warn(`   ⚠️  SFX track not in catalog: ${trackId}`);
      }
    }
  }

  return cues;
}
