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

// Helper function to categorize voices based on name/description
export const categorizeVoice = (voiceName: string, description?: string): UserVoiceCategory => {
  const name = voiceName.toLowerCase()
  const desc = description?.toLowerCase() || ''
  
  // Check for age-related keywords
  if (name.includes('teen') || desc.includes('teen') || desc.includes('teenager')) {
    return name.includes('female') || desc.includes('female') || desc.includes('woman') || desc.includes('girl') 
      ? 'Female Teen' : 'Male Teen'
  }
  
  if (name.includes('child') || desc.includes('child') || desc.includes('young') || name.includes('kid')) {
    return name.includes('female') || desc.includes('female') || desc.includes('woman') || desc.includes('girl')
      ? 'Female Under 10' : 'Male Under 10'
  }
  
  if (name.includes('old') || desc.includes('old') || desc.includes('elderly') || desc.includes('senior')) {
    return name.includes('female') || desc.includes('female') || desc.includes('woman')
      ? 'Older Female' : 'Older Male'
  }
  
  if (name.includes('narrat') || desc.includes('narrat')) {
    return 'Narrator'
  }
  
  // Default to adult categories based on gender
  if (name.includes('female') || desc.includes('female') || desc.includes('woman')) {
    return 'Female 20s to 30s'
  }
  
  if (name.includes('male') || desc.includes('male') || desc.includes('man')) {
    return 'Male 20s to 30s'
  }
  
  // If no clear indicators, default to narrator
  return 'Narrator'
}