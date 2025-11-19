export function buildTimeline(scene, alignment, cues) {
  const events = [];

  // Add dialogue events
  for (const line of alignment.lines) {
    events.push({
      type: 'dialogue_line',
      at: line.start,
      duration: line.duration,
      line_id: line.line_id,
      character: line.character
    });
  }

  // Add music events
  if (cues.music && cues.music.length > 0) {
    for (const music of cues.music) {
      events.push({
        type: 'music_in',
        at: music.at,
        cue_id: music.cue_id,
        fade: music.fade_in,
        gain_db: -12 // Base volume for music
      });

      if (music.duration) {
        events.push({
          type: 'music_out',
          at: music.at + music.duration,
          fade: music.fade_out
        });
      }
    }
  }

  // Add ambience events
  if (cues.ambience && cues.ambience.length > 0) {
    for (const amb of cues.ambience) {
      events.push({
        type: 'ambience_in',
        at: amb.at,
        cue_id: amb.cue_id,
        fade: amb.fade_in,
        gain_db: -18 // Base volume for ambience
      });

      if (amb.duration) {
        events.push({
          type: 'ambience_out',
          at: amb.at + amb.duration,
          fade: amb.fade_out
        });
      }
    }
  }

  // Add SFX events
  if (cues.sfx && cues.sfx.length > 0) {
    for (const sfx of cues.sfx) {
      events.push({
        type: 'sfx_at',
        at: sfx.at,
        cue_id: sfx.cue_id,
        gain_db: -6 // Base volume for SFX
      });
    }
  }

  // Sort events by time
  events.sort((a, b) => a.at - b.at);

  return {
    total_duration: alignment.total_duration,
    events: events
  };
}
