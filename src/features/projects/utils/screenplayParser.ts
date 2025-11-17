/**
 * Screenplay Parser
 * Parses raw screenplay text into typed blocks for proper formatting
 */

export type ScreenplayBlockType =
  | 'scene_heading'
  | 'character'
  | 'parenthetical'
  | 'dialogue'
  | 'action'
  | 'transition'
  | 'blank';

export interface ScreenplayBlock {
  type: ScreenplayBlockType;
  text: string;
  lineIndex: number;
}

/**
 * Detects if a line is a scene heading (INT., EXT., INT./EXT., I.E., etc.)
 * Scene headings can be multi-part like "ISRAEL - U.S. ARMY BASE - MEDICAL TENT (4 YEARS AGO)"
 */
function isSceneHeading(line: string): boolean {
  const trimmed = line.trim();
  
  // Primary: starts with location prefix
  const startsWithLocation = /^(INT\.?|EXT\.?|INT\.?\/EXT\.?|I\.E\.|E\.I\.)/.test(trimmed);
  if (startsWithLocation) return true;
  
  // Fallback: all-caps lines with dash separators and optional time/parens
  // Matches: "ISRAEL - U.S. ARMY BASE - MEDICAL TENT (4 YEARS AGO)"
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 10) {
    // Contains location separators (dashes) and may end with time or (parens)
    const hasLocationPattern = /[A-Z0-9\s]+-[A-Z0-9\s\-]+/.test(trimmed);
    const hasTimeOrParen = /(DAY|NIGHT|MORNING|AFTERNOON|EVENING|LATER|CONTINUOUS|CONT'D|\(\d+\s+YEARS?\s+AGO\)|\(|-)$/i.test(trimmed);
    return hasLocationPattern && (hasTimeOrParen || trimmed.split('-').length >= 2);
  }
  
  return false;
}

/**
 * Detects if a line is a transition (FADE OUT, CUT TO:, DISSOLVE TO:, etc.)
 */
function isTransition(line: string): boolean {
  const trimmed = line.trim();
  // Common transition patterns - must be uppercase and match transition keywords
  const transitionPattern = /^(FADE (OUT|IN|TO BLACK)?\.?|CUT TO:?|DISSOLVE TO:?|MATCH CUT TO:?|SMASH CUT TO:?|WIPE TO:?|FLASHBACK TO:?|FLASH TO:?|BACK TO:?)$/i;
  return trimmed === trimmed.toUpperCase() && 
         transitionPattern.test(trimmed) && 
         trimmed.length < 50;
}

/**
 * Detects if a line is a character cue (short uppercase line, may include parentheticals)
 * Examples: "STACY", "LUCKY", "SOLDIER (O.S.)", "STACY (CONT'D)", "SOLDIER (o.s.)", "SCOUT"
 */
function isCharacterCue(line: string): boolean {
  const trimmed = line.trim();
  
  // Must be uppercase (but allow lowercase in parentheticals)
  const withoutParens = trimmed.replace(/\([^)]+\)/g, '').trim();
  if (withoutParens !== withoutParens.toUpperCase()) return false;
  
  // Character names are typically short (1-30 characters without parentheticals)
  if (withoutParens.length === 0 || withoutParens.length > 30) return false;
  
  // Should not be a full transition line (anchored to avoid rejecting names like "SCOUT")
  const fullTransitionPattern = /^(FADE (OUT|IN|TO BLACK)?\.?|CUT TO:?|DISSOLVE TO:?|MATCH CUT TO:?|SMASH CUT TO:?|WIPE TO:?|FLASHBACK TO:?|FLASH TO:?|BACK TO:?)$/i;
  if (fullTransitionPattern.test(trimmed)) return false;
  
  // Should not be a scene heading
  if (isSceneHeading(line)) return false;
  
  return true;
}

/**
 * Detects if a line is a parenthetical (wrapped in parentheses)
 * Examples: "(to self)", "(beat)", "(shakes head)"
 */
function isParenthetical(line: string): boolean {
  const trimmed = line.trim();
  return /^\([^)]+\)$/.test(trimmed);
}

/**
 * Parse screenplay into structured blocks
 */
export function parseScreenplayLines(script: string): ScreenplayBlock[] {
  const lines = script.split('\n');
  const blocks: ScreenplayBlock[] = [];
  
  let currentDialogueCharacter: string | null = null;
  let blankLinesSinceContent = 0;
  
  lines.forEach((line, lineIndex) => {
    const trimmed = line.trim();
    
    // Blank line - preserve dialogue context (don't reset until we see a structural break)
    if (!trimmed) {
      blocks.push({
        type: 'blank',
        text: line,
        lineIndex
      });
      blankLinesSinceContent++;
      // Reset dialogue after 2+ consecutive blank lines (paragraph break)
      if (blankLinesSinceContent >= 2) {
        currentDialogueCharacter = null;
      }
      return;
    }
    
    blankLinesSinceContent = 0;
    
    // Scene heading - always resets dialogue
    if (isSceneHeading(line)) {
      blocks.push({
        type: 'scene_heading',
        text: line,
        lineIndex
      });
      currentDialogueCharacter = null;
      return;
    }
    
    // Transition - always resets dialogue
    if (isTransition(line)) {
      blocks.push({
        type: 'transition',
        text: line,
        lineIndex
      });
      currentDialogueCharacter = null;
      return;
    }
    
    // Character cue - starts new dialogue block
    if (isCharacterCue(line)) {
      blocks.push({
        type: 'character',
        text: line,
        lineIndex
      });
      currentDialogueCharacter = trimmed;
      return;
    }
    
    // Parenthetical (only valid after character cue or during dialogue)
    if (isParenthetical(line) && currentDialogueCharacter) {
      blocks.push({
        type: 'parenthetical',
        text: line,
        lineIndex
      });
      return;
    }
    
    // Dialogue (follows character cue, continues until structural break)
    if (currentDialogueCharacter) {
      blocks.push({
        type: 'dialogue',
        text: line,
        lineIndex
      });
      return;
    }
    
    // Default: action (resets any lingering dialogue context)
    blocks.push({
      type: 'action',
      text: line,
      lineIndex
    });
    currentDialogueCharacter = null;
  });
  
  return blocks;
}
