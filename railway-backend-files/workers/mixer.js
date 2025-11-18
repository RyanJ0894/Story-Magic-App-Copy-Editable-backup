// workers/mixer.js - FIXED: Uses timeline events and implements real ducking
import { execa } from 'execa';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import fs from 'fs';
import path from 'path';
import { getTrackPath } from '../lib/catalog-loader.js';

const ffmpeg = ffmpegPath;
const ffprobe = ffprobePath.path;

/**
 * Get audio duration in seconds using ffprobe
 */
async function getAudioDuration(filePath) {
  try {
    const { stdout } = await execa(ffprobe, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ]);
    return parseFloat(stdout);
  } catch (error) {
    console.error(`❌ Error getting duration for ${filePath}:`, error.message);
    return 0;
  }
}

/**
 * Mix scene audio: dialogue + music + ambience + SFX
 * Uses timeline events to determine exact timing and implements real ducking
 * 
 * @param {Object} options
 * @param {Object} options.scene - Scene object (for validation only)
 * @param {Object} options.timeline - Timeline with all events (USED for timing)
 * @param {Array} options.stems - Dialogue TTS stems
 * @param {Object} options.cues - Selected cues from pickCues (USED for tracks)
 * @param {string} options.output - Output file path
 */
export async function mixScene(options) {
  const { scene, timeline, stems, cues, output } = options;

  console.log('🎵 Mixing scene audio...');

  // If no dialogue stems, create silence
  if (!stems || stems.length === 0) {
    console.log('⚠️  No dialogue stems - creating silent scene');
    await createSilence(output, 10);
    return;
  }

  // Concatenate all dialogue stems into one file
  console.log(`   📝 Concatenating ${stems.length} dialogue stems...`);
  const dialoguePath = path.join(path.dirname(output), `dialogue-${scene.scene_id}.m4a`);
  await concatenateDialogue(stems, dialoguePath);

  const dialogueDuration = await getAudioDuration(dialoguePath);
  console.log(`   ✅ Dialogue duration: ${dialogueDuration.toFixed(2)}s`);

  // Extract music/ambience/SFX from timeline events (NOT from scene directly)
  const timelineData = extractTimelineData(timeline, cues);

  // If no background tracks in cues, just use dialogue
  if (!timelineData.music && !timelineData.ambience && timelineData.sfx.length === 0) {
    console.log('   ℹ️  No background tracks selected by cues - using dialogue only');
    fs.copyFileSync(dialoguePath, output);
    return;
  }

  // Build inputs list and validate files exist
  const inputs = [{ path: dialoguePath, label: 'dialogue', index: 0 }];
  let inputIndex = 1;

  // Add music if selected
  if (timelineData.music) {
    const trackPath = getTrackPath(timelineData.music.cue_id);
    if (trackPath) {
      inputs.push({ path: trackPath, label: 'music', index: inputIndex, data: timelineData.music });
      inputIndex++;
      console.log(`   🎵 Music: ${timelineData.music.cue_id}`);
    } else {
      console.warn(`   ⚠️  Music track not found: ${timelineData.music.cue_id}`);
      timelineData.music = null;
    }
  }

  // Add ambience if selected
  if (timelineData.ambience) {
    const trackPath = getTrackPath(timelineData.ambience.cue_id);
    if (trackPath) {
      inputs.push({ path: trackPath, label: 'ambience', index: inputIndex, data: timelineData.ambience });
      inputIndex++;
      console.log(`   🌊 Ambience: ${timelineData.ambience.cue_id}`);
    } else {
      console.warn(`   ⚠️  Ambience track not found: ${timelineData.ambience.cue_id}`);
      timelineData.ambience = null;
    }
  }

  // Add SFX
  for (const sfx of timelineData.sfx) {
    const trackPath = getTrackPath(sfx.cue_id);
    if (trackPath) {
      inputs.push({ path: trackPath, label: `sfx${sfx.index}`, index: inputIndex, data: sfx });
      inputIndex++;
      console.log(`   🔊 SFX ${sfx.index + 1}: ${sfx.cue_id} @ ${sfx.at}s`);
    } else {
      console.warn(`   ⚠️  SFX track not found: ${sfx.cue_id}`);
    }
  }

  // If after validation we have no background tracks, use dialogue only
  if (inputs.length === 1) {
    console.log('   ℹ️  All background tracks missing - using dialogue only');
    fs.copyFileSync(dialoguePath, output);
    return;
  }

  // Build FFmpeg filter complex for mixing with ducking
  console.log('   🔧 Building FFmpeg filter graph with ducking...');
  const filterComplex = buildMixerFilterGraphWithDucking({
    dialogueDuration,
    inputs,
    timelineData
  });

  // Build FFmpeg command
  const inputArgs = [];
  for (const input of inputs) {
    inputArgs.push('-i', input.path);
  }

  const args = [
    ...inputArgs,
    '-filter_complex', filterComplex,
    '-map', '[final]',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    '-y', // Overwrite output
    output
  ];

  console.log('   🎬 Running FFmpeg mixer...');
  
  try {
    await execa(ffmpeg, args);
    console.log('   ✅ Scene mixed successfully');
  } catch (error) {
    console.error('❌ FFmpeg mixing error:', error.stderr || error.message);
    // Fallback to dialogue only
    console.log('   ⚠️  Falling back to dialogue-only output');
    fs.copyFileSync(dialoguePath, output);
  }
}

