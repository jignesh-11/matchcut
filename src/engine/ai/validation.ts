import { AIGeneratedSentence, AIGenerationOptions, AILength, AIMode, AITone } from '../../types/ai';

export const VALID_TONES: AITone[] = [
  'cinematic',
  'motivational',
  'dark',
  'emotional',
  'minimal',
  'dramatic',
  'bold',
  'romantic',
  'funny',
  'inspirational',
  'custom',
];

export const VALID_LENGTHS: AILength[] = ['ultra-short', 'short', 'medium', 'long'];
export const VALID_COUNTS = [5, 8, 10];
export const MAX_PROMPT_LENGTH = 3000;

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  error?: string;
}

/**
 * Validates incoming AI generation request parameters
 */
export function validateGenerationOptions(raw: unknown): ValidationResult<Required<AIGenerationOptions>> {
  if (!raw || typeof raw !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  const input = raw as Partial<AIGenerationOptions>;

  // 1. Validate prompt
  if (typeof input.prompt !== 'string' || input.prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt is required and cannot be empty.' };
  }

  const trimmedPrompt = input.prompt.trim();
  if (trimmedPrompt.length > MAX_PROMPT_LENGTH) {
    return {
      valid: false,
      error: `Prompt exceeds maximum allowed length of ${MAX_PROMPT_LENGTH} characters.`,
    };
  }

  // 2. Validate tone
  let tone: AITone = 'cinematic';
  if (input.tone && VALID_TONES.includes(input.tone)) {
    tone = input.tone;
  }

  let customTone = input.customTone?.trim() || '';
  if (tone === 'custom' && !customTone) {
    customTone = 'cinematic';
  }

  // 3. Validate length
  let length: AILength = 'short';
  if (input.length && VALID_LENGTHS.includes(input.length)) {
    length = input.length;
  }

  // 4. Validate count
  let count = 5;
  if (typeof input.count === 'number' && VALID_COUNTS.includes(input.count)) {
    count = input.count;
  } else if (typeof input.count === 'number') {
    // Clamp to closest valid count
    count = input.count >= 9 ? 10 : input.count >= 7 ? 8 : 5;
  }

  // 5. Validate mode
  const mode: AIMode = input.mode === 'script' ? 'script' : 'sentences';

  return {
    valid: true,
    data: {
      prompt: trimmedPrompt,
      tone,
      customTone,
      length,
      count,
      mode,
    },
  };
}

/**
 * Extracts and cleans words from a sentence to identify sensible candidate anchor words.
 * Prioritizes visually striking, high-impact content words (nouns, action verbs)
 * while filtering out weak stop words, pronouns, and auxiliary verbs.
 */
export function findBestAnchorWord(sentence: string): string {
  // Extract words stripped of surrounding punctuation
  const words = sentence
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
    .filter((w) => w.length > 0);

  if (words.length === 0) return 'MATCH';

  // Comprehensive stop words, prepositions, pronouns, auxiliary verbs, and weak fillers
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'nor', 'so', 'yet',
    'is', 'it', 'its', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as',
    'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'my', 'your', 'his', 'her', 'our', 'their', 'this', 'that', 'these', 'those',
    'am', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing',
    'can', 'could', 'will', 'would', 'shall', 'should', 'may', 'might', 'must',
    'i', 'me', 'we', 'us', 'you', 'he', 'him', 'she', 'they', 'them', 'what', 'which', 'who', 'whom',
    'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'not', 'only', 'own', 'same', 'too', 'very', 'just', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'against', 'here', 'there', 'about'
  ]);

  // Preferred high-value typography anchor words: nouns and strong action verbs (3+ chars)
  const contentWords = words.filter((w) => !stopWords.has(w.toLowerCase()) && w.length >= 3);
  if (contentWords.length > 0) {
    // Score candidate words: length sweet spot (4-9 chars), visual prominence, and capitalization
    const scored = contentWords.map((word) => {
      let score = 0;
      const len = word.length;
      if (len >= 4 && len <= 9) score += 6;
      else if (len >= 3) score += 3;
      if (/^[A-Z][a-z]+$/.test(word)) score += 2;
      return { word, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0].word;
  }

  return words.find((w) => w.length >= 3) || words[0];
}

/**
 * Verifies if an anchor word actually appears in the text using strict whole-word boundaries.
 * Prevents accidental substring matching inside unrelated words (e.g. "in" matching inside "silence").
 */
export function validateOrResolveAnchor(text: string, candidateAnchor?: string): string {
  if (candidateAnchor && typeof candidateAnchor === 'string') {
    const cleanCandidate = candidateAnchor.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    if (cleanCandidate.length > 0) {
      // Must match as an entire standalone word with word boundary, not an accidental partial substring
      const escaped = cleanCandidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const wordRegex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (wordRegex.test(text)) {
        const match = text.match(wordRegex);
        return match ? match[0].replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '') : cleanCandidate;
      }
    }
  }

  return findBestAnchorWord(text);
}

