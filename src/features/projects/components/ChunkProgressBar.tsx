import React from "react";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, CheckCircle, AlertCircle, Loader2, ChevronDown, ChevronRight } from "lucide-react";

type ChunkRef = {
  chunk_id: string;
  scene_title: string;
  order: number;
  start: number;
  duration: number;
};

type ChunkLoadingState = {
  chunkId: string;
  isLoading: boolean;
  data?: any;
  error?: string;
};

export type ChunkProgressBarProps = {
  chunkRefs: ChunkRef[];
  chunkStates: ChunkLoadingState[];
  onRetryChunk?: (chunkId: string) => void;
  headerText?: string;
};

export default function ChunkProgressBar({ 
  chunkRefs, 
  chunkStates, 
  onRetryChunk,
  headerText = "Processing Chunks"
}: ChunkProgressBarProps) {
  const [expandedChunks, setExpandedChunks] = React.useState<Set<string>>(new Set());
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // Calculate progress
  const totalChunks = chunkRefs.length;
  const loadedChunks = chunkStates.filter(state => state.data && !state.isLoading).length;
  const errorChunks = chunkStates.filter(state => state.error).length;
  const loadingChunks = chunkStates.filter(state => state.isLoading).length;
  
  const progressPercentage = totalChunks > 0 ? (loadedChunks / totalChunks) * 100 : 0;
  
  // Get current loading chunk
  const currentLoadingChunk = chunkStates.find(state => state.isLoading);
  const currentChunkRef = currentLoadingChunk ? 
    chunkRefs.find(ref => ref.chunk_id === currentLoadingChunk.chunkId) : null;

  // Auto-collapse when all chunks are loaded successfully
  React.useEffect(() => {
    const allLoaded = chunkStates.every(state => state.data && !state.isLoading && !state.error);
    if (allLoaded && chunkStates.length > 0) {
      setIsCollapsed(true);
    }
  }, [chunkStates]);

  // Sort chunks: Error first, then Loading, then Done
  const sortedChunks = React.useMemo(() => {
    return chunkRefs
      .map(ref => ({
        ref,
        state: chunkStates.find(s => s.chunkId === ref.chunk_id)
      }))
      .filter(item => item.state)
      .sort((a, b) => {
        const aState = a.state!;
        const bState = b.state!;
        
        // Error chunks first
        if (aState.error && !bState.error) return -1;
        if (!aState.error && bState.error) return 1;
        
        // Loading chunks second
        if (aState.isLoading && !bState.isLoading) return -1;
        if (!aState.isLoading && bState.isLoading) return 1;
        
        // Done chunks last (by original order)
        if (aState.data && !bState.data) return 1;
        if (!aState.data && bState.data) return -1;
        
        // Same status, sort by original order
        return a.ref.order - b.ref.order;
      });
  }, [chunkRefs, chunkStates]);

  const toggleExpanded = (chunkId: string) => {
    setExpandedChunks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chunkId)) {
        newSet.delete(chunkId);
      } else {
        newSet.add(chunkId);
      }
      return newSet;
    });
  };

  // Show waiting state if no chunks yet
  if (totalChunks === 0) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{headerText}</span>
            <span className="text-muted-foreground">Waiting for chunks...</span>
          </div>
          <Progress value={0} className="h-2" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Processing chunks...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 bg-muted/50 rounded-lg p-4">
      {/* Progress Bar Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">
              {loadedChunks}/{totalChunks} loaded
              {errorChunks > 0 && ` • ${errorChunks} errors`}
            </span>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 hover:bg-muted rounded"
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {loadingChunks > 0 && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>
                Processing: {currentChunkRef?.scene_title || "Unknown chunk"}...
              </span>
            </>
          )}
        </div>
      </div>

      {/* Chunk Status List with Accordion */}
      {!isCollapsed && (
        <div className="space-y-2 max-h-60 overflow-y-auto thin-scrollbar">
        {sortedChunks.map(({ ref, state }) => {
          if (!state) return null;
          
          const isExpanded = expandedChunks.has(ref.chunk_id);
          const hasDetails = state.data || state.error;

          return (
            <Collapsible 
              key={ref.chunk_id}
              open={isExpanded}
              onOpenChange={() => toggleExpanded(ref.chunk_id)}
            >
              <div className={`rounded-md border text-sm transition-colors ${
                state.error ? 'border-destructive/20 bg-destructive/5' :
                state.data ? 'border-green-500/20 bg-green-500/5' :
                state.isLoading ? 'border-primary/20 bg-primary/5' :
                'border-border bg-muted/30'
              }`}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 cursor-pointer hover:bg-opacity-80">
                    <div className="flex items-center gap-3">
                      {state.isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {state.data && !state.isLoading && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {state.error && <AlertCircle className="w-4 h-4 text-destructive" />}
                      {!state.isLoading && !state.data && !state.error && <Clock className="w-4 h-4 text-muted-foreground" />}
                      
                      <div>
                        <div className="font-medium">{ref.scene_title}</div>
                        <div className="text-xs text-muted-foreground">
                          Order: {ref.order} • Duration: {ref.duration}s
                          {state.data && ` • ${state.data.lines?.length || 0} lines`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {state.error && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRetryChunk?.(ref.chunk_id);
                          }}
                          className="px-2 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20"
                        >
                          Retry
                        </button>
                      )}
                      {state.isLoading && (
                        <span className="text-xs text-primary">Processing...</span>
                      )}
                      {state.data && !state.isLoading && (
                        <span className="text-xs text-green-600">Loaded</span>
                      )}
                      {hasDetails && (
                        <div className="ml-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>

                {hasDetails && (
                  <CollapsibleContent>
                    <div className="px-3 pb-3 border-t border-current border-opacity-20">
                      {state.error ? (
                        <div className="pt-3">
                          <div className="text-sm text-destructive font-medium mb-1">Error Details:</div>
                          <div className="text-xs text-destructive/80 bg-destructive/10 p-2 rounded">
                            {state.error}
                          </div>
                        </div>
                      ) : state.data ? (
                        <div className="pt-3">
                          <div className="text-sm text-green-700 font-medium mb-2">Chunk Data:</div>
                          <div className="text-xs text-green-600/80 bg-green-500/10 p-2 rounded max-h-32 overflow-y-auto">
                            <div className="space-y-1">
                              <div><strong>Lines:</strong> {state.data.lines?.length || 0}</div>
                              <div><strong>Music:</strong> {state.data.audio_direction?.music?.length || 0}</div>
                              <div><strong>Ambience:</strong> {state.data.audio_direction?.ambience?.length || 0}</div>
                              <div><strong>SFX:</strong> {state.data.audio_direction?.sfx?.length || 0}</div>
                              {state.data.director_notes && (
                                <div><strong>Notes:</strong> {state.data.director_notes}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </CollapsibleContent>
                )}
              </div>
            </Collapsible>
          );
        })}
        </div>
      )}
    </div>
  );
}
