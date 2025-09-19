export type SceneLine = {
  type: "narration" | "dialogue";
  text: string;
  voice_key?: string;
  style_prompt?: string;
  character?: string;
};

export type DirectionItem = {
  src: string;
  start: number; // seconds
  duration?: number; // seconds
  volume?: number; // 0..1
  fade_in?: number; // seconds
  fade_out?: number; // seconds
  loop?: boolean;
};

export type AudioDirection = {
  music?: DirectionItem[];
  ambience?: DirectionItem[];
  sfx?: DirectionItem[];
};

export type SceneSpec = {
  scene_title?: string;
  lines?: SceneLine[];
  audio_direction?: AudioDirection;
  director_notes?: string;
};
