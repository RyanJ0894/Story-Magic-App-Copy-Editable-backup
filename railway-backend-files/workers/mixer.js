// workers/mixer.js
import { execa } from 'execa';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';
import fs from 'fs';
import path from 'path';
import { getTrackPath, validateSceneTracks } from '../lib/catalog-loader.js';

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
 * 
 * @param {Object} options
 * @param {Object} options.scene - Scene object with music/ambience/sfx cues
 * @param {Object} options.timeline - Timeline with all events
 * @param {Array} options.stems - Dialogue TTS stems
 * @param {Object} options.cues - Selected cues (currently unused, using scene data)
 * @param {string} options.output - Output file path
 */
export async function mixScene(options) {
  const { scene, timeline, stems, output } = options;

  console.log('🎵 Mixing scene audio...');

  // Validate all required tracks exist
  const validation = validateSceneTracks(scene);
  if (!validation.valid) {
    console.warn('⚠️  Some tracks are missing from catalog:');
    for (const missing of validation.missing) {
      console.warn(`   - ${missing}`);
    }
    console.warn('⚠️  Continuing with available tracks only...');
  }

  // If no dialogue stems, create silence
  if (!stems || stems.length === 0) {
    console.log('⚠️  No dialogue stems - creating silent scene');
    await createSilence(output, 10); // 10 second silence
    return;
  }

  // Concatenate all dialogue stems into one file
  console.log(`   📝 Concatenating ${stems.length} dialogue stems...`);
  const dialoguePath = path.join(path.dirname(output), `dialogue-${scene.scene_id}.m4a`);
  await concatenateDialogue(stems, dialoguePath);

  const dialogueDuration = await getAudioDuration(dialoguePath);
  console.log(`   ✅ Dialogue duration: ${dialogueDuration.toFixed(2)}s`);

  // Collect all audio inputs
  const inputs = [{ path: dialoguePath, label: 'dialogue' }];
  
  // Add music tracks
  const musicTracks = [];
  if (scene.music && scene.music.length > 0) {
    for (let i = 0; i < scene.music.length; i++) {
      const musicCue = scene.music[i];
      const trackPath = getTrackPath(musicCue.track_id);
      if (trackPath) {
        musicTracks.push({ cue: musicCue, path: trackPath, index: i });
        inputs.push({ path: trackPath, label: `music${i}` });
        console.log(`   🎵 Music track ${i + 1}: ${musicCue.track_id}`);
      }
    }
  }

  // Add ambience track
  let ambienceTrack = null;
  if (scene.ambience && scene.ambience.track_id) {
    const trackPath = getTrackPath(scene.ambience.track_id);
    if (trackPath) {
      ambienceTrack = { cue: scene.ambience, path: trackPath };
      inputs.push({ path: trackPath, label: 'ambience' });
      console.log(`   🌊 Ambience: ${scene.ambience.track_id}`);
    }
  }

  // Add SFX tracks
  const sfxTracks = [];
  if (scene.sfx && scene.sfx.length > 0) {
    for (let i = 0; i < scene.sfx.length; i++) {
      const sfxCue = scene.sfx[i];
      const trackPath = getTrackPath(sfxCue.track_id);
      if (trackPath) {
        sfxTracks.push({ cue: sfxCue, path: trackPath, index: i });
        inputs.push({ path: trackPath, label: `sfx${i}` });
        console.log(`   🔊 SFX ${i + 1}: ${sfxCue.track_id} @ ${sfxCue.at}s`);
      }
    }
  }

  // If only dialogue (no background tracks), just use dialogue file
  if (musicTracks.length === 0 && !ambienceTrack && sfxTracks.length === 0) {
    console.log('   ℹ️  No background tracks - using dialogue only');
    fs.copyFileSync(dialoguePath, output);
    return;
  }

  // Build FFmpeg filter complex for mixing
  console.log('   🔧 Building FFmpeg filter graph...');
  const filterComplex = buildMixerFilterGraph({
    dialogueDuration,
    musicTracks,
    ambienceTrack,
    sfxTracks
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
 * Build FFmpeg filter graph for mixing all audio tracks
 */
function buildMixerFilterGraph({ dialogueDuration, musicTracks, ambienceTrack, sfxTracks }) {
  const filters = [];
  const mixInputs = [];

  // Dialogue is input 0 - no processing needed
  mixInputs.push('[0:a]');

  // Process music tracks with volume and ducking
  if (musicTracks.length > 0) {
    for (let i = 0; i < musicTracks.length; i++) {
      const { cue, index } = musicTracks[i];
      const inputIndex = 1 + i; // Music starts at input 1
      const volume = cue.volume || 0.25;
      const fadeIn = cue.fade_in || 2;
      const fadeOut = cue.fade_out || 2;

      // Apply volume, loop if needed, fade in/out
      filters.push(
        `[${inputIndex}:a]aloop=loop=-1:size=2e+09,` + // Loop indefinitely
        `atrim=duration=${dialogueDuration},` + // Trim to dialogue duration
        `volume=${volume},` + // Base volume
        `afade=t=in:st=0:d=${fadeIn},` + // Fade in
        `afade=t=out:st=${Math.max(0, dialogueDuration - fadeOut)}:d=${fadeOut}` + // Fade out
        `[music${i}]`
      );
      
      mixInputs.push(`[music${i}]`);
    }
  }

  // Process ambience track
  if (ambienceTrack) {
    const inputIndex = 1 + musicTracks.length;
    const volume = ambienceTrack.cue.volume || 0.28;
    const fadeIn = ambienceTrack.cue.fade_in || 1.5;
    const fadeOut = ambienceTrack.cue.fade_out || 1.5;

    filters.push(
      `[${inputIndex}:a]aloop=loop=-1:size=2e+09,` + // Loop indefinitely
      `atrim=duration=${dialogueDuration},` + // Trim to dialogue duration
      `volume=${volume},` + // Base volume
      `afade=t=in:st=0:d=${fadeIn},` + // Fade in
      `afade=t=out:st=${Math.max(0, dialogueDuration - fadeOut)}:d=${fadeOut}` + // Fade out
      `[ambience]`
    );

    mixInputs.push('[ambience]');
  }

  // Process SFX tracks (delayed starts)
  if (sfxTracks.length > 0) {
    for (let i = 0; i < sfxTracks.length; i++) {
      const { cue, index } = sfxTracks[i];
      const inputIndex = 1 + musicTracks.length + (ambienceTrack ? 1 : 0) + i;
      const volume = cue.volume || 0.5;
      const delay = cue.at || 0;

      // Add silence delay, then SFX
      filters.push(
        `[${inputIndex}:a]adelay=${delay * 1000}|${delay * 1000},volume=${volume}[sfx${i}]`
      );

      mixInputs.push(`[sfx${i}]`);
    }
  }

  // Mix all inputs together
  const mixFilter = `${mixInputs.join('')}amix=inputs=${mixInputs.length}:duration=longest:normalize=0[final]`;
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
