import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

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

      const { data, error: invokeError } = await supabase.functions.invoke('fetch-elevenlabs-voices')

      if (invokeError) {
        throw new Error(invokeError.message)
      }

      if (data.error) {
        throw new Error(data.error)
      }

      setVoices(data.voices || [])
      
      if (data.voices.length === 0) {
        toast({
          title: "No voices found",
          description: "No voices were found in your ElevenLabs account.",
          variant: "destructive"
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