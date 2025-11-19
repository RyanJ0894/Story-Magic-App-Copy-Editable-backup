import { execa } from 'execa';
import ffprobePath from 'ffprobe-static';

const ffprobe = ffprobePath.path;

export async function alignScene(projectId, scene, stems) {
  const lines = [];
  let currentTime = 0;

  for (const stem of stems) {
    const duration = await getAudioDuration(stem.path);
    
    lines.push({
      line_id: stem.line_id,
      character: stem.character,
      start: currentTime,
      duration: duration,
      path: stem.path
    });

    currentTime += duration;
  }

  return {
    total_duration: currentTime,
    lines: lines
  };
}

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
    console.error(`Error getting duration for ${filePath}:`, error.message);
    return 0;
  }
}
