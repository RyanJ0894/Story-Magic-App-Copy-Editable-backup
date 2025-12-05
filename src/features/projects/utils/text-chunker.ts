export type TextChunk = {
  id: string;
  text: string;
  order: number;
  start: number;
  duration: number;
  scene_title: string;
};

export type ChunkingOptions = {
  maxChunkLength?: number;
  overlap?: number;
  minChunkLength?: number;
};

export function chunkTextByScenes(
  text: string, 
  options: ChunkingOptions = {}
): TextChunk[] {
  const {
    maxChunkLength = 2000,
    overlap = 200,
    minChunkLength = 500
  } = options;

  // Enhanced scene detection patterns
  const scenePatterns = [
    /^(EXT\.|INT\.)/gm,                    // Standard scene directions
    /^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO)/gm, // Transitions
    /^(ACT [IVX]+|CHAPTER [0-9]+)/gm,      // Act/Chapter markers
    /^(SCENE [0-9]+|PART [0-9]+)/gm,       // Scene/Part markers
    /^(MORNING|AFTERNOON|EVENING|NIGHT)/gm, // Time markers
    /^(INSIDE|OUTSIDE|INTERIOR|EXTERIOR)/gm, // Location markers
    /^(FLASHBACK|FLASH FORWARD)/gm,        // Time jumps
    /^(CLOSE-UP|WIDE SHOT|MEDIUM SHOT)/gm, // Camera directions
    /^(MONTAGE|SERIES OF SHOTS)/gm,        // Special sequences
    /^(THE END|END OF ACT|FIN)/gm          // End markers
  ];

  // Try each pattern to find the best scene breaks
  let bestScenes: string[] = [];
  let bestPattern: RegExp | null = null;

  for (const pattern of scenePatterns) {
    const scenes = text.split(pattern).filter(Boolean);
    if (scenes.length > 1 && scenes.length > bestScenes.length) {
      bestScenes = scenes;
      bestPattern = pattern;
    }
  }

  // If no good scene pattern found, return empty array
  if (!bestPattern || bestScenes.length < 2) {
    return [];
  }
  
  const chunks: TextChunk[] = [];
  let currentOrder = 1;
  let currentStart = 0;

  // Process scenes (bestPattern found the best way to split)
  for (let i = 0; i < bestScenes.length; i += 2) {
    const sceneDirection = bestScenes[i];
    const sceneContent = bestScenes[i + 1] || '';
    
    if (!sceneDirection || !sceneContent.trim()) continue;

    const fullScene = sceneDirection + sceneContent;
    const sceneTitle = extractSceneTitle(sceneDirection);
    
    // If scene is too long, split it further
    if (fullScene.length > maxChunkLength) {
      const subChunks = splitLongScene(fullScene, maxChunkLength, overlap);
      
      subChunks.forEach((subChunk, index) => {
        const duration = estimateChunkDuration(subChunk);
        chunks.push({
          id: `chunk_${currentOrder}`,
          text: subChunk,
          order: currentOrder,
          start: currentStart,
          duration,
          scene_title: `${sceneTitle} (Part ${index + 1})`
        });
        
        currentStart += duration;
        currentOrder++;
      });
    } else {
      // Scene is short enough, use as-is
      const duration = estimateChunkDuration(fullScene);
      chunks.push({
        id: `chunk_${currentOrder}`,
        text: fullScene,
        order: currentOrder,
        start: currentStart,
        duration,
        scene_title: sceneTitle
      });
      
      currentStart += duration;
      currentOrder++;
    }
  }

  return chunks;
}

/**
 * Split text into chunks by paragraphs (double newlines)
 */
