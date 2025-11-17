# Story Magic - AI-Powered Cinematic Audio Production

## Overview

Story Magic is an AI-powered platform that transforms film screenplays into professional cinematic audio experiences. The application processes uploaded screenplay PDFs and generates complete audio productions featuring AI-generated dialogue, context-aware background music, scene-appropriate ambience, and sound effects with professional mixing and normalization.

The system uses a React + TypeScript frontend with Supabase backend, integrating with RelevanceAI for screenplay analysis and a Railway-hosted audio production pipeline. Users can upload scripts, assign AI voices to characters, and receive fully produced audio files with adaptive ducking, crossfades, and EBU R128 loudness normalization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript, built using Vite as the build tool.

**UI Framework**: shadcn/ui component library built on Radix UI primitives with Tailwind CSS for styling. The design system uses a cinema-themed color palette with gold accents (`--cinema-gold: 45 93% 47%`) and dark surfaces (`--cinema-dark: 222 47% 11%`).

**State Management**: 
- React Query (@tanstack/react-query) for server state and caching
- React Context for authentication state (AuthProvider)
- Local component state for UI interactions

**Routing**: React Router v6 with feature-based route organization. Protected routes check authentication status before rendering dashboard and project pages.

**Key Design Patterns**:
- Feature-based folder structure (`src/features/`) separating concerns by domain (projects, auth, timeline, scripts)
- Custom hooks pattern for business logic reuse (useAuth, useUserRole, usePlanProtection)
- Service layer pattern separating API calls from components

### Backend Architecture

**Primary Database**: Supabase (PostgreSQL) serving as the main data store.

**Database Schema**:
- `profiles`: User profiles with role-based permissions (Master, Team Lead, Staff, Client) and plan tiers
- `projects`: Screenplay projects with metadata, status tracking, and user associations
- `ai_events`: Event logging for AI processing pipeline
- `agent_logs`: Structured logging from RelevanceAI agents

**Authentication**: Supabase Auth with email/password, supporting session management and row-level security policies.

**Edge Functions**: Supabase Edge Functions handle:
- `trigger-relevance`: Initiates RelevanceAI screenplay analysis
- `ai-director-callback`: Receives Director JSON from RelevanceAI
- `fetch-elevenlabs-voices`: Retrieves available AI voice catalog

**File Storage**: Supabase Storage buckets for screenplay PDFs and generated audio files (M4A format).

### Audio Production Pipeline

**Workflow**:
1. User uploads screenplay PDF → Frontend extracts text using pdf.js
2. Frontend triggers RelevanceAI agent via Supabase Edge Function
3. RelevanceAI "Ace, the AI Director" agent analyzes screenplay and generates Director JSON containing:
   - Scene-by-scene breakdown
   - Character dialogue with voice assignments (ElevenLabs voice IDs)
   - Music cues with timing and fade specifications
   - Ambience tracks with loop settings
   - Sound effects with precise timestamps
4. Director JSON saved to Supabase via callback
5. Frontend polls database for Director JSON completion
6. Once available, frontend sends Director JSON to Railway orchestrator
7. Railway backend processes audio:
   - Generates TTS for all dialogue using ElevenLabs API
   - Loads music/ambience/SFX from pre-uploaded catalog
   - Builds timeline with all audio events
   - Applies adaptive ducking (music volume reduces during dialogue)
   - Normalizes to -16 LUFS (EBU R128 standard)
   - Concatenates scenes with crossfades
   - Exports final M4A file
8. Railway uploads audio to Supabase Storage
9. Frontend receives public URL and displays audio player

**Audio Processing Technologies**:
- ElevenLabs API for text-to-speech voice generation
- FFmpeg (via @ffmpeg/ffmpeg) for client-side audio manipulation
- Custom mixing engine on Railway with ducking algorithms

