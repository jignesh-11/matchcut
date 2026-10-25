/**
 * Serverless API Route: /api/generate
 *
 * Provides a secure, server-side AI text generation endpoint for MatchCut.
 * - API keys are strictly kept server-side (supports single key or comma-separated key pool with round-robin rotation).
 * - Automatic retry and failover across keys on 429 (rate-limit) or 403/400 (quota/leaked).
 * - 100% self-contained with no relative imports to src/, guaranteeing clean execution in Vercel Node ESM runtime.
 */

export type AITone =
  | 'cinematic'
  | 'motivational'
  | 'dark'
  | 'emotional'
  | 'minimal'
  | 'dramatic'
  | 'bold'
  | 'romantic'
  | 'funny'
  | 'inspirational'
  | 'custom';

export type AILength = 'ultra-short' | 'short' | 'medium' | 'long';
export type AIMode = 'sentences' | 'script';

export interface AIGenerationOptions {
  prompt: string;
  tone?: AITone;
  customTone?: string;
  length?: AILength;
  count?: number;
  mode?: AIMode;
  apiKey?: string;
}

export interface AIGeneratedSentence {
  id: string;
  text: string;
  tone: string;
  suggestedAnchor: string;
}

export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  error?: string;
}

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
      apiKey: typeof input.apiKey === 'string' ? input.apiKey : '',
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

// Simple in-memory sliding window rate limiter
const ipRequestHistory = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipRequestHistory.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  recent.push(now);
  ipRequestHistory.set(ip, recent);

  // Periodically clean up old IPs
  if (ipRequestHistory.size > 1000) {
    for (const [k, v] of ipRequestHistory.entries()) {
      if (v.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) {
        ipRequestHistory.delete(k);
      }
    }
  }

  return false;
}

function sendResponse(
  res: any,
  statusCode: number,
  data: Record<string, unknown>
): void {
  if (typeof res.status === 'function' && typeof res.json === 'function') {
    res.status(statusCode).json(data);
  } else {
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, max-age=0',
    });
    res.end(JSON.stringify(data));
  }
}

// Global rotating key index across requests
let globalKeyIndex = 0;

function parseKeyPool(rawKeys: string | undefined): string[] {
  if (!rawKeys) return [];
  return rawKeys
    .split(/[,;\n]+/)
    .map((k) => k.trim())
    .filter((k) => k.length > 0);
}