export function chunkTextByParagraphs(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const {
    maxChunkLength = 2000,
    overlap = 200,
    minChunkLength = 500
  } = options;

  // Split by double newlines (paragraph breaks)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  if (paragraphs.length === 0) return [];

  const chunks: TextChunk[] = [];
  let currentOrder = 1;
  let currentStart = 0;
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    
    // If adding this paragraph would exceed max length, save current chunk
    if (currentChunk && (currentChunk + '\n\n' + trimmedParagraph).length > maxChunkLength) {
      if (currentChunk.length >= minChunkLength) {
        const duration = estimateChunkDuration(currentChunk);
        chunks.push({
          id: `chunk_${currentOrder}`,
          text: currentChunk.trim(),
          order: currentOrder,
          start: currentStart,
          duration,
          scene_title: extractSceneTitle(currentChunk) || `Paragraph ${currentOrder}`
        });
        
        currentStart += duration;
        currentOrder++;
        currentChunk = '';
      }
    }
    
    // Add paragraph to current chunk
    if (currentChunk) {
      currentChunk += '\n\n' + trimmedParagraph;
    } else {
      currentChunk = trimmedParagraph;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length >= minChunkLength) {
    const duration = estimateChunkDuration(currentChunk);
    chunks.push({
      id: `chunk_${currentOrder}`,
      text: currentChunk.trim(),
      order: currentOrder,
      start: currentStart,
      duration,
      scene_title: extractSceneTitle(currentChunk) || `Paragraph ${currentOrder}`
    });
  }

  return chunks;
}

/**
 * Split text into chunks by sentences (period-based)
 */
export function chunkTextBySentences(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const {
    maxChunkLength = 2000,
    overlap = 200,
    minChunkLength = 500
  } = options;

  // Split by sentences (period followed by space and capital letter, or end of text)
  const sentences = text.split(/(?<=\.)\s+(?=[A-Z])/).filter(s => s.trim().length > 0);
  
  if (sentences.length === 0) return [];

  const chunks: TextChunk[] = [];
  let currentOrder = 1;
  let currentStart = 0;
  let currentChunk = '';

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    // If adding this sentence would exceed max length, save current chunk
    if (currentChunk && (currentChunk + '. ' + trimmedSentence).length > maxChunkLength) {
      if (currentChunk.length >= minChunkLength) {
        const duration = estimateChunkDuration(currentChunk);
        chunks.push({
          id: `chunk_${currentOrder}`,
          text: currentChunk.trim(),
          order: currentOrder,
          start: currentStart,
          duration,
          scene_title: extractSceneTitle(currentChunk) || `Sentence Group ${currentOrder}`
        });
        
        currentStart += duration;
        currentOrder++;
        currentChunk = '';
      }
    }
    
    // Add sentence to current chunk
    if (currentChunk) {
      currentChunk += '. ' + trimmedSentence;
    } else {
      currentChunk = trimmedSentence;
    }
  }

  // Add remaining chunk
  if (currentChunk.trim().length >= minChunkLength) {
    const duration = estimateChunkDuration(currentChunk);
    chunks.push({
      id: `chunk_${currentOrder}`,
      text: currentChunk.trim(),
      order: currentOrder,
      start: currentStart,
      duration,
      scene_title: extractSceneTitle(currentChunk) || `Sentence Group ${currentOrder}`
    });
  }

  return chunks;
}

/**
 * Split text into chunks by character count
 */
export function chunkTextByLength(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const {
    maxChunkLength = 2000,
    overlap = 200,
    minChunkLength = 500
  } = options;

  const chunks: TextChunk[] = [];
  let currentOrder = 1;
  let currentStart = 0;
  let remainingText = text;

  while (remainingText.length > 0) {
    let chunkText = '';
    
    if (remainingText.length <= maxChunkLength) {
      // Last chunk
      chunkText = remainingText;
      remainingText = '';
    } else {
      // Find a good break point (sentence end, paragraph, etc.)
      const breakPoint = findGoodBreakPoint(
        remainingText, 
        maxChunkLength, 
        minChunkLength
      );
      
      chunkText = remainingText.substring(0, breakPoint);
      remainingText = remainingText.substring(breakPoint - overlap);
    }

    if (chunkText.trim().length === 0) break;

    const duration = estimateChunkDuration(chunkText);
    const sceneTitle = extractSceneTitle(chunkText) || `Scene ${currentOrder}`;
    
    chunks.push({
      id: `chunk_${currentOrder}`,
      text: chunkText.trim(),
      order: currentOrder,
      start: currentStart,
      duration,
      scene_title: sceneTitle
    });

    currentStart += duration;
    currentOrder++;
  }

  return chunks;
}

