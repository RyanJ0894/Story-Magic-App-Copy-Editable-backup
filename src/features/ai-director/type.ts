export type AudioType = "music" | "ambience" | "sfx" | "voice" | "other";

export type AiDirectorJson = {
    chunk_id: string;
    project_id: string;
    scene_title: string;
    version: number;
    lines: AiDirectorLine[];
    audio_direction: AudioDirection;
    director_notes: string;
};

export type AiDirectorLine = {
    line_id: string;
    type: string;
    text: string;
    tts_settings: AiDirectorTTSSettings;
    src: string | null;
    start: number;
    duration: number;
    volume: number;
    fade_in: number;
    fade_out: number;
};

export type AiDirectorTTSSettings = {
    provider: string;
    voice_key: string;
    style: string;
    character: string | null;
    language: string;
    speed?: number;
    pitch?: number;
    status: string;
    credits_used: number;
};

export type AudioDirection = {
    music: AudioTrack[];
    ambience: AudioTrack[];
    sfx: AudioTrack[];
};

export type AudioTrack = {
    track_id: string;
    label: string;
    src: string;
    start: number;
    duration: number;
    volume: number;
    fade_in: number;
    fade_out: number;
};
