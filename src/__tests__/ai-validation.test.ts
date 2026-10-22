import { describe, it, expect } from 'vitest';
import {
  validateGenerationOptions,
  parseAndValidateAIResponse,
  validateOrResolveAnchor,
  findBestAnchorWord,
  buildSystemPrompt,
  MAX_PROMPT_LENGTH,
} from '../engine/ai/validation';

describe('MatchCut AI Validation & Parsing Engine', () => {
  describe('validateGenerationOptions', () => {
    it('should pass valid generation options', () => {
      const valid = {
        prompt: 'Build something people remember.',
        tone: 'cinematic',
        length: 'short',
        count: 5,
        mode: 'sentences',
      };

      const result = validateGenerationOptions(valid);
      expect(result.valid).toBe(true);
      expect(result.data?.prompt).toBe('Build something people remember.');
      expect(result.data?.tone).toBe('cinematic');
      expect(result.data?.length).toBe('short');
      expect(result.data?.count).toBe(5);
    });

    it('should reject empty or whitespace-only prompt', () => {
      expect(validateGenerationOptions({ prompt: '' }).valid).toBe(false);
      expect(validateGenerationOptions({ prompt: '   ' }).valid).toBe(false);
      expect(validateGenerationOptions({ prompt: null }).valid).toBe(false);
      expect(validateGenerationOptions({}).valid).toBe(false);
    });

    it('should reject prompts exceeding maximum allowed character limit', () => {
      const longPrompt = 'a'.repeat(MAX_PROMPT_LENGTH + 1);
      const res = validateGenerationOptions({ prompt: longPrompt });
      expect(res.valid).toBe(false);
      expect(res.error).toContain('exceeds maximum allowed length');
    });

    it('should fallback to default cinematic tone for unknown tone', () => {
      const res = validateGenerationOptions({
        prompt: 'Focus on growth',
        tone: 'unknown-tone' as any,
      });
      expect(res.valid).toBe(true);
      expect(res.data?.tone).toBe('cinematic');
    });

    it('should clamp or adjust invalid result counts', () => {
      const res1 = validateGenerationOptions({ prompt: 'test', count: 1 });
      expect(res1.data?.count).toBe(5);

      const res2 = validateGenerationOptions({ prompt: 'test', count: 7 });
      expect(res2.data?.count).toBe(8);

      const res3 = validateGenerationOptions({ prompt: 'test', count: 12 });
      expect(res3.data?.count).toBe(10);
    });

    it('should validate script mode correctly', () => {
      const res = validateGenerationOptions({ prompt: 'test story', mode: 'script' });
      expect(res.valid).toBe(true);
      expect(res.data?.mode).toBe('script');
    });
  });

  describe('suggested-anchor validation & resolution', () => {
    it('should preserve valid suggested anchor if it exists in the sentence', () => {
      const text = 'Built in silence without anyone noticing.';
      const anchor = validateOrResolveAnchor(text, 'silence');
      expect(anchor.toLowerCase()).toBe('silence');
    });

    it('should fallback to strongest content word if suggested anchor does not appear in sentence', () => {
      const text = 'Hard choices easy life.';
      // "freedom" is not in the text
      const anchor = validateOrResolveAnchor(text, 'freedom');
      expect(anchor).toBeDefined();
      expect(text.toLowerCase()).toContain(anchor.toLowerCase());
    });

    it('should find best anchor word ignoring common stop words', () => {
      const text = 'The dream is alive.';
      const anchor = findBestAnchorWord(text);
      expect(anchor.toLowerCase()).not.toBe('the');
      expect(anchor.toLowerCase()).not.toBe('is');
      expect(['dream', 'alive']).toContain(anchor.toLowerCase());
    });
  });

  describe('parseAndValidateAIResponse', () => {
    it('should parse clean JSON matching target schema', () => {
      const mockRaw = JSON.stringify({
        results: [
          { id: '1', text: 'Built in silence.', suggestedAnchor: 'silence' },
          { id: '2', text: 'Nobody noticed.', suggestedAnchor: 'noticed' },
          { id: '3', text: 'Still, I built.', suggestedAnchor: 'built' },
        ],
      });

      const parsed = parseAndValidateAIResponse(mockRaw, 'cinematic', 3);
      expect(parsed.length).toBe(3);
      expect(parsed[0].text).toBe('Built in silence.');
      expect(parsed[0].suggestedAnchor.toLowerCase()).toBe('silence');
      expect(parsed[1].text).toBe('Nobody noticed.');
      expect(parsed[2].text).toBe('Still, I built.');
    });

    it('should strip markdown code blocks (```json ... ```)', () => {
      const fenced = '```json\n{\n  "results": [\n    {"id":"1", "text":"One dream.", "suggestedAnchor":"dream"}\n  ]\n}\n```';
      const parsed = parseAndValidateAIResponse(fenced, 'cinematic', 5);
      expect(parsed.length).toBe(1);
      expect(parsed[0].text).toBe('One dream.');
    });

    it('should remove duplicate results case-insensitively', () => {
      const rawWithDupes = JSON.stringify({
        results: [
          { id: '1', text: 'Unique line.' },
          { id: '2', text: 'unique line.' }, // exact duplicate
          { id: '3', text: 'Second unique.' },
        ],
      });

      const parsed = parseAndValidateAIResponse(rawWithDupes, 'bold', 5);
      expect(parsed.length).toBe(2);
      expect(parsed[0].text).toBe('Unique line.');
      expect(parsed[1].text).toBe('Second unique.');
    });

    it('should fallback to line-by-line parsing if AI returns numbered text instead of JSON', () => {
      const nonJson = `1. Built in silence.
2. Nobody noticed.
3. Still I built.`;

      const parsed = parseAndValidateAIResponse(nonJson, 'cinematic', 3);
      expect(parsed.length).toBe(3);
      expect(parsed[0].text).toBe('Built in silence.');
      expect(parsed[1].text).toBe('Nobody noticed.');
      expect(parsed[2].text).toBe('Still I built.');
    });

    it('should return empty list for completely unparseable gibberish', () => {
      const gibberish = ' ';
      const parsed = parseAndValidateAIResponse(gibberish, 'cinematic', 5);
      expect(parsed.length).toBe(0);
    });
  });

  describe('buildSystemPrompt', () => {
    it('should build prompt containing requested tone and count', () => {
      const prompt = buildSystemPrompt({
        prompt: 'developer story',
        tone: 'motivational',
        customTone: '',
        length: 'short',
        count: 8,
        mode: 'sentences',
      });

      expect(prompt).toContain('motivational');
      expect(prompt).toContain('8');
      expect(prompt).toContain('kinetic typography');
      expect(prompt).toContain('JSON');
    });

    it('should build sequential narrative prompt for script mode', () => {
      const prompt = buildSystemPrompt({
        prompt: 'launching an app',
        tone: 'cinematic',
        customTone: '',
        length: 'ultra-short',
        count: 5,
        mode: 'script',
      });

      expect(prompt).toContain('sequential lines');
      expect(prompt).toContain('5');
      expect(prompt).toContain('Ultra-short');
    });
  });
});
