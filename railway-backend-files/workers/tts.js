import { execa } from 'execa';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function ttsForScene(projectId, scene) {
  const stems = [];
  
  for (const [index, line] of scene.dialogue.entries()) {
    console.log(`   🎤 Line ${index + 1}/${scene.dialogue.length}: "${line.text.substring(0, 50)}..."`);
    
    const voiceId = line.voice_id || 'pNInz6obpgDQGcFmaJgB'; // Default: Adam voice
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: line.text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      })
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS failed: ${response.status} ${await response.text()}`);
    }

    const outputDir = path.join(process.cwd(), 'output', projectId, 'stems');
    fs.mkdirSync(outputDir, { recursive: true });
    
    const stemPath = path.join(outputDir, `line-${line.line_id}.mp3`);
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(stemPath, Buffer.from(buffer));

    stems.push({
      line_id: line.line_id,
      character: line.character || 'NARRATOR',
      path: stemPath
    });
  }

  return stems;
}
