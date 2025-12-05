import type { SceneSpec, DirectionItem } from "../types/scene";

export type EnrichedAudioItem = {
  id: string;
  title: string;
  type: "music" | "ambience" | "sfx" | "voice" | "other";
  src?: string;
  start: number;
  end: number;
  duration: number;
  volume?: number;
  fadeIn?: number;
  fadeOut?: number;
  loop?: boolean;
};

function mapItems(type: EnrichedAudioItem["type"], items?: DirectionItem[]): EnrichedAudioItem[] {
  if (!items?.length) return [];
  return items.map((it, i) => {
    const start = Math.max(0, it.start ?? 0);
    const duration = Math.max(0, it.duration ?? 0);
    const end = start + duration;
    const title = (it.src?.split("/").pop() || `${type}-${i}`).split("?")[0];
    return {
      id: `${type}-${i}`,
      title,
      type,
      src: it.src,
      start,
      end,
      duration,
      volume: it.volume,
      fadeIn: it.fade_in,
      fadeOut: it.fade_out,
      loop: it.loop,
    };
  });
}

export function buildEnrichedAudioFromScene(scene: SceneSpec) {
  const music = mapItems("music", scene.audio_direction?.music);
  const ambience = mapItems("ambience", scene.audio_direction?.ambience);
  const sfx = mapItems("sfx", scene.audio_direction?.sfx);
  const all = [...music, ...ambience, ...sfx].sort((a, b) => a.start - b.start);
  const duration = all.reduce((acc, cur) => Math.max(acc, cur.end), 0);
  return { duration, items: all };
}
