import { describe, it, expect } from 'vitest';
import {
  findMatchWordOccurrences,
  tokenizeTextWithMatch,
  groupTextAroundMatch,
} from '../utils/text';

describe('Text parsing and match extraction', () => {
  it('should find single occurrence of match word', () => {
    const text = 'I built my first Shopify app last year.';
    const occs = findMatchWordOccurrences(text, 'Shopify');

    expect(occs.length).toBe(1);
    expect(occs[0].matchedText).toBe('Shopify');
    expect(occs[0].startIndex).toBe(17);
    expect(occs[0].endIndex).toBe(24);
  });

  it('should find multiple occurrences of match word case-insensitively', () => {
    const text = 'Build something people remember. Make it simple. Make it fast. Make it yours.';
    const occs = findMatchWordOccurrences(text, 'make');

    expect(occs.length).toBe(3);
    expect(occs[0].matchedText).toBe('Make');
    expect(occs[1].matchedText).toBe('Make');
    expect(occs[2].matchedText).toBe('Make');
  });

  it('should handle match word with attached punctuation', () => {
    const text = 'Can you see this? Match!';
    const occs = findMatchWordOccurrences(text, 'Match');
    expect(occs.length).toBe(1);
  });

  it('should return empty list when match word is empty or missing', () => {
    expect(findMatchWordOccurrences('Hello world', '')).toEqual([]);
    expect(findMatchWordOccurrences('Hello world', 'NotFound')).toEqual([]);
  });

  it('should tokenize text properly tagging match token', () => {
    const text = 'Hello awesome world';
    const result = tokenizeTextWithMatch(text, 'awesome');

    expect(result.hasMatch).toBe(true);
    const matchToken = result.tokens.find((t) => t.isMatch);
    expect(matchToken).toBeDefined();
    expect(matchToken?.text).toBe('awesome');
  });

  it('should group text into prefix and suffix around match word', () => {
    const text = 'Before words here TARGET after words here';
    const grouped = groupTextAroundMatch(text, 'TARGET');

    expect(grouped.matchWord).toBe('TARGET');
    expect(grouped.prefixLines).toEqual(['Before', 'words', 'here']);
    expect(grouped.suffixLines).toEqual(['after', 'words', 'here']);
  });
});