export default async function handler(req: any, res: any) {
  // 1. Enforce POST method
  if (req.method !== 'POST') {
    return sendResponse(res, 405, {
      success: false,
      error: 'Method Not Allowed. Use POST for AI text generation.',
    });
  }

  // 2. Rate limiting check
  const clientIp =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'anonymous';

  if (isRateLimited(clientIp)) {
    return sendResponse(res, 429, {
      success: false,
      error: 'Rate limit exceeded. Please wait a moment before generating more text.',
    });
  }

  // 3. Parse and validate request body
  let rawBody = req.body;
  if (typeof rawBody === 'string') {
    try {
      rawBody = JSON.parse(rawBody);
    } catch {
      return sendResponse(res, 400, {
        success: false,
        error: 'Invalid JSON request payload.',
      });
    }
  }

  const validation = validateGenerationOptions(rawBody);
  if (!validation.valid || !validation.data) {
    return sendResponse(res, 400, {
      success: false,
      error: validation.error || 'Invalid generation request parameters.',
    });
  }

  const options = validation.data;

  // 4. Extract API Key Pool (Client-provided or Server Environment)
  const clientKeys = parseKeyPool(
    (req.headers['x-api-key'] as string) ||
    (typeof rawBody.apiKey === 'string' ? rawBody.apiKey : '')
  );

  const envKeys = parseKeyPool(
    process.env.AI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.OPENAI_API_KEY
  );

  const keyPool = clientKeys.length > 0 ? clientKeys : envKeys;

  if (keyPool.length === 0) {
    return sendResponse(res, 503, {
      success: false,
      error:
        'AI generation is not configured. Please enter your free Gemini API key in the editor panel or set AI_API_KEY in server environment variables.',
    });
  }

  const systemPrompt = buildSystemPrompt(options);
  const userPrompt = `Concept / Mood: "${options.prompt}".`;

  // Rotate starting key to distribute requests evenly across available keys
  const startIndex = globalKeyIndex++ % keyPool.length;
  const maxAttempts = Math.min(keyPool.length, 9);
  let lastError = '';

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const apiKey = keyPool[(startIndex + attempt) % keyPool.length];

    // Auto-detect provider for this key
    let provider = (process.env.AI_PROVIDER || '').toLowerCase();
    if (!provider) {
      if (apiKey.startsWith('AIzaSy') || process.env.GEMINI_API_KEY) {
        provider = 'gemini';
      } else if (apiKey.startsWith('gsk_')) {
        provider = 'groq';
      } else {
        provider = 'openai';
      }
    } else if (apiKey.startsWith('AIzaSy')) {
      provider = 'gemini';
    }

    // For Gemini: provide seamless fallback models if a model encounters 503 high demand
    const GEMINI_MODELS = [
      process.env.AI_MODEL || 'gemini-2.5-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
    ];

    const model =
      provider === 'gemini'
        ? GEMINI_MODELS[attempt % GEMINI_MODELS.length]
        : (process.env.AI_MODEL || 'gpt-4o-mini');

    const baseUrl =
      process.env.AI_BASE_URL ||
      (provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : provider === 'gemini'
        ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
            apiKey
          )}`
        : 'https://api.openai.com/v1/chat/completions');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      let rawContent = '';

      if (provider === 'gemini') {
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
              thinkingConfig: {
                thinkingBudget: 0,
              },
            },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorJson = (await response.json().catch(() => null)) as any;
          const errorDetail =
            errorJson?.error?.message ||
            `Gemini API returned error code ${response.status}.`;

          // If key/model fails due to high demand (503), rate limit (429), or key-specific issues (403, 401, 400), rotate to next key and model
          if (attempt + 1 < maxAttempts) {
            console.warn(`Key attempt ${attempt + 1}/${maxAttempts} (${model}) failed with ${response.status} (${errorDetail}), rotating to next key/model in pool...`);
            lastError = errorDetail;
            continue;
          }

          console.error('Gemini Provider error:', response.status, errorDetail);
          return sendResponse(res, response.status >= 500 ? 502 : 400, {
            success: false,
            error: errorDetail,
          });
        }

        const json = (await response.json()) as any;
        rawContent = json.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!rawContent) {
          const finishReason = json.candidates?.[0]?.finishReason;
          if (attempt + 1 < maxAttempts) {
            console.warn(`Attempt ${attempt + 1}/${maxAttempts} returned empty content (${finishReason}), rotating to next key/model in pool...`);
            continue;
          }
          return sendResponse(res, 502, {
            success: false,
            error: finishReason
              ? `Gemini stopped response with reason: ${finishReason}`
              : 'Gemini returned an empty response. Please try a different prompt.',
          });
        }
      } else {
        // OpenAI-compatible format
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 600,
            response_format: { type: 'json_object' },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorJson = (await response.json().catch(() => null)) as any;
          const errorDetail =
            errorJson?.error?.message ||
            `Provider error (${response.status}). Please check API key configuration.`;

          if (attempt + 1 < maxAttempts) {
            console.warn(`API key attempt ${attempt + 1}/${maxAttempts} failed with ${response.status} (${errorDetail}), rotating to next key in pool...`);
            lastError = errorDetail;
            continue;
          }

          console.error('OpenAI-compatible provider error:', response.status, errorDetail);
          return sendResponse(res, response.status >= 500 ? 502 : 400, {
            success: false,
            error: errorDetail,
          });
        }

        const json = (await response.json()) as any;
        rawContent = json.choices?.[0]?.message?.content || '';
      }

      // Parse and validate AI output
      const results = parseAndValidateAIResponse(
        rawContent,
        options.tone,
        options.count
      );

      if (results.length === 0) {
        return sendResponse(res, 502, {
          success: false,
          error:
            'The AI model returned an unparseable response. Please retry with a slightly different prompt.',
        });
      }

      return sendResponse(res, 200, {
        success: true,
        results,
        count: results.length,
        provider: provider === 'gemini' ? `Google Gemini (${model})` : model,
      });
    } catch (err: any) {
      clearTimeout(timeoutId);

      if (err.name === 'AbortError') {
        return sendResponse(res, 504, {
          success: false,
          error: 'The AI service timed out. Please try a shorter prompt or retry.',
        });
      }

      console.error('Server error during text generation:', err.message);
      lastError = err.message || 'Network error';
    }
  }

  return sendResponse(res, 500, {
    success: false,
    error: lastError || 'An unexpected error occurred while generating text across available keys.',
  });
}
