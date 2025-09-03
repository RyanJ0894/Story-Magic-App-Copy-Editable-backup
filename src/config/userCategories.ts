export const USER_VOICE_CATEGORIES = [
  'Female 20s to 30s',
  'Female Teen', 
  'Female Under 10',
  'Male 20s to 30s',
  'Male Teen',
  'Male Under 10', 
  'Narrator',
  'Older Female',
  'Older Male'
] as const

export type UserVoiceCategory = typeof USER_VOICE_CATEGORIES[number]

// Helper function to categorize voices based SOLELY on YOUR voice names and descriptions
export const categorizeVoice = (voiceName: string, description?: string): UserVoiceCategory => {
  const name = voiceName.toLowerCase()
  const desc = description?.toLowerCase() || ''
  const combined = `${name} ${desc}`.trim()
  
  // First check for narrator indicators
  if (combined.includes('narrator') || combined.includes('narration') || combined.includes('voice over')) {
    return 'Narrator'
  }
  
  // Check for age-specific keywords first (more specific)
  if (combined.includes('teen') || combined.includes('teenager') || combined.includes('adolescent')) {
    // Determine gender for teen category
    if (combined.includes('female') || combined.includes('girl') || combined.includes('woman') || 
        combined.includes('she') || combined.includes('her')) {
      return 'Female Teen'
    }
    if (combined.includes('male') || combined.includes('boy') || combined.includes('man') || 
        combined.includes('he') || combined.includes('his')) {
      return 'Male Teen'
    }
    // Default to Male Teen if gender unclear
    return 'Male Teen'
  }
  
  // Check for child/young keywords
  if (combined.includes('child') || combined.includes('kid') || combined.includes('young') || 
      combined.includes('under 10') || combined.includes('baby') || combined.includes('toddler')) {
    // Determine gender for child category
    if (combined.includes('female') || combined.includes('girl') || combined.includes('woman') || 
        combined.includes('she') || combined.includes('her')) {
      return 'Female Under 10'
    }
    if (combined.includes('male') || combined.includes('boy') || combined.includes('man') || 
        combined.includes('he') || combined.includes('his')) {
      return 'Male Under 10'
    }
    // Default to Male Under 10 if gender unclear
    return 'Male Under 10'
  }
  
  // Check for older/elderly keywords
  if (combined.includes('older') || combined.includes('old') || combined.includes('elderly') || 
      combined.includes('senior') || combined.includes('mature') || combined.includes('aged')) {
    // Determine gender for older category
    if (combined.includes('female') || combined.includes('woman') || combined.includes('lady') || 
        combined.includes('she') || combined.includes('her')) {
      return 'Older Female'
    }
    if (combined.includes('male') || combined.includes('man') || combined.includes('gentleman') || 
        combined.includes('he') || combined.includes('his')) {
      return 'Older Male'
    }
    // Default to Older Male if gender unclear
    return 'Older Male'
  }
  
  // Default adult categories (20s to 30s) based on gender
  if (combined.includes('female') || combined.includes('woman') || combined.includes('lady') || 
      combined.includes('she') || combined.includes('her')) {
    return 'Female 20s to 30s'
  }
  
  if (combined.includes('male') || combined.includes('man') || combined.includes('gentleman') || 
      combined.includes('he') || combined.includes('his')) {
    return 'Male 20s to 30s'
  }
  
  // If no clear gender or age indicators, default to Narrator
  return 'Narrator'
}