/**
 * Extract scene title from text with enhanced pattern recognition
 */
function extractSceneTitle(text: string): string {
  const lines = text.split('\n');
  const firstLine = lines[0]?.trim();
  
  // Enhanced scene title patterns
  const titlePatterns = [
    /^(EXT\.|INT\.)/,                           // Standard scene directions
    /^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO)/,  // Transitions
    /^(ACT [IVX]+|CHAPTER [0-9]+)/,            // Act/Chapter markers
    /^(SCENE [0-9]+|PART [0-9]+)/,             // Scene/Part markers
    /^(MORNING|AFTERNOON|EVENING|NIGHT)/,      // Time markers
    /^(INSIDE|OUTSIDE|INTERIOR|EXTERIOR)/,     // Location markers
    /^(FLASHBACK|FLASH FORWARD)/,              // Time jumps
    /^(CLOSE-UP|WIDE SHOT|MEDIUM SHOT)/,       // Camera directions
    /^(MONTAGE|SERIES OF SHOTS)/,              // Special sequences
    /^(THE END|END OF ACT|FIN)/                // End markers
  ];
  
  // Check first line
  if (firstLine) {
    for (const pattern of titlePatterns) {
      if (firstLine.match(pattern)) {
        return firstLine;
      }
    }
  }
  
  // Try to find scene direction in first few lines
  for (const line of lines.slice(0, 5)) { // Check more lines
    const trimmed = line.trim();
    for (const pattern of titlePatterns) {
      if (trimmed.match(pattern)) {
        return trimmed;
      }
    }
  }
  
  // Try to extract meaningful title from content
  if (firstLine && firstLine.length < 100) {
    return firstLine;
  }
  
  // Generate meaningful fallback
  const words = text.split(/\s+/).slice(0, 5).join(' ');
  return words.length > 50 ? words.substring(0, 50) + '...' : words || `Scene ${Date.now()}`;
}

/**
 * Split a long scene into smaller chunks
 */
function splitLongScene(
  scene: string, 
  maxLength: number, 
  overlap: number
): string[] {
  const chunks: string[] = [];
  let remaining = scene;
  
  while (remaining.length > maxLength) {
    const breakPoint = findGoodBreakPoint(remaining, maxLength, 500);
    chunks.push(remaining.substring(0, breakPoint));
    remaining = remaining.substring(breakPoint - overlap);
  }
  
  if (remaining.trim().length > 0) {
    chunks.push(remaining);
  }
  
  return chunks;
}

/**
 * Find a good break point in text (sentence end, paragraph, etc.)
 */
function findGoodBreakPoint(
  text: string, 
  maxLength: number, 
  minLength: number
): number {
  // Look for sentence endings first
  const sentenceEnd = text.lastIndexOf('.', maxLength);
  if (sentenceEnd > minLength) return sentenceEnd + 1;
  
  // Look for paragraph breaks
  const paragraphEnd = text.lastIndexOf('\n\n', maxLength);
  if (paragraphEnd > minLength) return paragraphEnd + 2;
  
  // Look for single line breaks
  const lineEnd = text.lastIndexOf('\n', maxLength);
  if (lineEnd > minLength) return lineEnd + 1;
  
  // Look for dialogue breaks
  const dialogueEnd = text.lastIndexOf('\n', maxLength);
  if (dialogueEnd > minLength) return dialogueEnd + 1;
  
  // Fallback to max length
  return maxLength;
}

/**
 * Count words in text (more accurate than character-based estimation)
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Estimate chunk duration based on ElevenLabs TTS speed
 * ElevenLabs default voices: 0.4-0.5 seconds/word for neutral style
 * Fast/energetic style: ~0.35 seconds/word
 */