**Director JSON Schema**: Defines structure for scenes with:
- `scene_id`, `summary`, `mood`, `intensity`
- `dialogue[]`: Array of lines with `line_id`, `character`, `text`
- `music[]`: Tracks with `track_id`, `at`, `duration`, `volume`, `fade_in`, `fade_out`
- `ambience{}`: Similar structure to music
- `sfx[]`: Sound effects with `cue_id`, `at`, `track_id`, `volume`

### Third-Party Integrations

**RelevanceAI**: 
- Purpose: AI agent platform for screenplay analysis
- Integration: Triggered via Supabase Edge Function using agent-specific webhook
- Returns: Structured Director JSON with scene breakdowns and audio cues
- Known Issue: Agent currently only processes first scene instead of complete screenplay (documented in DIAGNOSIS_SUMMARY.md)

**ElevenLabs**:
- Purpose: Text-to-speech voice generation
- Integration: API calls for voice catalog fetching and audio generation
- Voice Library: 20+ voices categorized by age/gender (Female 20s-30s, Male Teen, Narrator, etc.)
- Configuration: Voice IDs stored in knowledge base, referenced in Director JSON

**Railway**:
- Purpose: Audio production orchestrator hosted service
- Endpoint: `https://web-production-7c7a9.up.railway.app/orchestrate`
- Input: Complete Director JSON with all scenes and audio cues
- Output: Final mixed audio file URL in Supabase Storage
- Validation: Strict schema validation for Director JSON structure

**Supabase**:
- Purpose: Backend-as-a-Service providing database, auth, storage, and edge functions
- Project ID: bcuhyyyerxwgkrkbrqbs
- Storage: Public bucket for audio files with signed URL access
- RLS Policies: Row-level security enforcing user-based data access

### Role-Based Access Control

**Hierarchy**: Master → Team Lead → Staff → Client

**Permissions**:
- **Master**: Full system access, can invite all roles, sees all projects/team members
- **Team Lead**: Can invite Staff and Clients, sees invited users' projects only
- **Staff**: No invitation rights, individual project access
- **Client**: Limited access, view-only for assigned projects

**Plan Tiers**: Individual, Starter Enterprise, Professional Enterprise, Studio Enterprise, Enterprise Unlimited, University Academic. Each tier unlocks specific dashboard tabs and features.

**Security**: Roles stored in separate `user_roles` table with RLS policies preventing privilege escalation. Only Masters can modify roles via secure database functions.

### Key Technical Decisions

**Why Supabase over traditional backend**: Needed rapid development with built-in auth, storage, and real-time capabilities. Supabase provides all services with automatic RLS and minimal DevOps overhead.

**Why React Query**: Server state management with automatic caching, background refetching, and optimistic updates reduces boilerplate and improves UX. Alternative considered was Redux, but added unnecessary complexity for primarily server-driven state.

**Why Railway for audio processing**: Audio mixing requires significant CPU and FFmpeg libraries. Railway provides containerized deployment with sufficient resources, while frontend remains lightweight. Considered AWS Lambda but cold starts were unacceptable for 5-10 minute audio generation.

**Why feature-based folder structure**: As project grows, domain-driven organization (projects, auth, timeline) scales better than layer-based (components, hooks, services). Makes ownership and refactoring clearer.

**Why ElevenLabs over alternatives**: Superior voice quality compared to AWS Polly or Google TTS. Extensive voice library with emotion/style controls. API reliability has been consistent.

**Why storing Director JSON in database vs. files**: Enables real-time polling, easier querying, and automatic backups via Supabase. File storage would require custom polling mechanism and S3-style access patterns.

**Known Architectural Debt**:
- RelevanceAI agent only processes first scene (fix documented in FIXED_RELEVANCE_AGENT_PROMPT.md)
- No automatic retry mechanism if Railway orchestrator fails
- Audio generation is synchronous; long scripts block UI (should move to background jobs)
- Voice library fetching could be cached client-side instead of repeated API calls