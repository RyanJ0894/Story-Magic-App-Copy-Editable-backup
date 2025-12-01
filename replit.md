# Story Magic - Voice Cinematic Audio Platform

## Overview

Story Magic is an AI-powered web application that transforms screenplays and scripts into cinematic audio experiences. The platform leverages AI voice synthesis, automated scene direction, and audio mixing to create professional-quality audio productions from written scripts. Users can upload scripts, assign AI voices to characters, and generate complete audio productions with music, ambient sound, and dialogue.

**Core Purpose:** Enable writers, filmmakers, and content creators to hear their scripts come alive through AI-generated voices and cinematic soundscapes before production begins.

**Key Technologies:**
- React 18 with TypeScript
- Vite build system
- Supabase (Backend as a Service)
- ElevenLabs (AI voice synthesis)
- Groq LPU (Ultra-fast LLM inference for script analysis)
- Radix UI components with shadcn/ui
- TanStack Query for state management
- FFmpeg for audio processing

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework:** React 18 with TypeScript, using Vite as the build tool and bundler.

**Rationale:** Vite provides fast development server with HMR (Hot Module Replacement), optimized production builds, and native TypeScript support. React's component-based architecture allows for modular, reusable UI components.

**UI Component System:** The application uses Radix UI primitives wrapped with shadcn/ui theming, providing accessible, customizable components with a consistent cinematic design system.

**State Management Pattern:**
- TanStack Query (React Query) for server state management
- React Context for authentication state
- Local component state for UI interactions

**Routing:** React Router v6 handles client-side routing with route protection for authenticated pages.

**Design System:** Custom "cinematic" theme with gold/blue accent colors, dark mode optimized, using CSS custom properties for theming.

### Backend Architecture

**Backend Platform:** Supabase (PostgreSQL database, Authentication, Edge Functions, Storage)

**Rationale:** Supabase provides a complete backend solution with real-time subscriptions, row-level security, and serverless functions, eliminating the need for custom backend infrastructure.

**Authentication:** Supabase Auth handles user registration, login, password reset, and session management with JWT tokens stored in localStorage.

**Database Schema Key Tables:**
- `profiles` - User profiles with roles (Master, Team Lead, Staff, Client) and plan information
- `projects` - User projects with script content and metadata
- `agent_logs` - AI processing logs and conversation history
- `ai_events` - Tracking of AI operations and events

**Row Level Security (RLS):** Implemented on all tables to ensure users can only access their own data or data they're authorized to view based on role hierarchy.

**Role-Based Access Control:** Hierarchical role system (Master → Team Lead → Staff → Client) with specific permissions for project visibility, team management, and feature access.

### Data Storage Solutions

**Primary Database:** PostgreSQL (via Supabase) for structured data including user profiles, projects, audio chunks, and processing metadata.

**File Storage:** Supabase Storage for audio files, script uploads, and generated audio assets.

**Session Storage:** localStorage for authentication tokens and user session persistence.

### Audio Processing Pipeline

**AI Voice Generation:** Integration with ElevenLabs API for text-to-speech conversion with multiple voice options, styles, and languages.

**Audio Direction System:**
- Scripts are parsed and divided into "chunks" (scenes)
- Each chunk contains lines (dialogue/narration) and audio direction (music, ambience, SFX)
- AI Director (groq-ai-director) analyzes script and generates structured scene data with:
  - Per-line dialogue arrays with character, text, and voice_key assignments
  - Music, ambience, and SFX cues per scene
- Railway Orchestrator generates audio and returns manifest with scene-level timing (offset, duration)
- ScreenplayPlayer synchronizes text highlighting with audio using manifest timing
- Per-line timing within scenes is proportionally distributed based on text length

**FFmpeg Integration:** Client-side FFmpeg (via @ffmpeg/ffmpeg) for audio processing, mixing, and format conversion in the browser.

**Rationale:** Client-side audio processing reduces server load and provides immediate feedback to users. FFmpeg provides professional-grade audio manipulation capabilities.

### Plan & Subscription System

**Plan Tiers:**
- Individual ($30/month) - Single user
- Enterprise tiers (Starter, Professional, Studio, Unlimited)
- Academic tier for universities

**Plan Hierarchy:** Enforced in code with PLAN_HIERARCHY constant to prevent downgrades and manage feature access.

**Upgrade System:** Users can switch between plans with validation, preventing unauthorized plan changes through RLS policies.

## External Dependencies

### Third-Party APIs

**ElevenLabs API**
- Purpose: AI voice synthesis and text-to-speech generation
- Integration: Edge Functions call ElevenLabs API with user API keys or platform keys
- Voice Library: 20+ voices with categories (age, gender, style)
- Features: Voice cloning, style control, multi-language support

**N8N Webhook Integration**
- Purpose: AI Director workflow automation
- URL: Configured via VITE_WEBHOOK_N8N_AI environment variable
- Function: Processes scripts to generate scene direction, timing, and audio cues

**Groq API (LPU Inference)**
- Purpose: Ultra-fast LLM inference for script analysis
- Technology: Groq's Language Processing Unit (LPU) chips provide 10x faster inference than traditional GPUs
- Model: llama-3.1-70b-versatile (primary), with OpenAI fallback
- Performance: ~10 seconds for 3 minutes of audio content analysis (vs 40+ seconds with standard GPUs)
- Integration: OpenAI-compatible API format in analyze-script Edge Function
- Fallback: Automatically uses OpenAI if GROQ_API_KEY is not configured

### Supabase Services

**Supabase Authentication**
- User registration and login
- Email/password authentication
- Password reset flows
- Session management with JWT tokens

**Supabase Database**
- PostgreSQL database with automatic migrations
- Row Level Security for data protection
- Real-time subscriptions for live updates

**Supabase Edge Functions**
- `ai-director-callback` - Processes AI director results
- `fetch-elevenlabs-voices` - Retrieves available voices from ElevenLabs
- `fetch-demo-voices` - Provides demo voices for unauthenticated users

**Supabase Storage**
- Audio file storage (MP3, WAV)
- Script file uploads (PDF, TXT)
- Generated audio assets

### Component Libraries

**Radix UI Primitives**
- Accessible, unstyled UI components
- Dialog, Dropdown, Tabs, Accordion, etc.
- Provides keyboard navigation and ARIA attributes

**shadcn/ui**
- Pre-styled components built on Radix UI
- Customizable with Tailwind CSS
- Consistent design system implementation

**Framer Motion**
- Animation library for smooth transitions
- Page transitions and component animations

**React Hook Form + Zod**
- Form state management
- Schema validation
- Type-safe form handling

### Development Tools

**TypeScript**
- Type safety across the application
- Reduced runtime errors
- Better IDE support and autocomplete

**Tailwind CSS**
- Utility-first CSS framework
- Custom theme with cinematic color palette
- Responsive design utilities

**ESLint + TypeScript ESLint**
- Code linting and formatting
- TypeScript-specific rules
- React best practices enforcement

### Build & Deployment

**Vite**
- Fast development server
- Optimized production builds
- Native ES modules support

**Vercel** (Deployment target based on vercel.json)
- Serverless deployment
- Automatic deployments from Git
- CDN and edge network

### Environment Variables Required

```
VITE_SUPABASE_URL - Supabase project URL
VITE_SUPABASE_ANON_KEY - Supabase anonymous key
VITE_WEBHOOK_N8N_AI - N8N webhook URL for AI Director
GROQ_API_KEY - Groq API key for ultra-fast LLM inference (get free at console.groq.com)
```