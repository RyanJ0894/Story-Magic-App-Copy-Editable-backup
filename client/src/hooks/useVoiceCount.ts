import { useState, useEffect } from 'react'
import { supabase } from '../../../supabase/client'

export const useVoiceCount = () => {
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchVoiceCount = async () => {
      setLoading(true)
      try {
        const { data, error } = await supabase.functions.invoke('fetch-elevenlabs-voices')
        
        if (!error && data) {
          setCount(data.count || 0)
        }
      } catch (err) {
        console.error('Error fetching voice count:', err)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    fetchVoiceCount()
  }, [])

  return { count, loading }
}