function estimateChunkDuration(text: string, style: 'neutral' | 'fast' = 'neutral'): number {
  const wordCount = countWords(text);
  
  // ElevenLabs TTS speed benchmarks
  const secondsPerWord = style === 'fast' ? 0.35 : 0.45;
  
  const duration = wordCount * secondsPerWord;
  
  // Minimum 3 seconds, maximum 120 seconds, round to nearest second
  return Math.max(3, Math.min(120, Math.round(duration)));
}

/**
 * Estimate duration based on text length (legacy - kept for backward compatibility)
 */
function estimateDuration(textLength: number): number {
  // Rough estimate: 150 words per minute, 5 characters per word average
  const wordsPerMinute = 150;
  const charsPerWord = 5;
  const words = textLength / charsPerWord;
  const minutes = words / wordsPerMinute;
  return Math.max(10, Math.round(minutes * 60)); // Minimum 10 seconds
}

/**
 * Recalculate start times for chunks to ensure proper sequencing
 * This fixes any timing overlaps by using cumulative duration
 */
function recalculateStartTimes(chunks: TextChunk[]): TextChunk[] {
  let currentStart = 0;
  
  return chunks.map((chunk, index) => {
    const updatedChunk = {
      ...chunk,
      order: index + 1,
      start: currentStart
    };
    
    // Update currentStart for next chunk
    currentStart += chunk.duration;
    
    return updatedChunk;
  });
}

/**
 * Split text into chunks by sections/headings (for training documents, articles, etc.)
 */
