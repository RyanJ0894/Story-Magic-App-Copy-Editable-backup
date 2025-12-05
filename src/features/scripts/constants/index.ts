import type { VoiceOption, AudioOptions } from '../types';

export const VOICE_OPTIONS: VoiceOption[] = [
  { key: "natural", label: "Natural Voice", type: "neutral" },
  { key: "female_soft", label: "Female Soft", type: "dialogue" },
  { key: "male_deep", label: "Male Deep", type: "dialogue" },
  { key: "narrator", label: "Narrator", type: "narration" },
  { key: "child", label: "Child", type: "dialogue" },
  { key: "elderly", label: "Elderly", type: "dialogue" },
];

export const AUDIO_OPTIONS: AudioOptions = {
  music: [
    { key: "epic_orchestra", label: "Epic Orchestra" },
    { key: "peaceful_theme", label: "Peaceful Theme" },
    { key: "dramatic_score", label: "Dramatic Score" },
    { key: "ambient_soundscape", label: "Ambient Soundscape" },
  ],
  ambience: [
    { key: "battlefield", label: "Battlefield" },
    { key: "forest", label: "Forest" },
    { key: "city", label: "City" },
    { key: "ocean", label: "Ocean" },
  ],
  sfx: [
    { key: "cat_meow", label: "Cat Meow" },
    { key: "footsteps", label: "Footsteps" },
    { key: "door_close", label: "Door Close" },
    { key: "thunder", label: "Thunder" },
  ]
};

export const DEFAULT_AUDIO_CONTROLS = {
  musicVolume: 0.3,
  ambienceVolume: 0.4,
  sfxVolume: 0.2,
  masterVolume: 1.0,
  selectedVoices: {},
  selectedSfx: {}
};

export const TTS_CREDITS_COST = 90;
