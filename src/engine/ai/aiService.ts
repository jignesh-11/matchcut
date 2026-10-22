import { AIGenerationOptions, AIGenerationResponse } from '../../types/ai';

export class AIService {
  /**
   * Generates kinetic typography sentences via the serverless API endpoint
   */
  public static async generateSentences(
    options: AIGenerationOptions,
    signal?: AbortSignal
  ): Promise<AIGenerationResponse> {
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(options),
        signal,
      });

      const data = (await response.json().catch(() => null)) as AIGenerationResponse | null;

      if (!response.ok) {
        const errorMsg =
          data?.error ||
          `Server returned status ${response.status}: ${response.statusText || 'Generation request failed'}`;
        return {
          success: false,
          results: [],
          count: 0,
          error: errorMsg,
        };
      }

      if (!data || !data.success || !Array.isArray(data.results)) {
        return {
          success: false,
          results: [],
          count: 0,
          error: data?.error || 'Invalid response received from generation service.',
        };
      }

      return data;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return {
          success: false,
          results: [],
          count: 0,
          error: 'Generation request was cancelled.',
        };
      }

      return {
        success: false,
        results: [],
        count: 0,
        error:
          err.message ||
          'Failed to connect to the generation service. Check your internet connection or server status.',
      };
    }
  }
}
