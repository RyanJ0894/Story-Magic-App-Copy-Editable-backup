import React from "react";
import { motion, useMotionValue } from "framer-motion";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import type { TimelineCardProps } from "@/feature/timeline/types";

export default function TimelineCard({ 
  data, 
  pixelsPerSecond, 
  trackHeight, 
  currentTime, 
  isPlaying = false, 
  onChange, 
  onMetaChange 
}: TimelineCardProps) {
  const [isResizingLeft, setIsResizingLeft] = React.useState(false);
  const [isResizingRight, setIsResizingRight] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  const baseLeft = data.start * pixelsPerSecond;
  const baseWidth = Math.max(8, data.duration * pixelsPerSecond);

  // Drag control
  const x = useMotionValue(0);
  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => {
    setIsDragging(false);
    const deltaPx = x.get();
    const deltaSeconds = deltaPx / pixelsPerSecond;
    const nextStart = Math.max(0, data.start + deltaSeconds);
    x.set(0);
    onChange?.({ start: nextStart, duration: data.duration });
  };

  // Resize via edge detection (no visible handles)
  const resizeState = React.useRef({ startX: 0, initialStart: data.start, initialDuration: data.duration });
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const onMouseMove = React.useCallback((e: MouseEvent) => {
    if (!isResizingLeft && !isResizingRight) return;
    const dx = e.clientX - resizeState.current.startX;
    const deltaSec = dx / pixelsPerSecond;
    if (isResizingLeft) {
      const nextStart = Math.max(0, resizeState.current.initialStart + deltaSec);
      const nextDuration = Math.max(0.1, resizeState.current.initialDuration - deltaSec);
      onChange?.({ start: nextStart, duration: nextDuration });
    } else if (isResizingRight) {
      const nextDuration = Math.max(0.1, resizeState.current.initialDuration + deltaSec);
      onChange?.({ start: resizeState.current.initialStart, duration: nextDuration });
    }
  }, [isResizingLeft, isResizingRight, onChange, pixelsPerSecond]);

  const onMouseUp = React.useCallback(() => {
    setIsResizingLeft(false);
    setIsResizingRight(false);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }, [onMouseMove]);

  const onMouseDown = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const edgeThreshold = 8;
    resizeState.current = { startX: e.clientX, initialStart: data.start, initialDuration: data.duration };
    if (localX <= edgeThreshold) {
      setIsResizingLeft(true);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    } else if (localX >= rect.width - edgeThreshold) {
      setIsResizingRight(true);
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    } else {
      // center => drag (handled by framer-motion)
    }
  };

  // Audio playback sync per card (optional)
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    el.muted = !!data.muted;
    if (typeof data.volume === "number") el.volume = Math.max(0, Math.min(1, data.volume));

    if (!isPlaying) {
      if (!el.paused) el.pause();
      return;
    }

    if (typeof currentTime !== "number" || !data.src) return;
    const start = data.start;
    const end = data.start + data.duration;

    if (currentTime >= start && currentTime < end) {
      const t = currentTime - start;
      if (Math.abs((el.currentTime || 0) - t) > 0.05) {
        try { el.currentTime = Math.max(0, t); } catch {}
      }
      if (el.paused) {
        void el.play().catch(() => {});
      }
    } else {
      if (!el.paused) el.pause();
    }
  }, [currentTime, data.start, data.duration, data.src, data.volume, data.muted, isPlaying]);

  const handleContext = (action: "title" | "src" | "color" | "type") => {
    if (!onMetaChange) return;
    if (action === "title") {
      const next = prompt("New title", data.title ?? "");
      if (typeof next === "string") onMetaChange({ title: next });
    } else if (action === "src") {
      const next = prompt("Audio URL", data.src ?? "");
      if (typeof next === "string") onMetaChange({ src: next });
    } else if (action === "color") {
      const next = prompt("Card color (hex or css)", data.color ?? "#111827");
      if (typeof next === "string") onMetaChange({ color: next });
    } else if (action === "type") {
      const next = prompt("Type (music|ambience|sfx|voice|other)", data.type ?? "other") as any;
      onMetaChange({ type: next });
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <motion.div
          ref={containerRef}
          className="absolute rounded-md text-xs shadow-sm border"
          drag={isResizingLeft || isResizingRight ? false : "x"}
          dragMomentum={false}
          dragConstraints={{ left: -baseLeft, right: Infinity }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onMouseDown={onMouseDown}
          style={{
            zIndex: 10,
            x,
            left: baseLeft,
            width: baseWidth,
            height: trackHeight - 8,
            top: 4,
            background: data.color || "#111827",
            color: "#F9FAFB",
            borderColor: "#1F2937",
          }}
          title={`${data.title} (${data.start.toFixed(2)}s → ${(data.start + data.duration).toFixed(2)}s)`}
        >
          <div className="flex items-center h-full px-2 overflow-hidden">
            <div className="truncate">
              {data.title}
              {typeof data.volume === "number" && <span className="opacity-70"> · vol {Math.round((data.volume || 0) * 100)}%</span>}
              {data.type && <span className="opacity-70"> · {data.type}</span>}
            </div>
          </div>
          {data.src ? <audio ref={audioRef} src={data.src} preload="auto" /> : null}
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => handleContext("title")}>Rename title</ContextMenuItem>
        <ContextMenuItem onClick={() => handleContext("src")}>Change audio URL</ContextMenuItem>
        <ContextMenuItem onClick={() => handleContext("color")}>Change color</ContextMenuItem>
        <ContextMenuItem onClick={() => handleContext("type")}>Change type</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
