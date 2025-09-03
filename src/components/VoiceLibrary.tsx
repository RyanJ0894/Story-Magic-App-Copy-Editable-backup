import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, Search, RefreshCw, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useElevenLabsVoices, ElevenLabsVoice } from '@/hooks/useElevenLabsVoices'
import { useToast } from '@/hooks/use-toast'

interface VoiceCardProps {
  voice: ElevenLabsVoice
  isPlaying: boolean
  isLoading: boolean
  onPlay: () => void
  onPause: () => void
}

const VoiceCard = ({ voice, isPlaying, isLoading, onPlay, onPause }: VoiceCardProps) => {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-md ${isPlaying ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium truncate pr-2">{voice.name}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={isPlaying ? onPause : onPlay}
            disabled={isLoading}
            className="flex-shrink-0"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          <Volume2 className="h-3 w-3 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {voice.category}
          </Badge>
        </div>
        
        {voice.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {voice.description}
          </p>
        )}
      </CardContent>
    </Card>
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
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const { toast } = useToast()

  // Filter voices based on search term
  const filteredVoices = voices.filter(voice =>
    voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    voice.category.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Group voices by category
  const voicesByCategory = filteredVoices.reduce((acc, voice) => {
    const category = voice.category || 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(voice)
    return acc
  }, {} as Record<string, ElevenLabsVoice[]>)

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
          <Button onClick={retry} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Voice Library</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? 'Loading voices...' : `${count} voices available`}
            </p>
          </div>
          {!loading && (
            <Button onClick={retry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
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
          <div className="space-y-6">
            {Object.entries(voicesByCategory).map(([category, categoryVoices]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {category} ({categoryVoices.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}