import { useState } from "react";
import { useProject } from "../projects";
import { useProjectChunks as useProjectChunksHook } from "../projectChunks";
import { useToast } from "@/components/ui/use-toast";

export const useProjectDetail = (id: string | undefined) => {
  const { toast } = useToast();
  const [generatingAudio, setGeneratingAudio] = useState(false);
  
  const { data: project, isLoading, error } = useProject(id);
  const { data: chunks, isLoading: chunksLoading } = useProjectChunksHook(id);

  const handleGenerateAudio = async () => {
    if (!project) {
      toast({
        title: "Cannot generate audio",
        description: "Project not found",
        variant: "destructive",
      });
      return;
    }

    if (!chunks || chunks.length === 0) {
      toast({
        title: "Cannot generate audio",
        description: "No chunks found for this project. Please create chunks first.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement audio generation using chunks data
    // For now, show a message that this feature needs to be implemented
    toast({
      title: "Feature In Development",
      description: "Audio generation from project chunks will be implemented soon",
      variant: "default",
    });
  };

  const getProjectStatus = () => {
    if (!project) return "Unknown";
    return project.status || "Draft";
  };

  const getDirectorJsonFromChunks = () => {
    if (!chunks || chunks.length === 0) return null;
    
    // Combine chunks data into a director-like structure
    const directorData = {
      chunks: chunks.map(chunk => ({
        chunk_id: chunk.chunk_key,
        scene_title: chunk.scene_title,
        director_notes: chunk.director_notes,
        lines: chunk.lines,
        audio_direction: chunk.audio_direction,
        start: chunk.start,
        duration: chunk.duration,
        version: chunk.version
      }))
    };
    
    return directorData;
  };

  const hasCompletedChunks = () => {
    return chunks && chunks.some(chunk => chunk.status === 'done');
  };

  const hasAudioUrl = () => {
    // TODO: This should check for audio_url in chunks or a separate audio table
    return false;
  };

  return {
    project,
    chunks,
    isLoading: isLoading || chunksLoading,
    error,
    generatingAudio,
    handleGenerateAudio,
    getProjectStatus,
    getDirectorJsonFromChunks,
    hasCompletedChunks,
    hasAudioUrl,
  };
};