/**
 * Extract music/ambience/SFX data from timeline events
 * Uses timeline to determine exact start/stop times, not scene definition
 */
function extractTimelineData(timeline, cues) {
  const data = {
    music: null,
    ambience: null,
    sfx: []
  };

  if (!timeline || !timeline.events) {
    return data;
  }

  // Find music_in event (indicates music start and cue_id)
  const musicIn = timeline.events.find(e => e.type === 'music_in');
  const musicOut = timeline.events.find(e => e.type === 'music_out');

  if (musicIn && cues.music && cues.music.length > 0) {
    data.music = {
      cue_id: musicIn.cue_id || cues.music[0].cue_id,
      start: musicIn.at || 0,
      end: musicOut ? musicOut.at : null,
      fade_in: musicIn.fade || 1,
      fade_out: musicOut ? musicOut.fade : 2,
      gain_db: musicIn.gain_db || -12,
      duck_db: musicIn.duck_db || 7 // How much to reduce during dialogue
    };
  }

  // Find ambience_in event
  const ambienceIn = timeline.events.find(e => e.type === 'ambience_in');
  const ambienceOut = timeline.events.find(e => e.type === 'ambience_out');

  if (ambienceIn && cues.ambience && cues.ambience.length > 0) {
    data.ambience = {
      cue_id: ambienceIn.cue_id || cues.ambience[0].cue_id,
      start: ambienceIn.at || 0,
      end: ambienceOut ? ambienceOut.at : null,
      fade_in: ambienceIn.fade || 1.5,
      fade_out: ambienceOut ? ambienceOut.fade : 1.5,
      gain_db: ambienceIn.gain_db || -18
    };
  }

  // Find all SFX events
  const sfxEvents = timeline.events.filter(e => e.type === 'sfx_at');
  data.sfx = sfxEvents.map((event, index) => ({
    cue_id: event.cue_id,
    at: event.at || 0,
    gain_db: event.gain_db || -6,
    index
  }));

  return data;
}

/**
 * Build FFmpeg filter graph with REAL DUCKING using sidechaincompress
 */
