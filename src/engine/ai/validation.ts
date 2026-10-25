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
 * Extracts and cleans words from a sentence to identify sensible candidate anchor words
 */
export function findBestAnchorWord(sentence: string): string {
  // Extract words stripped of surrounding punctuation
  const words = sentence
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
    .filter((w) => w.length > 0);

  if (words.length === 0) return 'MATCH';

  // Common stop words to deprioritize
  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'it', 'in', 'on', 'at', 'to',
    'for', 'of', 'with', 'by', 'from', 'up', 'down', 'my', 'your', 'his', 'her',
    'its', 'our', 'their', 'this', 'that', 'these', 'those', 'am', 'are', 'was', 'were'
  ]);

  // Prefer meaningful words with 3+ characters that are not common stop words
  const contentWords = words.filter((w) => !stopWords.has(w.toLowerCase()) && w.length >= 3);
  if (contentWords.length > 0) {
    // Return the strongest visual or most salient word (often the longest content word)
    return contentWords.reduce((best, cur) => (cur.length > best.length ? cur : best), contentWords[0]);
  }

  return words[0];
}

/**
 * Verifies if an anchor word actually appears in the text; if not, finds a valid anchor word
 */
export function validateOrResolveAnchor(text: string, candidateAnchor?: string): string {
  if (candidateAnchor && typeof candidateAnchor === 'string') {
    const cleanCandidate = candidateAnchor.trim().replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
    if (cleanCandidate.length > 0) {
      // Check if candidate exists in text (case-insensitive word or substring)
      const escaped = cleanCandidate.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text) || text.toLowerCase().includes(cleanCandidate.toLowerCase())) {
        return cleanCandidate;
      }
    }
  }

  return findBestAnchorWord(text);
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
    return `You are a world-class creative copywriter specializing in rapid kinetic typography and match-cut video scripts.
Your task is to write a cohesive, narrative sequence of ${count} short sequential lines that tell a compelling story together.

Style & Tone Guidelines:
- Tone: ${effectiveTone}.
- Line length: ${lengthGuide}
- Narrative flow: Each line builds upon the previous, creating a dynamic, rhythmic story progression for video cuts.
- Impact: Highly punchy, emotionally resonant, visually evocative words.
- Rhythm: Great for fast, dynamic typography on TikTok, Reels, and Shorts.
- Prohibitions: NO hashtags, NO emojis, NO conversational commentary ("Here is your script"), NO explanations.
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
