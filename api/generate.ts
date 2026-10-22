import {
  buildSystemPrompt,
  parseAndValidateAIResponse,
  validateGenerationOptions,
} from '../src/engine/ai/validation';

// Simple in-memory sliding window rate limiter
// Note: In serverless environments, state is isolated per instance.
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
            max_tokens: 800,
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
