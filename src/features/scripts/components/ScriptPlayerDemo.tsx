import { useState, useEffect } from "react";
import ScriptPlayer from "./ScriptPlayer";
import AudioPlayer from "./AudioPlayer";
import type { ChunkData } from "@/features/timeline/types";

const demoChunks: ChunkData[] = [
  {
    chunk_id: "chunk_demo_001",
    project_id: "proj_demo",
    scene_title: "EXT. PARK – DAY",
    version: 1.0,
    director_notes: "Demo chunk for testing audio playback",
    lines: [
      {
        line_id: "line_demo_001",
        type: "narration",
        text: "Exterior. Park. Day. A gentle breeze moves through the trees as Mary and John walk along the winding path.",
        tts_settings: {
          provider: "elevenlabs",
          voice_key: "narrator",
          style: "neutral",
          character: "Narrator",
          language: "en-US",
          speed: 1.0,
          pitch: 0,
          status: "completed",
          credits_used: 10
        },
        src: "https://bcuhyyyerxwgkrkbrqbs.supabase.co/storage/v1/object/public/audio/projects/0a413ef3-320e-4200-98cd-1cf2b9e22a0e/line_1_1757524910012.mp3",
        start: 1,
        duration: 5,
        volume: 0.9,
        fade_in: 0,
        fade_out: 0
      },
      {
        line_id: "line_demo_002",
        type: "dialogue",
        text: "It's so peaceful here, John. I could stay forever.",
        tts_settings: {
          provider: "elevenlabs",
          voice_key: "female_soft",
          style: "soft",
          character: "MARY",
          language: "en-US",
          speed: 1.0,
          pitch: 0,
          status: "completed",
          credits_used: 8
        },
        src: null, // No audio for this line
        start: 6,
        duration: 3,
        volume: 1.0,
        fade_in: 0,
        fade_out: 0
      },
      {
        line_id: "line_demo_003",
        type: "dialogue",
        text: "I know what you mean. But we should keep moving.",
        tts_settings: {
          provider: "elevenlabs",
          voice_key: "male_deep",
          style: "calm",
          character: "JOHN",
          language: "en-US",
          speed: 1.0,
          pitch: 0,
          status: "completed",
          credits_used: 8
        },
        src: null, // No audio for this line
        start: 9,
        duration: 3,
        volume: 1.0,
        fade_in: 0,
        fade_out: 0
      }
    ],
    audio_direction: {
      music: [
        {
          track_id: "music_001",
          label: "Piano Soft Mysterious",
          src: "https://bcuhyyyerxwgkrkbrqbs.supabase.co/storage/v1/object/public/story-magic-assets/music/m_paino_soft_mysterious_01.mp3",
          start: 0,
          duration: 15,
          volume: 0.4,
          fade_in: 1,
          fade_out: 1
        }
      ],
      ambience: [
        {
          track_id: "amb_001",
          label: "Soul Jazz Love",
          src: "https://bcuhyyyerxwgkrkbrqbs.supabase.co/storage/v1/object/public/story-magic-assets/music/m_soul_jazz_love_02.mp3",
          start: 0,
          duration: 15,
          volume: 0.3,
          fade_in: 0.5,
          fade_out: 0.5
        }
      ],
      sfx: [
        {
          track_id: "sfx_001",
          label: "Cat Meow",
          src: "https://bcuhyyyerxwgkrkbrqbs.supabase.co/storage/v1/object/public/story-magic-assets/sfx/s_cat_meow_01.wav",
          start: 4,
          duration: 0.5,
          volume: 0.5,
          fade_in: 0.2,
          fade_out: 0
        }
      ]
    }
  }
];

export default function ScriptPlayerDemo() {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(15);

  // Simple timer for demo
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 0.1;
          if (newTime >= duration) {
            setIsPlaying(false);
            return duration;
          }
          return newTime;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handlePlayPause = (playing: boolean) => {
    setIsPlaying(playing);
  };

  const handleLineChange = (lineId: string) => {
    console.log("Active line changed:", lineId);
  };

  const handleVoiceChange = (lineId: string, voiceKey: string) => {
    console.log("Voice changed:", lineId, voiceKey);
  };

  const handleVolumeChange = (trackId: string, volume: number) => {
    console.log("Volume changed:", trackId, volume);
  };

  const handleSfxChange = (trackId: string, sfxKey: string) => {
    console.log("SFX changed:", trackId, sfxKey);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Script Player Demo</h2>
        <p className="text-muted-foreground mb-4">
          Demo với audio URLs thực tế để test playback
        </p>
      </div>

      {/* Audio Player - handles actual audio playback */}
      <AudioPlayer 
        chunks={demoChunks}
        currentTime={currentTime}
        isPlaying={isPlaying}
      />

      <ScriptPlayer 
        chunks={demoChunks} 
        currentTime={currentTime}
        isPlaying={isPlaying}
        duration={duration}
        onSeek={handleSeek}
        onPlayPause={handlePlayPause}
        onLineChange={handleLineChange}
        onVoiceChange={handleVoiceChange}
        onVolumeChange={handleVolumeChange}
        onSfxChange={handleSfxChange}
      />
    </div>
  );
}