export function chunkTextBySections(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const {
    maxChunkLength = 2000,
    overlap = 200,
    minChunkLength = 500
  } = options;

  // First, try to normalize the text by reducing multiple spaces
  const normalizedText = text.replace(/\s{3,}/g, '  ');

  // Enhanced section detection patterns for training documents
  const sectionPatterns = [
    // Main section headers (with optional leading spaces and flexible matching)
    /^(\s*Scene Context\s*$)/gm,
    /^(\s*Performance Details\s*\([^)]*\)\s*$)/gm,
    /^(\s*Audio Cues\s*\([^)]*\)\s*$)/gm,
    /^(\s*Synthesized Script\s*\+[^$]*$)/gm,
    /^(\s*Director's Takeaways\s*for[^$]*$)/gm,
    /^(\s*Training Document\s*$)/gm,
    /^(\s*Script Analysis\s*$)/gm,
    // More flexible patterns for the specific script format
    /^(\s*Scene Context\s*)/gm,
    /^(\s*Performance Details\s*)/gm,
    /^(\s*Audio Cues\s*)/gm,
    /^(\s*Synthesized Script\s*)/gm,
    /^(\s*Director's Takeaways\s*)/gm,
    // Markdown headers
    /^(## |### |#### |# )/gm,
    // ALL CAPS headers
    /^([A-Z][A-Z\s]+[A-Z])(?=\s*$)/gm,
    // Part/Chapter markers
    /^(Part [0-9]+|Chapter [0-9]+|Section [0-9]+)/gm,
    // Common section headers
    /^(Introduction|Overview|Summary|Conclusion|Notes|Takeaways)/gm,
    // Scene descriptions
    /^(The scene|This scene|In this|The dialogue|The performance)/gm,
    // Numbered lists
    /^(\d+\.\s+[A-Z])/gm,
    // Script elements
    /^(Character|Setting|Dialogue|Action|Direction)/gm,
  ];

  // Try each pattern to find the best section breaks
  let bestSections: string[] = [];
  let bestPattern: RegExp | null = null;
  let maxSections = 0;

  for (const pattern of sectionPatterns) {
    const sections = normalizedText.split(pattern).filter(Boolean);
    if (sections.length > 1 && sections.length > maxSections) {
      bestSections = sections;
      bestPattern = pattern;
      maxSections = sections.length;
    }
  }

  // If no good section pattern found, try paragraph-based
  if (!bestPattern || bestSections.length < 2) {
    return [];
  }

  // Debug: Log what pattern was found
  console.log(`Found ${bestSections.length} sections using pattern: ${bestPattern}`);
  
  const chunks: TextChunk[] = [];
  let currentOrder = 1;
  let currentStart = 0;

  // Process sections
  for (let i = 0; i < bestSections.length; i += 2) {
    const sectionHeader = bestSections[i]?.trim();
    const sectionContent = bestSections[i + 1]?.trim() || '';
    
    if (!sectionHeader || !sectionContent) continue;

    const fullSection = sectionHeader + '\n\n' + sectionContent;
    const sectionTitle = extractSectionTitle(sectionHeader);
    
    // If section is too long, split it further
    if (fullSection.length > maxChunkLength) {
      const subChunks = splitLongSection(fullSection, maxChunkLength, overlap);
      
      subChunks.forEach((subChunk, index) => {
        const duration = estimateChunkDuration(subChunk);
        chunks.push({
          id: `chunk_${currentOrder}`,
          text: subChunk,
          order: currentOrder,
          start: currentStart,
          duration,
          scene_title: `${sectionTitle} (Part ${index + 1})`
        });
        
        currentStart += duration;
        currentOrder++;
      });
    } else {
      // Section is short enough, use as-is
      const duration = estimateChunkDuration(fullSection);
      chunks.push({
        id: `chunk_${currentOrder}`,
        text: fullSection,
        order: currentOrder,
        start: currentStart,
        duration,
        scene_title: sectionTitle
      });
      
      currentStart += duration;
      currentOrder++;
    }
  }

  return chunks;
}

/**
 * Split text into chunks by intelligent section detection (for complex training documents)
 */
export function chunkTextByIntelligentSections(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const {
    maxChunkLength = 2000,
    overlap = 200,
    minChunkLength = 500
  } = options;

  // Normalize text by reducing multiple spaces and newlines
  const normalizedText = text.replace(/\s{3,}/g, '  ').replace(/\n{3,}/g, '\n\n');

  // Find section headers by looking for specific patterns
  const sectionHeaders = [
    'Scene Context',
    'Performance Details',
    'Audio Cues', 
    'Synthesized Script',
    'Director\'s Takeaways',
    'Training Document',
    'Script Analysis'
  ];

  // Find all section header positions
  const sectionPositions: { header: string; position: number }[] = [];
  
  for (const header of sectionHeaders) {
    const regex = new RegExp(`\\b${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match;
    while ((match = regex.exec(normalizedText)) !== null) {
      sectionPositions.push({
        header: header,
        position: match.index
      });
    }
  }

  // Sort by position
  sectionPositions.sort((a, b) => a.position - b.position);

  if (sectionPositions.length < 2) {
    return [];
  }

  console.log(`Found ${sectionPositions.length} section headers:`, sectionPositions.map(s => s.header));

  const chunks: TextChunk[] = [];
  let currentOrder = 1;
  let currentStart = 0;

  // Create chunks for each section
  for (let i = 0; i < sectionPositions.length; i++) {
    const currentSection = sectionPositions[i];
    const nextSection = sectionPositions[i + 1];
    
    const startPos = currentSection.position;
    const endPos = nextSection ? nextSection.position : normalizedText.length;
    
    const sectionText = normalizedText.substring(startPos, endPos).trim();
    
    if (sectionText.length < minChunkLength) continue;

    const sectionTitle = extractSectionTitle(sectionText);
    
    // If section is too long, split it further
    if (sectionText.length > maxChunkLength) {
      const subChunks = splitLongSection(sectionText, maxChunkLength, overlap);
      
      subChunks.forEach((subChunk, index) => {
        const duration = estimateChunkDuration(subChunk);
        chunks.push({
          id: `chunk_${currentOrder}`,
          text: subChunk,
          order: currentOrder,
          start: currentStart,
          duration,
          scene_title: `${sectionTitle} (Part ${index + 1})`
        });
        
        currentStart += duration;
        currentOrder++;
      });
    } else {
      // Section is short enough, use as-is
      const duration = estimateChunkDuration(sectionText);
      chunks.push({
        id: `chunk_${currentOrder}`,
        text: sectionText,
        order: currentOrder,
        start: currentStart,
        duration,
        scene_title: sectionTitle
      });
      
      currentStart += duration;
      currentOrder++;
    }
  }

  return chunks;
}

/**
 * Extract section title from text
 */
function extractSectionTitle(text: string): string {
  const lines = text.split('\n');
  const firstLine = lines[0]?.trim();
  
  // Section title patterns
  const titlePatterns = [
    /^(Scene Context|Performance Details|Audio Cues|Synthesized Script|Director's Takeaways)/,
    /^(## |### |#### |# )(.+)/,  // Markdown headers
    /^([A-Z][A-Z\s]+[A-Z])/,  // ALL CAPS headers
    /^(Part [0-9]+|Chapter [0-9]+|Section [0-9]+)/,
    /^(Introduction|Overview|Summary|Conclusion|Notes|Takeaways)/,
    /^(The scene|This scene|In this|The dialogue|The performance)/,
    /^(\d+\.\s+[A-Z].+)/,  // Numbered lists
    /^(Character|Setting|Dialogue|Action|Direction)/,
  ];
  
  // Check first line
  if (firstLine) {
    for (const pattern of titlePatterns) {
      const match = firstLine.match(pattern);
      if (match) {
        return match[2] || match[1] || firstLine;
      }
    }
  }
  
  // Try to find section header in first few lines
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim();
    for (const pattern of titlePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        return match[2] || match[1] || trimmed;
      }
    }
  }
  
  // Generate meaningful fallback
  const words = text.split(/\s+/).slice(0, 5).join(' ');
  return words.length > 50 ? words.substring(0, 50) + '...' : words || `Section ${Date.now()}`;
}

/**
 * Split a long section into smaller chunks
 */
function splitLongSection(
  section: string, 
  maxLength: number, 
  overlap: number
): string[] {
  const chunks: string[] = [];
  let remaining = section;
  
  while (remaining.length > maxLength) {
    const breakPoint = findGoodBreakPoint(remaining, maxLength, 500);
    chunks.push(remaining.substring(0, breakPoint));
    remaining = remaining.substring(breakPoint - overlap);
  }
  
  if (remaining.trim().length > 0) {
    chunks.push(remaining);
  }
  
  return chunks;
}

/**
 * Main chunking function - intelligent scene detection with multiple fallback strategies
 */
export function chunkText(
  text: string, 
  options: ChunkingOptions = {}
): TextChunk[] {
  let chunks: TextChunk[] = [];
  
  // Strategy 1: Try intelligent section-based chunking first (for training documents)
  const intelligentSectionChunks = chunkTextByIntelligentSections(text, options);
  
  // If we got reasonable chunks, use them
  if (intelligentSectionChunks.length > 0 && intelligentSectionChunks.every(c => c.text.length > 100)) {
    chunks = intelligentSectionChunks;
  } else {
    // Strategy 2: Try regular section-based chunking
    const sectionChunks = chunkTextBySections(text, options);
    
    // If we got reasonable chunks, use them
    if (sectionChunks.length > 0 && sectionChunks.every(c => c.text.length > 100)) {
      chunks = sectionChunks;
    } else {
      // Strategy 3: Try scene-based chunking (for screenplays)
      const sceneChunks = chunkTextByScenes(text, options);
      
      // If we got reasonable chunks, use them
      if (sceneChunks.length > 0 && sceneChunks.every(c => c.text.length > 100)) {
        chunks = sceneChunks;
      } else {
        // Strategy 4: Try paragraph-based chunking (double newlines)
        const paragraphChunks = chunkTextByParagraphs(text, options);
        if (paragraphChunks.length > 0 && paragraphChunks.every(c => c.text.length > 100)) {
          chunks = paragraphChunks;
        } else {
          // Strategy 5: Try sentence-based chunking (period-based)
          const sentenceChunks = chunkTextBySentences(text, options);
          if (sentenceChunks.length > 0 && sentenceChunks.every(c => c.text.length > 100)) {
            chunks = sentenceChunks;
          } else {
            // Strategy 6: Fall back to length-based chunking
            chunks = chunkTextByLength(text, options);
          }
        }
      }
    }
  }
  
  // Ensure proper start time sequencing
  return recalculateStartTimes(chunks);
}
