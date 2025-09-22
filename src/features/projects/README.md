# Projects Feature

Project management feature with modular structure following the established convention.

## 📁 Structure

```
src/features/projects/
├── hooks/
│   ├── useDashboard.ts           # Dashboard page logic
│   ├── useNewProject.ts          # New project page logic
│   └── useProjectDetail.ts       # Project detail page logic
├── services/
│   └── projectApi.ts             # Supabase project API calls
├── projects.ts                   # Main project hooks with React Query
├── project.type.ts               # TypeScript interfaces
└── README.md                     # Documentation
```

## 🔧 Usage

### Import Hooks

```typescript
import { useProjects, useProject, useCreateProject, useDeleteProject } from "@/features/projects/projects";
import { useDashboard } from "@/features/projects/hooks/useDashboard";
import { useNewProject } from "@/features/projects/hooks/useNewProject";
import { useProjectDetail } from "@/features/projects/hooks/useProjectDetail";
```

### Import Types

```typescript
import { Project, ProjectFormData, ProjectRow } from "@/features/projects/project.type";
```

## 🎯 Features

- **Project Management**: Create, read, update, delete projects
- **Dashboard Integration**: Load and display user projects
- **Project Creation**: Form-based project creation with validation
- **Project Details**: View project data, director JSON, and audio
- **Audio Generation**: Generate audio from AI Director analysis
- **Error Handling**: User-friendly error messages
- **Loading States**: Proper loading indicators
- **Type Safety**: Full TypeScript support

## 🚀 Hooks

### React Query Hooks (projects.ts)
- `useProjects()` - Get all user projects with automatic caching
- `useProject(id)` - Get single project by ID
- `useCreateProject()` - Create project mutation with loading/error states
- `useDeleteProject()` - Delete project mutation
- `useUpdateProject()` - Update project mutation

### Page-specific Hooks
- `useDashboard()` - Dashboard page state management and project operations
- `useNewProject()` - New project creation logic
- `useProjectDetail()` - Project detail view with audio generation

## 📊 Data Flow

1. **Input**: User interactions through forms and UI components
2. **Validation**: Form validation using react-hook-form + zod
3. **API Calls**: React Query mutations using projectApi service layer
4. **State Updates**: Automatic cache invalidation and UI updates
5. **Navigation**: Seamless navigation between project views

## 🎨 Integration

### Dashboard Page
- Uses `useDashboard()` for project list management
- Handles project deletion with confirmation
- Displays project status and metadata

### New Project Page
- Uses `useNewProject()` for project creation
- Integrates with chunk production from project-old feature
- Form validation and submission handling

### Project Detail Page
- Uses `useProjectDetail()` for project data and audio generation
- Displays director JSON and audio player
- Handles audio generation workflow

## 🔐 Security

- All API calls go through Supabase RLS policies
- User authentication required for all operations
- Project ownership validation
- Secure audio generation workflow

## 🎨 Styling

- Uses Tailwind CSS
- Shadcn UI components
- Cinema theme colors
- Responsive design
- Loading states and error handling
