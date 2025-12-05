import React from "react";
import { Controller } from "react-hook-form";
import { Music, Zap, Wind, Volume2, Play, CreditCard, Mic, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useScriptEditModal } from "../hooks/useScriptEditModal";
import { useTTSGeneration } from "../hooks/useTTSGeneration";
import { VOICE_OPTIONS, AUDIO_OPTIONS } from "../constants";
import type { ScriptEditModalProps } from "../types";

export default function ScriptEditModal({ 
  isOpen, 
  onClose, 
  selectedItems, 
  chunks, 
  onSave 
}: ScriptEditModalProps) {
  const {
    control,
    handleSubmit,
    selectedEvents,
    scriptEvents,
    audioEvents
  } = useScriptEditModal(isOpen, selectedItems, chunks, onSave);

  const {
    isGenerating,
    generateTTS,
    isGeneratingForLine,
    creditsCost
  } = useTTSGeneration();

  const getAudioIcon = (subtype: string) => {
    switch(subtype) {
      case 'music': return Music;
      case 'ambience': return Wind;
      case 'sfx': return Zap;
      default: return Volume2;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background border rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden thin-scrollbar">
        {/* Compact Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">Edit Items</h3>
            <Badge variant="secondary" className="text-xs">
              {selectedItems.size}
            </Badge>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Compact Content */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          <div className="space-y-4">
            {/* Script Lines */}
            {scriptEvents.map(event => (
              <div key={event.id} className="p-3 border rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant={event.subtype === 'dialogue' ? 'default' : 'secondary'} className="text-xs">
                    {event.subtype}
                  </Badge>
                  <span className="text-sm text-muted-foreground truncate">
                    {event.data.text}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Volume */}
                  <div className="space-y-1">
                    <Label className="text-xs">Volume</Label>
                    <Controller
                      name={`${event.id}.volume`}
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center gap-2">
                          <Slider
                            value={[field.value || 1]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={1}
                            step={0.1}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground w-8">
                            {Math.round((field.value || 1) * 100)}%
                          </span>
                        </div>
                      )}
                    />
                  </div>

                  {/* Voice */}
                  <div className="space-y-1">
                    <Label className="text-xs">Voice</Label>
                    <Controller
                      name={`${event.id}.voice_key`}
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VOICE_OPTIONS.filter(voice => 
                              event.subtype === 'dialogue' ? voice.type === 'dialogue' : voice.type === 'narration'
                            ).map(voice => (
                              <SelectItem key={voice.key} value={voice.key} className="text-xs">
                                {voice.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {/* Character (dialogue only) */}
                  {event.subtype === 'dialogue' && (
                    <div className="space-y-1">
                      <Label className="text-xs">Character</Label>
                      <Controller
                        name={`${event.id}.character`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            className="h-8 text-xs"
                            placeholder="Character name"
                          />
                        )}
                      />
                    </div>
                  )}

                  {/* Style */}
                  <div className="space-y-1">
                    <Label className="text-xs">Style</Label>
                    <Controller
                      name={`${event.id}.style`}
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="normal" className="text-xs">Normal</SelectItem>
                            <SelectItem value="soft" className="text-xs">Soft</SelectItem>
                            <SelectItem value="energetic" className="text-xs">Energetic</SelectItem>
                            <SelectItem value="calm" className="text-xs">Calm</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>

                {/* TTS Generate */}
                <div className="flex items-center justify-between p-2 bg-muted rounded text-xs">
                  <div className="flex items-center gap-1">
                    <CreditCard className="h-3 w-3" />
                    <span>TTS ({creditsCost} credits)</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-6 text-xs"
                    onClick={() => generateTTS(event.id)}
                    disabled={isGeneratingForLine(event.id)}
                  >
                    {isGeneratingForLine(event.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Generate
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ))}

            {/* Audio Events */}
            {audioEvents.map(event => {
              const Icon = getAudioIcon(event.subtype);
              return (
                <div key={event.id} className="p-3 border rounded-lg space-y-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    <Badge variant="outline" className="text-xs">{event.subtype}</Badge>
                    <span className="text-sm text-muted-foreground truncate">
                      {event.data.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Volume */}
                    <div className="space-y-1">
                      <Label className="text-xs">Volume</Label>
                      <Controller
                        name={`${event.id}.volume`}
                        control={control}
                        render={({ field }) => (
                          <div className="flex items-center gap-2">
                            <Slider
                              value={[field.value || 0.5]}
                              onValueChange={(value) => field.onChange(value[0])}
                              max={1}
                              step={0.1}
                              className="flex-1"
                            />
                            <span className="text-xs text-muted-foreground w-8">
                              {Math.round((field.value || 0.5) * 100)}%
                            </span>
                          </div>
                        )}
                      />
                    </div>

                    {/* Duration */}
                    <div className="space-y-1">
                      <Label className="text-xs">Duration</Label>
                      <Controller
                        name={`${event.id}.duration`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            className="h-8 text-xs"
                            min="0"
                            step="0.1"
                          />
                        )}
                      />
                    </div>

                    {/* Fade In */}
                    <div className="space-y-1">
                      <Label className="text-xs">Fade In</Label>
                      <Controller
                        name={`${event.id}.fade_in`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            className="h-8 text-xs"
                            min="0"
                            step="0.1"
                          />
                        )}
                      />
                    </div>

                    {/* Fade Out */}
                    <div className="space-y-1">
                      <Label className="text-xs">Fade Out</Label>
                      <Controller
                        name={`${event.id}.fade_out`}
                        control={control}
                        render={({ field }) => (
                          <Input
                            {...field}
                            type="number"
                            className="h-8 text-xs"
                            min="0"
                            step="0.1"
                          />
                        )}
                      />
                    </div>

                    {/* Change Audio */}
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">Change Audio</Label>
                      <Controller
                        name={`${event.id}.label`}
                        control={control}
                        render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {AUDIO_OPTIONS[event.subtype as keyof typeof AUDIO_OPTIONS]?.map(audio => (
                                <SelectItem key={audio.key} value={audio.label} className="text-xs">
                                  {audio.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Compact Footer */}
          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
