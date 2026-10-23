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

export type AILength = 'ultra-short' | 'short' | 'medium';
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

export const VALID_LENGTHS: AILength[] = ['ultra-short', 'short', 'medium'];
export const VALID_COUNTS = [5, 8, 10];
export const MAX_PROMPT_LENGTH = 1000;

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
 * Extracts and cleans words from a sentence to identify sensible candidate anchor words
 */
export function findBestAnchorWord(sentence: string): string {
  const words = sentence
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
    .filter((w) => w.length > 0);

  if (words.length === 0) return 'MATCH';

  const stopWords = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'is', 'it', 'in', 'on', 'at', 'to',
    'for', 'of', 'with', 'by', 'from', 'up', 'down', 'my', 'your', 'his', 'her',
    'its', 'our', 'their', 'this', 'that', 'these', 'those', 'am', 'are', 'was', 'were'
  ]);

  const contentWords = words.filter((w) => !stopWords.has(w.toLowerCase()) && w.length >= 3);
  if (contentWords.length > 0) {
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
      : length === 'medium'
      ? 'Medium: 6 to 12 words per sentence.'
      : 'Short: 3 to 7 words per sentence.';

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
- Variety: Provide distinct creative angles and phrase structures, not just minor word swaps.
- Impact: Strong verbs, striking imagery, memorable cadence suitable for bold screen typography.
- Prohibitions: NO hashtags, NO emojis, NO conversational filler ("Here are your quotes:"), NO markdown fences outside of JSON.
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

    const model =
      process.env.AI_MODEL ||
      (provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini');

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

          // If key fails due to rate limit (429) or key-specific authorization/quota/leaked issues, try next key in pool
          if ((response.status === 429 || response.status === 403 || response.status === 401 || response.status === 400) && attempt + 1 < maxAttempts) {
            console.warn(`Key attempt ${attempt + 1}/${maxAttempts} failed with ${response.status} (${errorDetail}), rotating to next key in pool...`);
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

          if ((response.status === 429 || response.status === 403 || response.status === 401 || response.status === 400) && attempt + 1 < maxAttempts) {
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
        provider: provider === 'gemini' ? 'Google Gemini 2.5 Flash' : model,
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