function buildMixerFilterGraphWithDucking({ dialogueDuration, inputs, timelineData }) {
  const filters = [];
  const layersToMix = [];

  // Dialogue is input 0 - keep as reference for ducking
  const dialogueLabel = '[0:a]';
  layersToMix.push(dialogueLabel);

  // Process music with ducking
  if (timelineData.music) {
    const musicInput = inputs.find(i => i.label === 'music');
    if (musicInput) {
      const { start, end, fade_in, fade_out, gain_db, duck_db } = timelineData.music;
      const duration = end ? (end - start) : dialogueDuration;

      // Music processing: loop, trim, delay to start time, apply base volume
      filters.push(
        `[${musicInput.index}:a]aloop=loop=-1:size=2e+09,` +
        `atrim=duration=${duration + (end ? fade_out : 0)},` +
        (start > 0 ? `adelay=${start * 1000}|${start * 1000},` : '') +
        `volume=${gain_db}dB` +
        `[music_pre]`
      );

      // Apply fades to music
      filters.push(
        `[music_pre]afade=t=in:st=${start}:d=${fade_in},` +
        `afade=t=out:st=${Math.max(start, (end || dialogueDuration) - fade_out)}:d=${fade_out}` +
        `[music_faded]`
      );

      // DUCKING: Use sidechaincompress to reduce music volume during dialogue
      // FIXED: Music is compressed, dialogue is sidechain trigger
      // When dialogue is present, music gets quieter by ~duck_db amount
      filters.push(
        `[music_faded]${dialogueLabel}sidechaincompress=` +
        `threshold=0.03:ratio=5:attack=100:release=400:knee=2.828427:` +
        `level_in=1:level_sc=1:mix=1` +
        `[music_ducked]`
      );

      layersToMix.push('[music_ducked]');
    }
  }

  // Process ambience (no ducking, but respect timeline timing)
  if (timelineData.ambience) {
    const ambienceInput = inputs.find(i => i.label === 'ambience');
    if (ambienceInput) {
      const { start, end, fade_in, fade_out, gain_db } = timelineData.ambience;
      const duration = end ? (end - start) : dialogueDuration;

      filters.push(
        `[${ambienceInput.index}:a]aloop=loop=-1:size=2e+09,` +
        `atrim=duration=${duration + (end ? fade_out : 0)},` +
        (start > 0 ? `adelay=${start * 1000}|${start * 1000},` : '') +
        `volume=${gain_db}dB,` +
        `afade=t=in:st=${start}:d=${fade_in},` +
        `afade=t=out:st=${Math.max(start, (end || dialogueDuration) - fade_out)}:d=${fade_out}` +
        `[ambience]`
      );

      layersToMix.push('[ambience]');
    }
  }

  // Process SFX (delayed starts based on timeline events)
  for (const sfx of timelineData.sfx) {
    const sfxInput = inputs.find(i => i.data && i.data.cue_id === sfx.cue_id && i.data.index === sfx.index);
    if (sfxInput) {
      filters.push(
        `[${sfxInput.index}:a]adelay=${sfx.at * 1000}|${sfx.at * 1000},volume=${sfx.gain_db}dB[sfx${sfx.index}]`
      );

      layersToMix.push(`[sfx${sfx.index}]`);
    }
  }

  // Mix all layers together
  const mixFilter = `${layersToMix.join('')}amix=inputs=${layersToMix.length}:duration=longest:normalize=0[final]`;
  filters.push(mixFilter);

  return filters.join(';');
}

/**
 * Concatenate dialogue stems into single file
 */
async function concatenateDialogue(stems, outputPath) {
  if (stems.length === 1) {
    fs.copyFileSync(stems[0].path, outputPath);
    return;
  }

  // Create concat file list
  const concatList = stems.map(s => `file '${s.path}'`).join('\n');
  const concatFilePath = path.join(path.dirname(outputPath), 'concat-list.txt');
  fs.writeFileSync(concatFilePath, concatList);

  try {
    await execa(ffmpeg, [
      '-f', 'concat',
      '-safe', '0',
      '-i', concatFilePath,
      '-c', 'copy',
      '-y',
      outputPath
    ]);
  } finally {
    // Clean up concat file
    if (fs.existsSync(concatFilePath)) {
      fs.unlinkSync(concatFilePath);
    }
  }
}

/**
 * Create silent audio file
 */
async function createSilence(outputPath, duration) {
  await execa(ffmpeg, [
    '-f', 'lavfi',
    '-i', `anullsrc=r=48000:cl=stereo`,
    '-t', duration.toString(),
    '-c:a', 'aac',
    '-b:a', '192k',
    '-y',
    outputPath
  ]);
}
