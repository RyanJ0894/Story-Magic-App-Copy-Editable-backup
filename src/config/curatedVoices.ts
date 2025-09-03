// Default curated voice IDs - fallback when no user selections are found
export const DEFAULT_CURATED_VOICES = [
  'Aria - 9BWtsMINqrJLrRacOk9x',
  'Roger - CwhRBWXzGAHq8TQ4Fs17', 
  'Sarah - EXAVITQu4vr4xnSDxMaL',
  'Laura - FGY2WhTYpPnrIDTdsKH5',
  'Charlie - IKne3meq5aSn9XLyUdCD',
  'George - JBFqnCBsd6RMkjVDRZzb',
  'Callum - N2lVS1w4EtoT3dr4eOWO',
  'River - SAz9YHcvj6GT2YYXdXww',
  'Liam - TX3LPaxmHKxFdv7VOQHJ',
  'Charlotte - XB0fDUnXU5powFXDhCwa',
  'Alice - Xb7hH8MSUJpSbSDYk0k2',
  'Matilda - XrExE9yKIg1WjnnlVkGX'
]

export const getCuratedVoiceIds = (): string[] => {
  return DEFAULT_CURATED_VOICES.map(voice => voice.split(' - ')[1])
}