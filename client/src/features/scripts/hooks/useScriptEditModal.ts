import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { FormData } from '../types';
import type { ChunkData } from '@/features/timeline/types';
import { getSelectedEvents, createDefaultFormValues } from '../lib';

export function useScriptEditModal(
  isOpen: boolean,
  selectedItems: Set<string>,
  chunks: ChunkData[],
  onSave: (changes: any) => void
) {
  const { control, handleSubmit, reset, watch } = useForm<FormData>({
    defaultValues: {}
  });

  // Get selected events
  const selectedEvents = useMemo(() => {
    return getSelectedEvents(selectedItems, chunks);
  }, [selectedItems, chunks]);

  const scriptEvents = selectedEvents.filter(e => e.type === 'script');
  const audioEvents = selectedEvents.filter(e => e.type === 'audio');

  // Set default values when modal opens
  useEffect(() => {
    if (isOpen && selectedEvents.length > 0) {
      const defaultValues = createDefaultFormValues(selectedEvents);
      reset(defaultValues);
    }
  }, [isOpen, selectedEvents, reset]);

  const onSubmit = (data: FormData) => {
    onSave(data);
  };

  return {
    control,
    handleSubmit: handleSubmit(onSubmit),
    selectedEvents,
    scriptEvents,
    audioEvents
  };
}
