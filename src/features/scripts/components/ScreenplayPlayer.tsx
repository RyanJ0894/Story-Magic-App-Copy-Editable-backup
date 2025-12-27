import { useRef, useEffect, useMemo, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Users, ChevronDown, ChevronUp, RefreshCw, MessageSquare, X, StickyNote, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import type { ChunkProgressData } from '@/features/projects/project-chunk.type';
import { VoiceSelector } from '@/components/feature/VoiceSelector';
import { useElevenLabsVoices, type ElevenLabsVoice } from '@/hooks/useElevenLabsVoices';
import type { UserVoiceCategory } from '@/config/userCategories';

export type ReviewStatus = 'like' | 'pass' | 'undecided' | null;

export interface ScriptNote {
  id: string;
  lineId: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}

interface ScreenplayPlayerProps {
  chunks: ChunkProgressData[];
  currentTime: number;
  isPlaying: boolean;
  duration: number;
  onSeek: (time: number) => void;
  onPlayPause: (playing: boolean) => void;
  onVoiceChange?: (character: string, voiceId: string, voice: ElevenLabsVoice) => void;
  onRegenerateAudio?: (voiceAssignments: Record<string, string>) => Promise<void>;
  isRegenerating?: boolean;
  notes?: ScriptNote[];
  onNotesChange?: (notes: ScriptNote[]) => void;
  onSaveNote?: (lineId: string, text: string) => Promise<void>;
  onDeleteNote?: (noteId: string) => Promise<void>;
  reviewStatus?: ReviewStatus;
  onReviewStatusChange?: (status: ReviewStatus) => void;
  isUpdatingRating?: boolean;
}

interface DisplayLine {
  id: string;
  type: 'scene_heading' | 'character' | 'dialogue' | 'action';
  text: string;
  character?: string;
  voice_key?: string;
  start: number;
  duration: number;
  end: number;
  sceneId: string;
}

interface CharacterInfo {
  name: string;
  voiceKey: string;
  category: UserVoiceCategory | null;
  lineCount: number;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function extractDisplayLines(chunks: ChunkProgressData[]): DisplayLine[] {
  const lines: DisplayLine[] = [];
  let lineIndex = 0;
  let lastCharacter = '';
  let lastSceneId = '';
  
  for (const chunk of chunks) {
    const sceneId = chunk.chunk_id || chunk.scene_title;
    
    if (sceneId !== lastSceneId) {
      const firstLine = chunk.lines?.[0];
      const sceneStart = firstLine?.start ?? 0;
      
      lines.push({
        id: `scene_heading_${lineIndex++}`,
        type: 'scene_heading',
        text: chunk.scene_title || `Scene ${sceneId.replace('scene_', '')}`,
        start: sceneStart,
        duration: 0,
        end: sceneStart,
        sceneId: sceneId,
      });
      lastSceneId = sceneId;
      lastCharacter = '';
    }
    
    if (!chunk.lines) continue;
    
    for (const line of chunk.lines) {
      const lineStart = line.start ?? 0;
      const lineDuration = line.duration ?? 2;
      const lineEnd = lineStart + lineDuration;
      const lineCharacter = line.character || 'NARRATOR';
      const lineType = line.type || (lineCharacter.toUpperCase() === 'NARRATOR' ? 'action' : 'dialogue');
      
      if (lineCharacter !== lastCharacter && lineCharacter.toUpperCase() !== 'NARRATOR') {
        lines.push({
          id: `character_${lineIndex++}`,
          type: 'character',
          text: lineCharacter,
          character: lineCharacter,
          voice_key: line.voice_key,
          start: lineStart,
          duration: 0,
          end: lineStart,
          sceneId: sceneId,
        });
        lastCharacter = lineCharacter;
      }
      
      lines.push({
        id: `line_${lineIndex++}`,
        type: lineType as 'action' | 'dialogue',
        text: line.text || '',
        character: lineCharacter,
        voice_key: line.voice_key,
        start: lineStart,
        duration: lineDuration,
        end: lineEnd,
        sceneId: sceneId,
      });
    }
  }
  
  return lines;
}

function extractUniqueCharacters(chunks: ChunkProgressData[]): CharacterInfo[] {
  const characterMap = new Map<string, CharacterInfo>();
  
  for (const chunk of chunks) {
    if (!chunk.lines) continue;
    
    for (const line of chunk.lines) {
      const charName = line.character || 'NARRATOR';
      if (charName.toUpperCase() === 'NARRATOR') continue;
      
      if (!characterMap.has(charName)) {
        characterMap.set(charName, {
          name: charName,
          voiceKey: line.voice_key || '',
          category: (line as any).voice_category || null,
          lineCount: 1,
        });
      } else {
        const existing = characterMap.get(charName)!;
        existing.lineCount++;
        if (!existing.voiceKey && line.voice_key) {
          existing.voiceKey = line.voice_key;
        }
      }
    }
  }
  
  return Array.from(characterMap.values()).sort((a, b) => b.lineCount - a.lineCount);
}

export default function ScreenplayPlayer({
  chunks,
  currentTime,
  isPlaying,
  duration,
  onSeek,
  onPlayPause,
  onVoiceChange,
  onRegenerateAudio,
  isRegenerating = false,
  notes: externalNotes,
  onNotesChange,
  onSaveNote,
  onDeleteNote,
  reviewStatus,
  onReviewStatusChange,
  isUpdatingRating = false,
}: ScreenplayPlayerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);
  const [showCastPanel, setShowCastPanel] = useState(false);
  const [characterVoices, setCharacterVoices] = useState<Record<string, string>>({});
  const [pendingChanges, setPendingChanges] = useState<Set<string>>(new Set());
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [openPopoverLineId, setOpenPopoverLineId] = useState<string | null>(null);
  
  // Internal notes state - used when parent doesn't control notes
  const [internalNotes, setInternalNotes] = useState<ScriptNote[]>([]);
  
  // Use external notes if provided, otherwise use internal state
  const notes = externalNotes ?? internalNotes;
  
  const notesByLineId = useMemo(() => {
    const map = new Map<string, ScriptNote>();
    notes.forEach(note => map.set(note.lineId, note));
    return map;
  }, [notes]);

  const handleAddNote = async (lineId: string) => {
    // If we have external save handler, use it (creates note in DB)
    if (onSaveNote) {
      await onSaveNote(lineId, '');
    } else {
      // Fallback to internal state
      const newNote: ScriptNote = {
        id: `note_${Date.now()}`,
        lineId,
        text: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updatedNotes = [...notes, newNote];
      
      if (onNotesChange) {
        onNotesChange(updatedNotes);
      } else {
        setInternalNotes(updatedNotes);
      }
    }
    setEditingNoteText('');
    // Auto-open the popover for this line
    setOpenPopoverLineId(lineId);
  };

  const handleUpdateNote = async (lineId: string, text: string) => {
    // If we have external save handler, use it
    if (onSaveNote) {
      await onSaveNote(lineId, text);
    } else {
      // Fallback to internal state
      const existingNote = notes.find(n => n.lineId === lineId);
      if (existingNote) {
        const updatedNotes = notes.map(note => 
          note.lineId === lineId 
            ? { ...note, text, updatedAt: new Date().toISOString() }
            : note
        );
        
        if (onNotesChange) {
          onNotesChange(updatedNotes);
        } else {
          setInternalNotes(updatedNotes);
        }
      }
    }
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const handleDeleteNoteById = async (noteId: string) => {
    // If we have external delete handler, use it
    if (onDeleteNote) {
      await onDeleteNote(noteId);
    } else {
      // Fallback to internal state
      const updatedNotes = notes.filter(note => note.id !== noteId);
      
      if (onNotesChange) {
        onNotesChange(updatedNotes);
      } else {
        setInternalNotes(updatedNotes);
      }
    }
    setEditingNoteId(null);
    setEditingNoteText('');
  };
  
  const { voices, loading: voicesLoading } = useElevenLabsVoices();
  
  const displayLines = useMemo(() => extractDisplayLines(chunks), [chunks]);
  const characters = useMemo(() => extractUniqueCharacters(chunks), [chunks]);
  
  useEffect(() => {
    setCharacterVoices(prev => {
      const updated = { ...prev };
      characters.forEach(char => {
        if (char.voiceKey && !updated[char.name]) {
          updated[char.name] = char.voiceKey;
        }
      });
      return updated;
    });
  }, [characters]);
  
  const currentLineId = useMemo(() => {
    for (let i = displayLines.length - 1; i >= 0; i--) {
      const line = displayLines[i];
      if (line.type === 'dialogue' || line.type === 'action') {
        if (currentTime >= line.start && currentTime < line.end) {
          return line.id;
        }
      }
    }
    
    for (let i = 0; i < displayLines.length; i++) {
      const line = displayLines[i];
      if (line.type === 'dialogue' || line.type === 'action') {
        if (currentTime < line.end) {
          return line.id;
        }
      }
    }
    
    return null;
  }, [displayLines, currentTime]);
  
  useEffect(() => {
    if (activeLineRef.current && scrollContainerRef.current && isPlaying) {
      const container = scrollContainerRef.current;
      const activeLine = activeLineRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const lineRect = activeLine.getBoundingClientRect();
      
      const lineTop = lineRect.top - containerRect.top + container.scrollTop;
      const targetScroll = lineTop - containerRect.height / 3;
      
      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });
    }
  }, [currentLineId, isPlaying]);
  
  const handleSliderChange = (value: number[]) => {
    onSeek(value[0]);
  };
  
  const skipBackward = () => {
    onSeek(Math.max(0, currentTime - 10));
  };
  
  const skipForward = () => {
    onSeek(Math.min(duration, currentTime + 10));
  };

  const handleVoiceReassign = (characterName: string, voiceId: string, voice: ElevenLabsVoice) => {
    const originalVoice = characters.find(c => c.name === characterName)?.voiceKey;
    const isChange = voiceId !== originalVoice;
    
    setCharacterVoices(prev => ({
      ...prev,
      [characterName]: voiceId
    }));
    
    setPendingChanges(prev => {
      const updated = new Set(prev);
      if (isChange) {
        updated.add(characterName);
      } else {
        updated.delete(characterName);
      }
      return updated;
    });
    
    onVoiceChange?.(characterName, voiceId, voice);
    console.log(`Reassigned ${characterName} to voice: ${voice.name}`);
  };

  const handleRegenerateAudio = async () => {
    if (!onRegenerateAudio || pendingChanges.size === 0) return;
    
    const changedVoices = { ...characterVoices };
    
    try {
      await onRegenerateAudio(changedVoices);
      setPendingChanges(new Set());
    } catch (err) {
      console.error('Failed to regenerate audio:', err);
    }
  };

  const getVoiceName = (voiceKey: string): string => {
    const voice = voices.find(v => v.voice_id === voiceKey);
    return voice?.name || voiceKey || 'Not assigned';
  };
  
  const getLineClassName = (line: DisplayLine): string => {
    const baseClasses = 'transition-all duration-200';
    const isActive = line.id === currentLineId;
    
    const currentActiveCharacter = displayLines.find(l => l.id === currentLineId)?.character;
    const isCharacterOfActive = line.type === 'character' && currentActiveCharacter === line.character;
    
    switch (line.type) {
      case 'scene_heading':
        return `${baseClasses} font-mono text-xs sm:text-sm uppercase tracking-wider text-sky-400 mb-4 sm:mb-6 mt-6 sm:mt-8 first:mt-0 font-bold`;
      case 'action':
        return `${baseClasses} font-mono text-xs sm:text-sm leading-relaxed mb-3 sm:mb-4 ${
          isActive 
            ? 'bg-sky-500/20 text-sky-200 px-2 py-1 rounded' 
            : 'text-slate-300'
        }`;
      case 'character':
        return `${baseClasses} font-mono text-xs sm:text-sm uppercase tracking-wide mt-4 sm:mt-6 mb-1 text-center sm:text-left sm:ml-[35%] font-semibold ${
          isCharacterOfActive 
            ? 'text-sky-300' 
            : 'text-slate-200'
        }`;
      case 'dialogue':
        return `${baseClasses} font-mono text-xs sm:text-sm leading-relaxed text-center sm:text-left sm:ml-[25%] max-w-full sm:max-w-[35ch] mx-auto sm:mx-0 mb-3 sm:mb-4 ${
          isActive 
            ? 'bg-sky-500/20 text-sky-200 px-2 py-1 rounded' 
            : 'text-slate-300'
        }`;
      default:
        return `${baseClasses} font-mono text-xs sm:text-sm`;
    }
  };
  
  return (
    <div className="flex flex-col h-[70vh] sm:h-[80vh] border border-slate-700 rounded-lg bg-slate-900 overflow-hidden">
      {characters.length > 0 && (
        <div className="border-b border-slate-700 bg-slate-800/50">
          <Button
            variant="ghost"
            onClick={() => setShowCastPanel(!showCastPanel)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-none text-left"
            data-testid="button-toggle-cast-panel"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-sky-400" />
              <span className="text-sm font-medium text-slate-200">
                Voice Cast ({characters.length} characters)
              </span>
            </div>
            {showCastPanel ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </Button>
          
          {showCastPanel && (
            <div className="px-4 pb-4 space-y-3 max-h-[300px] overflow-y-auto">
              {voicesLoading ? (
                <div className="text-sm text-slate-400 py-2">Loading voices...</div>
              ) : voices.length === 0 ? (
                <div className="text-sm text-slate-400 py-2">No voices available. Please check your ElevenLabs connection.</div>
              ) : (
                <>
                  {characters.map((char) => (
                    <div 
                      key={char.name}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
                      data-testid={`character-voice-row-${char.name}`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="font-medium text-sm text-slate-200 truncate">
                          {char.name}
                        </span>
                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                          {char.lineCount} {char.lineCount === 1 ? 'line' : 'lines'}
                        </Badge>
                        {pendingChanges.has(char.name) && (
                          <Badge variant="outline" className="text-xs flex-shrink-0 border-amber-500 text-amber-400">
                            Changed
                          </Badge>
                        )}
                      </div>
                      <div className="flex-shrink-0">
                        <VoiceSelector
                          voices={voices}
                          selectedVoiceId={characterVoices[char.name] || ''}
                          category={char.category || undefined}
                          onVoiceChange={(voiceId, voice) => handleVoiceReassign(char.name, voiceId, voice)}
                          showPreview={true}
                          className="min-w-[200px]"
                        />
                      </div>
                    </div>
                  ))}
                  
                  {onRegenerateAudio && (
                    <div className="pt-3 border-t border-slate-700">
                      <Button
                        onClick={handleRegenerateAudio}
                        disabled={pendingChanges.size === 0 || isRegenerating}
                        className="w-full bg-amber-600 text-white"
                        data-testid="button-regenerate-audio"
                      >
                        {isRegenerating ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Regenerating Audio...
                          </>
                        ) : pendingChanges.size > 0 ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate Audio ({pendingChanges.size} voice{pendingChanges.size > 1 ? 's' : ''} changed)
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Regenerate Audio
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-8 py-4 sm:py-6 screenplay-scroll"
      >
        <div className="max-w-full sm:max-w-3xl mx-auto">
          {displayLines.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <p>No script content to display</p>
            </div>
          ) : (
            displayLines.map((line) => {
              const isActive = line.id === currentLineId;
              const isClickable = line.type === 'dialogue' || line.type === 'action';
              const lineNote = notesByLineId.get(line.id);
              const hasNote = !!lineNote;
              const canAddNote = line.type === 'dialogue' || line.type === 'action' || line.type === 'character';
              
              return (
                <div
                  key={line.id}
                  ref={isActive ? activeLineRef : null}
                  className={`group relative ${getLineClassName(line)} ${hasNote ? 'bg-amber-500/10 border-l-2 border-amber-400 pl-2' : ''}`}
                  onClick={() => {
                    if (isClickable) {
                      onSeek(line.start);
                    }
                  }}
                  style={{
                    cursor: isClickable ? 'pointer' : 'default',
                  }}
                  data-testid={`screenplay-line-${line.id}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="flex-1">{line.text}</span>
                    
                    {canAddNote && (
                      <div className="flex-shrink-0 flex items-center gap-1">
                        {hasNote ? (
                          <Popover 
                            open={openPopoverLineId === line.id} 
                            onOpenChange={(open) => {
                              if (open) {
                                setOpenPopoverLineId(line.id);
                                setEditingNoteText(lineNote.text);
                                setEditingNoteId(lineNote.id);
                              } else {
                                setOpenPopoverLineId(null);
                              }
                            }}
                          >
                            <PopoverTrigger asChild>
                              <button
                                type="button"
                                className="p-1.5 rounded text-amber-400 hover:text-amber-300 hover:bg-slate-700/50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Open the popover manually to ensure it works
                                  setOpenPopoverLineId(line.id);
                                  setEditingNoteText(lineNote.text);
                                  setEditingNoteId(lineNote.id);
                                }}
                                data-testid={`button-view-note-${line.id}`}
                              >
                                <StickyNote className="h-4 w-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent 
                              className="w-72 bg-slate-800 border-slate-600" 
                              align="end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-slate-200">Note</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-slate-400 hover:text-red-400"
                                    onClick={() => {
                                      handleDeleteNoteById(lineNote.id);
                                      setOpenPopoverLineId(null);
                                    }}
                                    data-testid={`button-delete-note-${line.id}`}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                                <Textarea
                                  value={editingNoteText}
                                  onChange={(e) => {
                                    setEditingNoteText(e.target.value);
                                  }}
                                  placeholder="Add your note..."
                                  className="min-h-[80px] bg-slate-700 border-slate-600 text-slate-200 text-sm"
                                  data-testid={`textarea-note-${line.id}`}
                                />
                                <Button
                                  size="sm"
                                  className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                                  onClick={() => {
                                    handleUpdateNote(lineNote.lineId, editingNoteText);
                                    setOpenPopoverLineId(null);
                                  }}
                                  data-testid={`button-save-note-${line.id}`}
                                >
                                  Save Note
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <button
                            type="button"
                            className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto p-1.5 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-700/50 transition-all relative z-10"
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              console.log('Add note clicked for line:', line.id);
                              handleAddNote(line.id);
                            }}
                            data-testid={`button-add-note-${line.id}`}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      <div className="border-t border-slate-700 bg-slate-900/95 backdrop-blur-sm p-2 sm:p-4">
        <div className="max-w-full sm:max-w-3xl mx-auto space-y-2 sm:space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400 w-10 sm:w-12 text-center">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              min={0}
              max={duration || 1}
              step={0.1}
              onValueChange={handleSliderChange}
              className="flex-1"
              data-testid="slider-playback"
            />
            <span className="text-xs font-mono text-slate-400 w-10 sm:w-12 text-right">
              {formatTime(duration)}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-2">
            {/* Rating buttons - left side */}
            {onReviewStatusChange && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReviewStatusChange(reviewStatus === 'like' ? null : 'like')}
                  disabled={isUpdatingRating}
                  className={`gap-1.5 ${
                    reviewStatus === 'like' 
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50' 
                      : 'text-slate-400 hover:text-emerald-400'
                  }`}
                  data-testid="button-rating-like"
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Like</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReviewStatusChange(reviewStatus === 'pass' ? null : 'pass')}
                  disabled={isUpdatingRating}
                  className={`gap-1.5 ${
                    reviewStatus === 'pass' 
                      ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                      : 'text-slate-400 hover:text-red-400'
                  }`}
                  data-testid="button-rating-pass"
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Pass</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onReviewStatusChange(reviewStatus === 'undecided' ? null : 'undecided')}
                  disabled={isUpdatingRating}
                  className={`gap-1.5 ${
                    reviewStatus === 'undecided' 
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' 
                      : 'text-slate-400 hover:text-amber-400'
                  }`}
                  data-testid="button-rating-undecided"
                >
                  <HelpCircle className="h-4 w-4" />
                  <span className="hidden sm:inline text-xs">Undecided</span>
                </Button>
              </div>
            )}
            {!onReviewStatusChange && <div />}
            
            {/* Playback controls - center */}
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={skipBackward}
                className="text-slate-300 hover:text-white"
                data-testid="button-skip-backward"
              >
                <SkipBack className="h-4 w-4" />
              </Button>
              
              <Button
                variant="default"
                size="icon"
                onClick={() => onPlayPause(!isPlaying)}
                className="h-10 w-10 sm:h-12 sm:w-12 bg-sky-500 hover:bg-sky-600 text-white"
                data-testid="button-play-pause"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 sm:h-5 sm:w-5" />
                ) : (
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 ml-0.5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                onClick={skipForward}
                className="text-slate-300 hover:text-white"
                data-testid="button-skip-forward"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Spacer for symmetry */}
            <div className="hidden sm:block w-[180px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
