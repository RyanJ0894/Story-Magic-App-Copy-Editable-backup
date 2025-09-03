import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { getCuratedVoiceIds } from '@/config/curatedVoices'

export interface ElevenLabsVoice {
  voice_id: string
  name: string
  category: string
  description?: string
  preview_url?: string
  available_for_tiers?: string[]
  settings?: any
  labels?: Record<string, any>
  samples?: any[]
  high_quality_base_model_ids?: string[]
}

export interface ElevenLabsVoicesResponse {
  voices: ElevenLabsVoice[]
  count: number
  error?: string
}

export const useElevenLabsVoices = () => {
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchVoices = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      // First check for user's curated voice selections
      const { data: userSelections, error: selectionsError } = await supabase
        .from('user_voice_selections')
        .select('voice_id')
      
      let curatedVoiceIds: string[] = []
      
      if (selectionsError) {
        console.warn('Could not fetch user voice selections:', selectionsError)
        // Fall back to default curated voices
        curatedVoiceIds = getCuratedVoiceIds()
      } else if (userSelections && userSelections.length > 0) {
        // Use user's curated voices
        curatedVoiceIds = userSelections.map(selection => selection.voice_id)
      } else {
        // Fall back to default curated voices if no user selections
        curatedVoiceIds = getCuratedVoiceIds()
      }

      const { data, error: invokeError } = await supabase.functions.invoke('fetch-elevenlabs-voices', {
        body: { curatedVoiceIds }
      })

      if (invokeError) {
        throw new Error(invokeError.message)
      }

      if (data.error) {
        throw new Error(data.error)
      }

      // Filter voices to only include curated ones
      const allVoices = data.voices || []
      const curatedVoices = allVoices.filter((voice: ElevenLabsVoice) => 
        curatedVoiceIds.includes(voice.voice_id)
      )

      setVoices(curatedVoices)
      
      if (curatedVoices.length === 0) {
        toast({
          title: "No curated voices found",
          description: "No voices were found matching your curated selection.",
          variant: "default"
        })
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch voices'
      setError(errorMessage)
      console.error('Error fetching ElevenLabs voices:', err)
      
      toast({
        title: "Failed to load voices",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const retry = () => {
    fetchVoices()
  }

  useEffect(() => {
    fetchVoices()
  }, [])

  return {
    voices,
    loading,
    error,
    retry,
    refetch: fetchVoices,
    count: voices.length
  }
}