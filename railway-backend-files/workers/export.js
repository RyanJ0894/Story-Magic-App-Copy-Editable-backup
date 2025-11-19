import { execa } from 'execa';
import ffmpegPath from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';

const ffmpeg = ffmpegPath;

export async function concatScenesWithCrossfade(scenePaths, outputPath, options = {}) {
  const { fadeDuration = 1.5, fadeType = 'tri' } = options;

  if (scenePaths.length === 0) {
    throw new Error('No scenes to concatenate');
  }

  if (scenePaths.length === 1) {
    fs.copyFileSync(scenePaths[0], outputPath);
    return;
  }

  // Build filter complex for crossfading
  const filters = [];
  const inputs = [];

  for (const scenePath of scenePaths) {
    inputs.push('-i', scenePath);
  }

  // Build crossfade chain
  let currentLabel = '[0:a]';
  for (let i = 1; i < scenePaths.length; i++) {
    const nextLabel = `[${i}:a]`;
    const outputLabel = i === scenePaths.length - 1 ? '[final]' : `[cf${i}]`;
    
    filters.push(
      `${currentLabel}${nextLabel}acrossfade=d=${fadeDuration}:c1=${fadeType}:c2=${fadeType}${outputLabel}`
    );
    
    currentLabel = outputLabel;
  }

  const args = [
    ...inputs,
    '-filter_complex', filters.join(';'),
    '-map', '[final]',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-ar', '48000',
    '-y',
    outputPath
  ];

  await execa(ffmpeg, args);
}

export async function makePlaybackManifest(projectId, sceneOutputs, crossfadeDuration) {
  let currentTime = 0;
  const scenes = [];

  for (const sceneOutput of sceneOutputs) {
    const duration = await getAudioDuration(sceneOutput.path);
    
    scenes.push({
      scene_id: sceneOutput.scene_id,
      start: currentTime,
      duration: duration
    });

    currentTime += duration - crossfadeDuration; // Account for crossfade overlap
  }

  return {
    project_id: projectId,
    total: currentTime,
    scenes: scenes,
    public_url: null // Will be set after Supabase upload
  };
}

async function getAudioDuration(filePath) {
  const ffprobePath = (await import('ffprobe-static')).default.path;
  
  try {
    const { stdout } = await execa(ffprobePath, [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ]);
    return parseFloat(stdout);
  } catch (error) {
    console.error(`Error getting duration for ${filePath}:`, error.message);
    return 0;
  }
}
