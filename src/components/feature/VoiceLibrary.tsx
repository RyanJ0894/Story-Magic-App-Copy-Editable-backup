import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Search, RefreshCw, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useElevenLabsVoices, ElevenLabsVoice } from '@/hooks/useElevenLabsVoices'
import { useToast } from '@/hooks/use-toast'
import { USER_VOICE_CATEGORIES, UserVoiceCategory } from '@/config/userCategories'

interface VoiceCardProps {
  voice: ElevenLabsVoice
  isPlaying: boolean
  isLoading: boolean
  onPlay: () => void
  onPause: () => void
}

const VoiceCard = ({ voice, isPlaying, isLoading, onPlay, onPause }: VoiceCardProps) => {
  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-accent/50 ${isPlaying ? 'ring-2 ring-primary bg-accent/30' : 'bg-background'}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={isPlaying ? onPause : onPlay}
          disabled={isLoading}
          className="flex-shrink-0 h-8 w-8 p-0"
        >
          {isLoading ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-3 w-3" />
          ) : (
            <Play className="h-3 w-3" />
          )}
        </Button>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm truncate">{voice.name}</h4>
          {voice.description && (
            <p className="text-xs text-muted-foreground truncate">
              {voice.description}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2 flex-shrink-0">
        <Volume2 className="h-3 w-3 text-muted-foreground" />
        <Badge variant="secondary" className="text-xs">
          {voice.category}
        </Badge>
      </div>
    </div>
  )
}

const VoiceLibrarySkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(6)].map((_, i) => (
      <Card key={i}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-3 w-3" />
            <Skeleton className="h-5 w-16" />
          </div>
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
)

export const VoiceLibrary = () => {
  const { voices, loading, error, retry, count } = useElevenLabsVoices()
  const [searchTerm, setSearchTerm] = useState('')
  const [playingVoice, setPlayingVoice] = useState<string | null>(null)
  const [loadingVoice, setLoadingVoice] = useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})
  const [isLibraryOpen, setIsLibraryOpen] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  // Filter voices based on search term
  const filteredVoices = voices.filter(voice => {
    return voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           voice.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (voice.description && voice.description.toLowerCase().includes(searchTerm.toLowerCase()))
  })

  // Group voices by their already assigned category from the edge function
  const voicesByCategory = filteredVoices.reduce((acc, voice) => {
    const category = voice.category as UserVoiceCategory
    if (!acc[category]) acc[category] = []
    acc[category].push(voice)
    return acc
  }, {} as Record<UserVoiceCategory, ElevenLabsVoice[]>)

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  const playVoice = async (voice: ElevenLabsVoice) => {
    if (playingVoice === voice.voice_id) {
      // Pause current voice
      if (audioRef.current) {
        audioRef.current.pause()
        setPlayingVoice(null)
      }
      return
    }

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
    }

    setLoadingVoice(voice.voice_id)
    setPlayingVoice(null)

    try {
      // Use preview URL if available, otherwise generate a sample
      let audioUrl = voice.preview_url

      if (!audioUrl) {
        // If no preview URL, we could implement sample generation here
        // For now, show a message
        toast({
          title: "No preview available",
          description: `Preview not available for ${voice.name}`,
          variant: "default"
        })
        return
      }

      audioRef.current = new Audio(audioUrl)
      
      audioRef.current.onloadstart = () => {
        setLoadingVoice(voice.voice_id)
      }
      
      audioRef.current.oncanplay = () => {
        setLoadingVoice(null)
        setPlayingVoice(voice.voice_id)
      }

      audioRef.current.onended = () => {
        setPlayingVoice(null)
      }

      audioRef.current.onerror = () => {
        setLoadingVoice(null)
        toast({
          title: "Audio error",
          description: `Failed to play preview for ${voice.name}`,
          variant: "destructive"
        })
      }

      await audioRef.current.play()
    } catch (error) {
      setLoadingVoice(null)
      toast({
        title: "Playback failed",
        description: `Could not play preview for ${voice.name}`,
        variant: "destructive"
      })
    }
  }

  const pauseVoice = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setPlayingVoice(null)
    }
  }

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  if (error && !loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Voice Library</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => retry()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Collapsible open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
      <CollapsibleTrigger asChild>
        <Card className="cursor-pointer hover:bg-accent/50 transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Voice Library
                  {isLibraryOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {loading ? 'Loading voices...' : `${count} voices available`}
                </p>
              </div>
              {!loading && (
                <Button 
                  onClick={(e) => {
                    e.stopPropagation()
                    retry()
                  }} 
                  variant="outline" 
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <Card>
          <CardContent className="space-y-4">
            {!loading && voices.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search voices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {loading ? (
              <VoiceLibrarySkeleton />
            ) : voices.length === 0 ? (
              <div className="text-center py-8">
                <Volume2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No voices found in your ElevenLabs account.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {USER_VOICE_CATEGORIES.map((category) => {
                  const categoryVoices = voicesByCategory[category] || []
                  if (categoryVoices.length === 0) return null
                  
                  return (
                    <Collapsible
                      key={category}
                      open={expandedCategories[category]}
                      onOpenChange={() => toggleCategory(category)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between h-auto p-3 text-left font-medium hover:bg-accent/50"
                        >
                          <span className="text-sm font-semibold text-foreground uppercase tracking-wide">
                            {category} ({categoryVoices.length})
                          </span>
                          {expandedCategories[category] ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 mt-2 ml-2">
                        {categoryVoices.map((voice) => (
                          <VoiceCard
                            key={voice.voice_id}
                            voice={voice}
                            isPlaying={playingVoice === voice.voice_id}
                            isLoading={loadingVoice === voice.voice_id}
                            onPlay={() => playVoice(voice)}
                            onPause={pauseVoice}
                          />
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  )
}