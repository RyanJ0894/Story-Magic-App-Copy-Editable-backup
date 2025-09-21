import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import JsonView from "@uiw/react-json-view";
import type { ChunkProgressData } from "../project-chunk.type";

interface ProjectDataViewerProps {
  chunks: ChunkProgressData[];
  projectId?: string;
  projectTitle?: string;
  projectCreatedAt?: string;
}

export function ProjectDataViewer({ 
  chunks, 
  projectId, 
  projectTitle, 
  projectCreatedAt 
}: ProjectDataViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  const exportData = {
    project: {
      id: projectId,
      title: projectTitle,
      created_at: projectCreatedAt,
    },
    chunks: chunks.map(chunk => ({
      chunk_id: chunk.chunk_id,
      scene_title: chunk.scene_title,
      lines: chunk.lines.map(line => ({
        line_id: line.line_id,
        text: line.text,
        type: line.type,
        start: line.start,
        duration: line.duration,
        volume: line.volume,
        src: line.src,
        tts_settings: line.tts_settings
      })),
      audio_direction: {
        music: chunk.audio_direction.music.map(track => ({
          track_id: track.track_id,
          label: track.label,
          src: track.src,
          start: track.start,
          duration: track.duration,
          volume: track.volume,
          fade_in: track.fade_in,
          fade_out: track.fade_out
        })),
        ambience: chunk.audio_direction.ambience.map(track => ({
          track_id: track.track_id,
          label: track.label,
          src: track.src,
          start: track.start,
          duration: track.duration,
          volume: track.volume,
          fade_in: track.fade_in,
          fade_out: track.fade_out
        })),
        sfx: chunk.audio_direction.sfx.map(track => ({
          track_id: track.track_id,
          label: track.label,
          src: track.src,
          start: track.start,
          duration: track.duration,
          volume: track.volume,
          fade_in: track.fade_in,
          fade_out: track.fade_out
        }))
      }
    })),
    metadata: {
      total_chunks: chunks.length,
      generated_at: new Date().toISOString(),
      version: "1.0"
    }
  };

  if (chunks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border p-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between gap-2 w-full text-left"
      >
        {isExpanded ? (
          <>
            <ChevronDown className="h-5 w-5" />
          </>
        ) : (
          <ChevronRight className="h-5 w-5" />
        )}
        <h2 className="text-xl font-semibold">Project Data ({chunks.length} chunks)</h2>
      </button>

      {isExpanded && (
        <div className="mt-6 space-y-4">
          {/* JSON Export */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">JSON Export Data</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(JSON.stringify(exportData, null, 2), 'json')}
              >
                {copiedField === 'json' ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                Copy JSON
              </Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden vscode-json-theme">
              <JsonView
                value={exportData}
                style={{
                  fontSize: '12px',
                  maxHeight: '500px',
                  overflow: 'auto'
                }}
                displayDataTypes={false}
                displayObjectSize={false}
                enableClipboard={false}
                collapsed={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