/**
 * Detects if a common anchor word recurs across multiple lines of a multi-cut script.
 * If a recurring anchor is found, it makes a premier match-cut anchor for kinetic transitions.
 */
export function findBestScriptAnchor(lines: string[]): string {
  if (lines.length === 0) return 'MATCH';
  if (lines.length === 1) return findBestAnchorWord(lines[0]);

  // Count occurrences of content words across distinct lines
  const lineWordSets = lines.map((line) => {
    const words = line
      .split(/\s+/)
      .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '').toLowerCase())
      .filter((w) => w.length >= 3);
    return new Set(words);
  });

  const wordFrequency = new Map<string, number>();
  for (const set of lineWordSets) {
    for (const word of set) {
      wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
    }
  }

  // Find candidate that appears in the most lines (at least 2)
  let bestWord = '';
  let maxCount = 1;

  for (const [word, count] of wordFrequency.entries()) {
    const testAnchor = findBestAnchorWord(word);
    if (testAnchor.toLowerCase() === word && count > maxCount) {
      maxCount = count;
      bestWord = word;
    }
  }

  if (bestWord) {
    for (const line of lines) {
      const match = line.match(new RegExp(`\\b${bestWord}\\b`, 'i'));
      if (match) return match[0];
    }
    return bestWord;
  }

  return findBestAnchorWord(lines[0]);
}

/**
 * Builds the creative copywriter system prompt for the AI model
 */
export function buildSystemPrompt(options: Required<AIGenerationOptions>): string {
  const { tone, customTone, length, count, mode } = options;
  const effectiveTone = tone === 'custom' ? customTone : tone;

  const lengthGuide =
    length === 'ultra-short'
      ? 'Ultra-short: 1 to 4 words per sentence.'
      : length === 'short'
      ? 'Short: 3 to 7 words per sentence.'
      : length === 'long'
      ? 'Long / Extended: 10 to 20 words per sentence with rich poetic or cinematic depth.'
      : 'Medium: 6 to 12 words per sentence.';

  if (mode === 'script') {
    return `You are a world-class creative copywriter and director specializing in rapid kinetic typography and match-cut video scripts.
Your task is to write a cohesive, narrative sequence of exactly ${count} sequential lines that tell a compelling story together across video cuts.

Narrative Arc & Structure:
- Beginning (Cut 1): Establish the hook, setup, or baseline reality.
- Development (Middle Cuts): Build tension, momentum, or transformation. Every cut must introduce a new beat and push the story forward.
- Ending (Final Cut): Deliver a punchy, memorable, and satisfying final beat or climax.
- Continuity: Maintain seamless narrative flow between cuts without abrupt, nonsensical leaps.
- Formatting Integrity: Do NOT split an arbitrary sentence or paragraph randomly across cuts. Each line must be a complete, self-contained kinetic typography statement or beat that reads rhythmically on screen.
- Repetition: Avoid repeating the same words or phrases across cuts unless deliberate repetition (e.g. anaphora) is used as an intentional artistic device.
- Match-Cut Anchor Selection: For each line, select a strong, visually evocative "suggestedAnchor" word that actually appears inside its line. Where natural, prefer words that could form a recurring visual anchor.

Style & Tone Guidelines:
- Tone: ${effectiveTone}.
- Line length: ${lengthGuide}
- Impact: Highly punchy, emotionally resonant, visually evocative words tailored for rapid kinetic typography.
- Prohibitions: NO hashtags, NO emojis, NO conversational commentary ("Here is your script"), NO explanations, NO markdown fences outside of JSON.
- Output Format: You MUST return a single valid JSON object strictly matching this schema:
{
  "results": [
    {
      "id": "1",
      "text": "Exact line text here.",
      "suggestedAnchor": "A single prominent word from this line"
    }
  ]
}
Each "suggestedAnchor" MUST be a word that actually appears inside its corresponding "text".
Return exactly ${count} results.`;
  }

  return `You are a world-class creative copywriter specializing in kinetic typography and match-cut video quotes.
Your task is to generate ${count} distinct, punchy sentence variations based on the user's concept.

Style & Tone Guidelines:
- Tone: ${effectiveTone}.
- Target length: ${lengthGuide}
- Standalone Independence: Each generated sentence MUST be completely self-contained and independently usable on its own. Do NOT force a story arc, chronological sequence, or narrative progression into standalone quotes. Treat each quote as an individual, self-sufficient creative option.
- Variety: Provide distinct creative angles, metaphors, and phrase structures, not sequential story beats or minor word swaps.
- Impact: Strong verbs, striking imagery, memorable cadence suitable for bold screen typography.
- Match-Cut Anchor Selection: For each quote, choose a prominent, visually meaningful content word (e.g. noun or action verb) that actually appears in the text.
- Prohibitions: NO hashtags, NO emojis, NO conversational filler ("Here are your quotes:"), NO markdown fences outside of JSON, NO story arcs or chronological linking between quotes.
- Output Format: You MUST return a single valid JSON object strictly matching this schema:
{
  "results": [
    {
      "id": "1",
      "text": "Impactful sentence here.",
      "suggestedAnchor": "A prominent word from this sentence"
    }
  ]
}
Each "suggestedAnchor" MUST be an exact word that appears inside its corresponding "text".
Return exactly ${count} results.`;
}

