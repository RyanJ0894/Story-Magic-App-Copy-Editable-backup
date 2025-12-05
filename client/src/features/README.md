# �� Refactor NewProject Page - Feature-Based Architecture

## 📋 **Tổng quan**
Refactor page `NewProject` từ monolithic structure sang feature-based architecture với React Query pattern.

## 🎯 **Mục tiêu**
- Tách biệt concerns theo features
- Áp dụng React Query pattern chuẩn
- Tăng tính reusability và maintainability
- Clean separation of UI và business logic

## 📁 **Cấu trúc mới**
src/features/
├── project/
│ ├── components/
│ │ ├── ProjectForm.tsx
│ │ ├── ProjectStatus.tsx
│ │ └── ProjectOptions.tsx
│ ├── hooks/
│ │ ├── useProject.ts
│ │ └── useProjectCreation.ts
│ └── services/
│ └── projectApi.ts ✅ (đã tạo)
│
├── ai-director/
│ ├── components/
│ │ ├── DirectorAnalysis.tsx
│ │ └── DirectorPreview.tsx
│ ├── hooks/
│ │ └── useDirector.ts
│ └── services/
│ └── directorApi.ts
│
└── audio/
├── components/
│ ├── AudioGenerator.tsx
│ ├── AudioPlayer.tsx
│ └── ChunkGenerator.tsx (move từ timeline)
├── hooks/
│ ├── useAudio.ts
│ └── useChunk.ts
└── services/
├── audioApi.ts
└── chunkApi.ts


## �� **Các bước thực hiện**

### **Phase 1: Project Feature** ✅
- [x] Tạo `src/features/project/services/projectApi.ts`
- [ ] Tạo `src/features/project/hooks/useProject.ts`
- [ ] Tạo `src/features/project/components/ProjectForm.tsx`
- [ ] Tạo `src/features/project/components/ProjectStatus.tsx`
- [ ] Tạo `src/features/project/components/ProjectOptions.tsx`

### **Phase 2: AI Director Feature**
- [ ] Tạo `src/features/ai-director/services/directorApi.ts`
- [ ] Tạo `src/features/ai-director/hooks/useDirector.ts`
- [ ] Tạo `src/features/ai-director/components/DirectorAnalysis.tsx`
- [ ] Tạo `src/features/ai-director/components/DirectorPreview.tsx`

### **Phase 3: Audio Feature**
- [ ] Tạo `src/features/audio/services/audioApi.ts`
- [ ] Tạo `src/features/audio/services/chunkApi.ts`
- [ ] Tạo `src/features/audio/hooks/useAudio.ts`
- [ ] Tạo `src/features/audio/hooks/useChunk.ts`
- [ ] Tạo `src/features/audio/components/AudioGenerator.tsx`
- [ ] Tạo `src/features/audio/components/AudioPlayer.tsx`
- [ ] Move `ChunkGenerator.tsx` từ timeline sang audio

### **Phase 4: Refactor NewProject**
- [ ] Refactor `src/pages/NewProject.tsx` sử dụng hooks mới
- [ ] Remove old logic và state management
- [ ] Test integration

## 📝 **Chi tiết từng file**

### **1. Project Hooks**
```typescript
// src/features/project/hooks/useProject.ts
export const PROJECT_KEY_FACTORY = {
  all: ["projects"] as const,
  lists: () => [...PROJECT_KEY_FACTORY.all, "list"] as const,
  list: () => [...PROJECT_KEY_FACTORY.lists()] as const,
  details: () => [...PROJECT_KEY_FACTORY.all, "detail"] as const,
  detail: (id: string) => [...PROJECT_KEY_FACTORY.details(), id] as const,
};

export const useProjects = () => { /* ... */ };
export const useProject = (id: string) => { /* ... */ };
export const useCreateProject = () => { /* ... */ };
export const useUpdateProject = () => { /* ... */ };
export const useDeleteProject = () => { /* ... */ };
```

### **2. AI Director API**
```typescript
// src/features/ai-director/services/directorApi.ts
export type DirectorAnalysis = {
  id: string;
  project_id: string;
  status: 'pending' | 'completed' | 'failed';
  result?: any;
  error?: string;
  created_at: string;
};

export const directorApi = {
  trigger: async (projectId: string, script: string) => { /* ... */ },
  getByProjectId: async (projectId: string) => { /* ... */ },
  subscribe: (projectId: string, callback: (analysis: any) => void) => { /* ... */ }
};
```

### **3. Audio API**
```typescript
// src/features/audio/services/audioApi.ts
export type AudioGeneration = {
  id: string;
  project_id: string;
  status: 'pending' | 'completed' | 'failed';
  audio_url?: string;
  error?: string;
  created_at: string;
};

export const audioApi = {
  generateMerged: async (projectId: string, directorJson: any) => { /* ... */ },
  getByProjectId: async (projectId: string) => { /* ... */ },
  subscribe: (projectId: string, callback: (audio: AudioGeneration) => void) => { /* ... */ }
};
```

### **4. NewProject Refactor**
```typescript
// src/pages/NewProject.tsx - Clean orchestrator
export default function NewProject() {
  const createProjectMutation = useCreateProject();
  const triggerDirectorMutation = useTriggerDirector();
  const generateAudioMutation = useGenerateAudio();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProjectHeader />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <ProjectForm onSubmit={createProjectMutation.mutate} />
        <ProjectStatus project={project} />
        <DirectorAnalysis projectId={projectId} />
        <AudioGeneration projectId={projectId} />
      </div>
    </div>
  );
}
```

## �� **Benefits**

### **✅ Separation of Concerns**
- Mỗi feature có responsibility riêng
- Dễ test và maintain
- Code reuse tốt hơn

### **✅ Scalability**
- Dễ thêm features mới
- Dễ modify existing features
- Team có thể work parallel

### **✅ Clean Architecture**
- UI components chỉ handle presentation
- Business logic trong hooks
- API calls trong services

## 🚨 **Lưu ý quan trọng**

1. **Database Schema**: Đã fix type `Project` để khớp với database (có `user_id`, không có `updated_at`)

2. **Import Paths**: Sử dụng `@/features/` thay vì relative imports

3. **React Query**: Áp dụng pattern chuẩn với key factories và mutations

4. **Real-time Updates**: Sử dụng Supabase subscriptions trong services

5. **Error Handling**: Centralized error handling trong hooks

## 📋 **Checklist hoàn thành**

- [ ] Tất cả files được tạo
- [ ] Types được định nghĩa chính xác
- [ ] Hooks sử dụng React Query pattern
- [ ] Components được tách biệt rõ ràng
- [ ] NewProject được refactor hoàn toàn
- [ ] Test integration hoạt động
- [ ] Remove old code và cleanup

## 🔄 **Next Steps**

1. Implement từng feature theo thứ tự
2. Test từng feature độc lập
3. Integrate vào NewProject
4. Cleanup và optimize
5. Documentation và testing

---

**Status**: 🚧 In Progress  
**Priority**: High  
**Estimated Time**: 2-3 hours  
**Dependencies**: React Query, Supabase, Existing API integrations