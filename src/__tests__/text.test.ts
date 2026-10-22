import { describe, it, expect } from 'vitest';
import {
  findMatchWordOccurrences,
  tokenizeTextWithMatch,
  groupTextAroundMatch,
} from '../utils/text';

describe('Text parsing and match extraction', () => {
  it('should find single occurrence of match word', () => {
    const text = 'I built my first kinetic video last year.';
    const occs = findMatchWordOccurrences(text, 'kinetic');

    expect(occs.length).toBe(1);
    expect(occs[0].matchedText).toBe('kinetic');
    expect(occs[0].startIndex).toBe(17);
    expect(occs[0].endIndex).toBe(24);
  });

  it('should find multiple occurrences of match word case-insensitively by default', () => {
    const text = 'Build something people remember. Make it simple. Make it fast. Make it yours.';
    const occs = findMatchWordOccurrences(text, 'make');

    expect(occs.length).toBe(3);
    expect(occs[0].matchedText).toBe('Make');
    expect(occs[1].matchedText).toBe('Make');
    expect(occs[2].matchedText).toBe('Make');
  });

  it('should respect case sensitivity when caseSensitive is true', () => {
    const text = 'Build something people remember. Make it simple. make it fast. MAKE it yours.';
    const caseSensitiveMatches = findMatchWordOccurrences(text, 'make', true);
    expect(caseSensitiveMatches.length).toBe(1);
    expect(caseSensitiveMatches[0].matchedText).toBe('make');

    const upperMatches = findMatchWordOccurrences(text, 'MAKE', true);
    expect(upperMatches.length).toBe(1);
    expect(upperMatches[0].matchedText).toBe('MAKE');

    const titleMatches = findMatchWordOccurrences(text, 'Make', true);
    expect(titleMatches.length).toBe(1);
    expect(titleMatches[0].matchedText).toBe('Make');
  });

  it('should handle match word with attached punctuation (commas, exclamation marks, periods)', () => {
    const text = 'Can you see this? Match!';
    const occs = findMatchWordOccurrences(text, 'Match');
    expect(occs.length).toBe(1);
    expect(occs[0].matchedText).toBe('Match');
  });

  it('should handle special symbols and non-standard tokens cleanly ($100, C++, #tag)', () => {
    const text = 'Earned $100 writing C++ code with #tag';
    const moneyOccs = findMatchWordOccurrences(text, '$100');
    expect(moneyOccs.length).toBe(1);

    const cppOccs = findMatchWordOccurrences(text, 'C++');
    expect(cppOccs.length).toBe(1);
  });

  it('should return empty list when match word is empty or missing', () => {
    expect(findMatchWordOccurrences('Hello world', '')).toEqual([]);
    expect(findMatchWordOccurrences('Hello world', 'NotFound')).toEqual([]);
    expect(findMatchWordOccurrences('', 'word')).toEqual([]);
  });

  it('should tokenize text properly tagging match token', () => {
    const text = 'Hello awesome world';
    const result = tokenizeTextWithMatch(text, 'awesome');

    expect(result.hasMatch).toBe(true);
    const matchToken = result.tokens.find((t) => t.isMatch);
    expect(matchToken).toBeDefined();
    expect(matchToken?.text).toBe('awesome');
  });

  it('should select specific occurrence index when target word appears repeatedly', () => {
    const text = 'Repeat one. Repeat two. Repeat three.';
    const resultFirst = tokenizeTextWithMatch(text, 'Repeat', 0);
    expect(resultFirst.hasMatch).toBe(true);

    const resultSecond = tokenizeTextWithMatch(text, 'Repeat', 1);
    expect(resultSecond.hasMatch).toBe(true);

    const resultThird = tokenizeTextWithMatch(text, 'Repeat', 2);
    expect(resultThird.hasMatch).toBe(true);
  });

  it('should group text into prefix and suffix around match word', () => {
    const text = 'Before words here TARGET after words here';
    const grouped = groupTextAroundMatch(text, 'TARGET');

    expect(grouped.matchWord).toBe('TARGET');
    expect(grouped.prefixLines).toEqual(['Before', 'words', 'here']);
    expect(grouped.suffixLines).toEqual(['after', 'words', 'here']);
  });

  it('should provide fallback phrase group when match word is not in text', () => {
    const text = 'This text has no anchor';
    const grouped = groupTextAroundMatch(text, 'MISSING');

    expect(grouped.matchWord).toBe('MISSING');
    expect(grouped.prefixLines).toEqual([]);
    expect(grouped.suffixLines).toEqual(['This text has no anchor']);
  });
});