/**
 * Parses and sanitizes the AI model's response string into structured results
 */
export function parseAndValidateAIResponse(
  rawText: string,
  tone: string,
  requestedCount: number
): AIGeneratedSentence[] {
  let cleaned = rawText.trim();

  // Strip markdown code fences if present (e.g. ```json ... ```)
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    // If strict JSON parsing failed, try extracting JSON substring between { and }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
      } catch {
        parsed = null;
      }
    }
  }

  const results: AIGeneratedSentence[] = [];
  const seenTexts = new Set<string>();

  if (parsed && typeof parsed === 'object') {
    const rawArray = Array.isArray((parsed as Record<string, unknown>).results)
      ? ((parsed as Record<string, unknown>).results as unknown[])
      : Array.isArray((parsed as Record<string, unknown>).sentences)
      ? ((parsed as Record<string, unknown>).sentences as unknown[])
      : Array.isArray(parsed)
      ? (parsed as unknown[])
      : [];

    for (let i = 0; i < rawArray.length; i++) {
      const item = rawArray[i];
      let sentenceText = '';
      let candidateAnchor = '';

      if (typeof item === 'string') {
        sentenceText = item;
      } else if (item && typeof item === 'object') {
        const itemObj = item as Record<string, unknown>;
        sentenceText = typeof itemObj.text === 'string' ? itemObj.text : '';
        candidateAnchor = typeof itemObj.suggestedAnchor === 'string' ? itemObj.suggestedAnchor : '';
      }

      const cleanText = sentenceText.trim().replace(/^["']|["']$/g, '');
      if (cleanText.length < 2) continue;

      // Deduplicate case-insensitively
      const lower = cleanText.toLowerCase();
      if (seenTexts.has(lower)) continue;
      seenTexts.add(lower);

      const anchor = validateOrResolveAnchor(cleanText, candidateAnchor);

      results.push({
        id: `res-${results.length + 1}-${Date.now()}`,
        text: cleanText,
        tone,
        suggestedAnchor: anchor,
      });

      if (results.length >= requestedCount) break;
    }
  }

  // Fallback: If JSON parsing yielded no items, parse line by line
  if (results.length === 0) {
    const lines = cleaned
      .split(/\r?\n/)
      .map((line) => line.replace(/^[\d\-\*\.\)\s]+/, '').replace(/^["']|["']$/g, '').trim())
      .filter((line) => line.length >= 3 && !line.startsWith('{') && !line.startsWith('}'));

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (seenTexts.has(lower)) continue;
      seenTexts.add(lower);

      results.push({
        id: `res-${results.length + 1}-${Date.now()}`,
        text: line,
        tone,
        suggestedAnchor: findBestAnchorWord(line),
      });

      if (results.length >= requestedCount) break;
    }
  }

  return results;
}
