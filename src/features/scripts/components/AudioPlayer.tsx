import { useEffect, useRef, useMemo } from 'react';
import type { ChunkData } from '@/features/timeline/types';

interface AudioPlayerProps {
  chunks: ChunkData[];
  currentTime: number;
  isPlaying: boolean;
}

export default function AudioPlayer({ 
  chunks, 
  currentTime, 
  isPlaying 
}: AudioPlayerProps) {
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  
  const stableChunks = useMemo(() => chunks, [chunks.map(c => c.chunk_id).join(',')]);

  useEffect(() => {
    const chunkIds = stableChunks.map(c => c.chunk_id).sort().join(',');
    const currentChunkIds = audioRefs.current.get('_chunkIds') as unknown as string;
    
    if (chunkIds !== currentChunkIds) {
      audioRefs.current.forEach((audio, key) => {
        if (key !== '_chunkIds' && audio && typeof audio.pause === 'function') {
          audio.pause();
          audio.src = '';
          audio.load();
        }
      });
      audioRefs.current.clear();
      
      stableChunks.forEach(chunk => {
        chunk.lines.forEach(line => {
          if (line.src) {
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.preload = 'none';
            audio.volume = line.volume || 1;
            audio.src = line.src;
            audioRefs.current.set(line.line_id, audio);
          }
        });

        const audioTracks = [
          ...chunk.audio_direction.music.map(track => ({ ...track, type: 'music' })),
          ...chunk.audio_direction.ambience.map(track => ({ ...track, type: 'ambience' })),
          ...chunk.audio_direction.sfx.map(track => ({ ...track, type: 'sfx' }))
        ];

        audioTracks.forEach(track => {
          if (track.src) {
            const audio = new Audio();
            audio.crossOrigin = 'anonymous';
            audio.preload = 'none';
            audio.volume = track.volume || 1;
            audio.src = track.src;
            audioRefs.current.set(track.track_id, audio);
          }
        });
      });
      
      audioRefs.current.set('_chunkIds', chunkIds as any);
    }

    return () => {
      audioRefs.current.forEach((audio, key) => {
        if (key !== '_chunkIds' && audio && typeof audio.pause === 'function') {
          audio.pause();
          audio.src = '';
          audio.load();
        }
      });
      audioRefs.current.clear();
    };
  }, [stableChunks]);

  useEffect(() => {
    if (!isPlaying) {
      audioRefs.current.forEach((audio, key) => {
        if (key !== '_chunkIds' && audio && typeof audio.pause === 'function' && !audio.paused) {
          audio.pause();
        }
      });
      return;
    }
  }, [isPlaying]);

  const lastProcessedTime = useRef(0);
  const processedAudio = useRef(new Set<string>());

  useEffect(() => {
    if (!isPlaying) {
      processedAudio.current.clear();
      return;
    }

    if (Math.abs(currentTime - lastProcessedTime.current) < 0.05) {
      return;
    }
    lastProcessedTime.current = currentTime;

    console.log('🎵 AudioPlayer: Processing audio at time:', currentTime);
    
    for (const chunk of stableChunks) {
      // Process script lines
      for (const line of chunk.lines) {
        if (line.src && audioRefs.current.has(line.line_id)) {
          const audio = audioRefs.current.get(line.line_id)!;
          const shouldPlay = currentTime >= line.start && currentTime < line.start + line.duration;
          const audioKey = `line_${line.line_id}`;
          
          if (shouldPlay && audio.paused && !processedAudio.current.has(audioKey)) {
            console.log('🎵 Playing line:', line.line_id, 'at time:', currentTime - line.start);
            audio.currentTime = currentTime - line.start;
            if (audio.readyState < 2) {
              audio.load();
            }
            audio.play().catch((e) => console.error('Line play error:', e));
            processedAudio.current.add(audioKey);
          } else if (!shouldPlay && !audio.paused) {
            console.log('🎵 Pausing line:', line.line_id);
            audio.pause();
            processedAudio.current.delete(audioKey);
          }
        }
      }

      // Process audio tracks
      const audioTracks = [
        ...chunk.audio_direction.music.map(track => ({ ...track, type: 'music' })),
        ...chunk.audio_direction.ambience.map(track => ({ ...track, type: 'ambience' })),
        ...chunk.audio_direction.sfx.map(track => ({ ...track, type: 'sfx' }))
      ];

      for (const track of audioTracks) {
        if (track.src && audioRefs.current.has(track.track_id)) {
          const audio = audioRefs.current.get(track.track_id)!;
          const shouldPlay = currentTime >= track.start && currentTime < track.start + track.duration;
          const audioKey = `track_${track.track_id}`;
          
          if (shouldPlay && audio.paused && !processedAudio.current.has(audioKey)) {
            console.log('🎵 Playing track:', track.track_id, track.type, 'at time:', currentTime - track.start);
            audio.currentTime = currentTime - track.start;
            if (audio.readyState < 2) {
              audio.load();
            }
            audio.play().catch((e) => console.error('Track play error:', e));
            processedAudio.current.add(audioKey);
          } else if (!shouldPlay && !audio.paused) {
            console.log('🎵 Pausing track:', track.track_id, track.type);
            audio.pause();
            processedAudio.current.delete(audioKey);
          }
        }
      }
    }
  }, [currentTime, isPlaying, stableChunks]);

  return null;
}