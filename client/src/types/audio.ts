export type AudioType = "music" | "ambience" | "sfx" | "voice" | "other";

export type AudioDirection = {
    music: Track[]
    ambience: Track[]
    sfx: Track[]
}


export type Project = {
    project_id: string
    title: string
    description: string
    language: string
    created_at: string
    updated_at: string
    status: "in_progress" | "completed" | "archived"
    chunks: ChunkRef[]
}

export type ChunkRef = {
    chunk_id: string
    scene_title: string
    order: number
    start: number
    duration: number
}

export type Chunk = {
    chunk_id: string
    project_id: string
    scene_title: string
    director_notes: string
    version: number
    lines: Line[]
    audio_direction: AudioDirection
}

export type Line = {
    line_id: string
    type: "narration" | "dialogue"
    text: string
    tts_settings: TTSSettings
    src: string | null
    start: number
    duration: number
    volume: number
    fade_in: number
    fade_out: number
}

export type TTSSettings = {
    provider: string
    voice_key: string
    style: string
    character: string | null
    language: string
    speed?: number
    pitch?: number
    status: "pending" | "done" | "dirty" | "failed"
    credits_used: number
}

export type Track = {
    track_id: string
    label: string
    src: string
    start: number
    duration: number
    volume: number
    fade_in: number
    fade_out: number
}
