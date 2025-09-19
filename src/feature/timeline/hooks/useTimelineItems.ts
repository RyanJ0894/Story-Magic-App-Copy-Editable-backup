import { useState, useCallback, useMemo } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import type { TimelineItem, TimelineCardData } from "@/feature/timeline/types";
import { getColorForType } from "@/feature/timeline/lib/audio-colors";

type RowState = TimelineCardData & { muted?: boolean; hidden?: boolean };

type FormShape = {
  items: Array<RowState>;
};

/**
 * Hook for managing timeline items state and form
 */
export function useTimelineItems(initialItems: TimelineItem[]) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Convert timeline items to form state
  const defaultRows: RowState[] = useMemo(() => {
    return initialItems.map((it) => ({
      id: it.id,
      title: it.title,
      type: it.type,
      src: it.src,
      start: it.start,
      duration: Math.max(0, (it.end ?? it.start) - it.start),
      volume: it.volume ?? 1,
      color: it.color || getColorForType(it.type),
      muted: it.muted || false,
      hidden: it.hidden || false,
    }));
  }, [initialItems]);

  const form = useForm<FormShape>({
    defaultValues: { items: defaultRows },
    mode: "onChange",
  });

  const { fields, update, remove } = useFieldArray({ 
    control: form.control, 
    name: "items" 
  });

  const rows = form.watch("items");

  const updateRow = useCallback((index: number, next: Partial<RowState>) => {
    const current = form.getValues(`items.${index}` as const) as RowState;
    const merged: RowState = { ...current, ...next } as RowState;
    if (next.type && !next.color) {
      merged.color = getColorForType(next.type);
    }
    update(index, merged);
  }, [form, update]);

  const deleteRow = useCallback((index: number) => {
    if (confirm("Delete this track?")) {
      remove(index);
    }
  }, [remove]);

  const exportItems = useCallback(() => {
    return form.getValues().items.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      src: r.src,
      start: r.start,
      end: r.start + r.duration,
      volume: r.volume,
      muted: r.muted,
      hidden: r.hidden,
      color: r.color,
    }));
  }, [form]);

  const handlePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const handleSeek = useCallback((time: number) => {
    // Seek functionality will be handled by parent component
  }, []);

  return {
    // State
    isPlaying,
    setIsPlaying,
    rows,
    fields,
    
    // Actions
    updateRow,
    deleteRow,
    exportItems,
    handlePlayPause,
    handleSeek,
    
    // Form
    form,
  };
}
