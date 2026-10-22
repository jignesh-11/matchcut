import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import handler from '../../api/generate';

describe('Serverless API Route: /api/generate', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  function createMockReqRes(method: string, body: any) {
    const req = {
      method,
      body,
      headers: {
        'x-forwarded-for': '127.0.0.1',
      },
    };

    let statusCode = 200;
    let responseData: any = null;

    const res = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        responseData = data;
        return this;
      },
      writeHead(code: number) {
        statusCode = code;
        return this;
      },
      end(str: string) {
        try {
          responseData = JSON.parse(str);
        } catch {
          responseData = str;
        }
      },
      getStatusCode() {
        return statusCode;
      },
      getData() {
        return responseData;
      },
    };

    return { req, res };
  }

  it('should reject non-POST requests with 405 Method Not Allowed', async () => {
    const { req, res } = createMockReqRes('GET', {});
    await handler(req, res);

    expect(res.getStatusCode()).toBe(405);
    expect(res.getData().success).toBe(false);
    expect(res.getData().error).toContain('Method Not Allowed');
  });

  it('should reject empty prompt with 400 Bad Request', async () => {
    const { req, res } = createMockReqRes('POST', { prompt: '   ' });
    await handler(req, res);

    expect(res.getStatusCode()).toBe(400);
    expect(res.getData().success).toBe(false);
    expect(res.getData().error).toContain('Prompt is required');
  });

  it('should reject prompt exceeding 1000 characters with 400 Bad Request', async () => {
    const { req, res } = createMockReqRes('POST', { prompt: 'x'.repeat(1001) });
    await handler(req, res);

    expect(res.getStatusCode()).toBe(400);
    expect(res.getData().success).toBe(false);
    expect(res.getData().error).toContain('exceeds maximum allowed length');
  });

  it('should return 503 if AI_API_KEY is not configured on the server', async () => {
    delete process.env.AI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    const { req, res } = createMockReqRes('POST', { prompt: 'Build something great' });
    await handler(req, res);

    expect(res.getStatusCode()).toBe(503);
    expect(res.getData().success).toBe(false);
    expect(res.getData().error).toContain('AI generation is not configured');
  });

  it('should successfully return parsed and validated sentences when provider returns valid response', async () => {
    process.env.AI_API_KEY = 'mock-test-key';

    const mockApiResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              results: [
                { id: '1', text: 'Built in silence.', suggestedAnchor: 'silence' },
                { id: '2', text: 'Nobody noticed.', suggestedAnchor: 'noticed' },
                { id: '3', text: 'Still I built.', suggestedAnchor: 'built' },
              ],
            }),
          },
        },
      ],
    };

    // Mock global fetch
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
      text: async () => JSON.stringify(mockApiResponse),
    } as any);

    const { req, res } = createMockReqRes('POST', {
      prompt: 'Developer launching app in silence',
      tone: 'cinematic',
      length: 'short',
      count: 3,
    });

    await handler(req, res);

    expect(res.getStatusCode()).toBe(200);
    const data = res.getData();
    expect(data.success).toBe(true);
    expect(data.results.length).toBe(3);
    expect(data.results[0].text).toBe('Built in silence.');
    expect(data.results[0].suggestedAnchor.toLowerCase()).toBe('silence');

    // Ensure API key was not leaked in response
    expect(JSON.stringify(data)).not.toContain('mock-test-key');

    fetchSpy.mockRestore();
  });

  it('should gracefully handle provider HTTP error (500) without exposing secret keys', async () => {
    process.env.AI_API_KEY = 'secret-api-key-999';

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal provider outage' }),
      text: async () => 'Internal provider outage',
    } as any);

    const { req, res } = createMockReqRes('POST', {
      prompt: 'Valid prompt',
    });

    await handler(req, res);

    expect(res.getStatusCode()).toBe(502);
    const data = res.getData();
    expect(data.success).toBe(false);
    expect(data.error).toContain('AI provider returned error (500)');
    // Crucial security requirement: API key must NEVER be leaked in errors
    expect(JSON.stringify(data)).not.toContain('secret-api-key-999');

    fetchSpy.mockRestore();
  });
});
