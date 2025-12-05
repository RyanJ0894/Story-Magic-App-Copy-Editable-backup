# Scripts Feature

Feature quản lý script player với cấu trúc modular và tách biệt rõ ràng.

## 📁 Cấu trúc

```
src/features/scripts/
├── components/
│   ├── ScriptPlayer.tsx          # Component chính hiển thị script
│   ├── ScriptEditModal.tsx       # Modal chỉnh sửa bulk
│   └── ScriptPlayerDemo.tsx      # Demo component
├── hooks/
│   ├── useScriptPlayer.ts        # Hook chính cho ScriptPlayer
│   ├── useScriptEditModal.ts     # Hook cho edit modal
│   └── useTTSGeneration.ts       # Hook cho TTS generation
├── lib/
│   ├── index.ts                  # Utility functions
│   └── converters.ts             # Converters giữa các format
├-- types.ts                  # TypeScript types
├── constants/
│   └── index.ts                  # Constants và options
└── README.md                     # Documentation
```

## 🔧 Sử dụng

### Import trực tiếp (không dùng index.ts)

```typescript
// Component
import ScriptPlayer from "@/features/scripts/components/ScriptPlayer";
import ScriptEditModal from "@/features/scripts/components/ScriptEditModal";

// Hooks
import { useScriptPlayer } from "@/features/scripts/hooks/useScriptPlayer";
import { useScriptEditModal } from "@/features/scripts/hooks/useScriptEditModal";

// Types

// Utils
import { convertChunksToAiDirector } from "@/features/scripts/lib/converters";
```

### ScriptPlayer Component

```typescript
<ScriptPlayer 
  chunks={aiDirectorChunks} 
  currentTime={currentTime} 
  onSeek={handleSeek} 
  onLineChange={handleLineChange}
  onVoiceChange={handleVoiceChange}
  onVolumeChange={handleVolumeChange}
  onSfxChange={handleSfxChange}
/>
```

### useScriptPlayer Hook

```typescript
const {
  activeItems,
  isSelectionMode,
  selectedItems,
  timelineEvents,
  groupedEvents,
  toggleSelectionMode,
  toggleItemSelection,
  selectAllItems,
  clearSelection,
  handleVoiceChange,
  handleSfxChange,
  handleBulkSave,
  setIsEditModalOpen,
  isItemActive,
  calculateProgress
} = useScriptPlayer(chunks, currentTime, onLineChange);
```

## 📊 Data Flow

1. **Input**: `AiDirectorJson[]` chunks từ ai-director
2. **Processing**: Convert và tạo timeline events
3. **Display**: Hiển thị script lines và audio events
4. **Interaction**: Selection mode, bulk edit, TTS generation
5. **Output**: Callbacks cho voice, volume, sfx changes

## 🎯 Features

- **Script Display**: Hiển thị script lines với highlighting
- **Audio Events**: Music, ambience, SFX events
- **Selection Mode**: Chọn multiple items để edit
- **Bulk Edit**: Modal để edit nhiều items cùng lúc
- **TTS Generation**: Generate TTS cho script lines
- **Auto-scroll**: Tự động scroll đến active line
- **Scene Separation**: Tách biệt theo scene


## 🎨 Styling

- Sử dụng Tailwind CSS
- Theme colors từ Shadcn UI
- Responsive design
- Minimalist UI

## 🚀 Performance

- Memoized calculations
- Efficient re-renders
- Lazy loading
- Optimized scroll behavior
