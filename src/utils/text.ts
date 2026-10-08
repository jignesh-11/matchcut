export interface MatchOccurrence {
  index: number; // 0-based occurrence index
  startIndex: number;
  endIndex: number;
  matchedText: string;
  contextPreview: string;
}

/**
 * Normalizes text and whitespace
 */
export function normalizeText(text: string): string {
  return text.trim().replace(/\r\n/g, '\n');
}

/**
 * Finds all occurrences of matchWord in the source text (case-insensitive)
 */
export function findMatchWordOccurrences(
  fullText: string,
  matchWord: string
): MatchOccurrence[] {
  if (!fullText || !matchWord) return [];

  const trimmedWord = matchWord.trim();
  if (trimmedWord.length === 0) return [];

  const occurrences: MatchOccurrence[] = [];
  // Escape special regex characters
  const escaped = trimmedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Match word boundary or exact substring
  const regex = new RegExp(`\\b${escaped}\\b`, 'gi');

  let match: RegExpExecArray | null;
  let fallbackRegex: RegExp | null = null;

  while ((match = regex.exec(fullText)) !== null) {
    const startIndex = match.index;
    const endIndex = startIndex + match[0].length;
    const contextStart = Math.max(0, startIndex - 15);
    const contextEnd = Math.min(fullText.length, endIndex + 15);
    const contextPreview = `...${fullText.slice(contextStart, contextEnd)}...`;

    occurrences.push({
      index: occurrences.length,
      startIndex,
      endIndex,
      matchedText: match[0],
      contextPreview,
    });
  }

  // If no word-boundary match, try raw substring search (e.g. for punctuation-attached words)
  if (occurrences.length === 0) {
    fallbackRegex = new RegExp(escaped, 'gi');
    while ((match = fallbackRegex.exec(fullText)) !== null) {
      const startIndex = match.index;
      const endIndex = startIndex + match[0].length;
      const contextStart = Math.max(0, startIndex - 15);
      const contextEnd = Math.min(fullText.length, endIndex + 15);

      occurrences.push({
        index: occurrences.length,
        startIndex,
        endIndex,
        matchedText: match[0],
        contextPreview: `...${fullText.slice(contextStart, contextEnd)}...`,
      });
    }
  }

  return occurrences;
}

export interface SplitToken {
  type: 'word' | 'whitespace' | 'match';
  text: string;
  isMatch: boolean;
  tokenIndex: number;
}

/**
 * Splits text into tokens and flags the specific occurrence of matchWord
 */
export function tokenizeTextWithMatch(
  text: string,
  matchWord: string,
  occurrenceIndex: number = 0
): { tokens: SplitToken[]; hasMatch: boolean; matchedString: string } {
  const occurrences = findMatchWordOccurrences(text, matchWord);
  if (occurrences.length === 0) {
    // If not found, return regular word tokens
    const words = text.split(/(\s+)/);
    return {
      tokens: words.map((w, i) => ({
        type: /^\s+$/.test(w) ? 'whitespace' : 'word',
        text: w,
        isMatch: false,
        tokenIndex: i,
      })),
      hasMatch: false,
      matchedString: matchWord,
    };
  }

  const targetOccurrence =
    occurrences[occurrenceIndex] ?? occurrences[0];

  const beforeText = text.substring(0, targetOccurrence.startIndex);
  const matchText = text.substring(
    targetOccurrence.startIndex,
    targetOccurrence.endIndex
  );
  const afterText = text.substring(targetOccurrence.endIndex);

  const tokens: SplitToken[] = [];
  let tokenCounter = 0;

  // Process before tokens
  if (beforeText.length > 0) {
    const parts = beforeText.split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      tokens.push({
        type: /^\s+$/.test(part) ? 'whitespace' : 'word',
        text: part,
        isMatch: false,
        tokenIndex: tokenCounter++,
      });
    }
  }

  // Target match token
  tokens.push({
    type: 'match',
    text: matchText,
    isMatch: true,
    tokenIndex: tokenCounter++,
  });

  // Process after tokens
  if (afterText.length > 0) {
    const parts = afterText.split(/(\s+)/);
    for (const part of parts) {
      if (!part) continue;
      tokens.push({
        type: /^\s+$/.test(part) ? 'whitespace' : 'word',
        text: part,
        isMatch: false,
        tokenIndex: tokenCounter++,
      });
    }
  }

  return {
    tokens,
    hasMatch: true,
    matchedString: matchText,
  };
}

/**
 * Break lines or phrases into groups surrounding the match word
 */
export interface TextPhraseGroup {
  prefixLines: string[];
  matchWord: string;
  suffixLines: string[];
}

export function groupTextAroundMatch(
  text: string,
  matchWord: string,
  occurrenceIndex: number = 0
): TextPhraseGroup {
  const { tokens, hasMatch, matchedString } = tokenizeTextWithMatch(
    text,
    matchWord,
    occurrenceIndex
  );

  if (!hasMatch) {
    return {
      prefixLines: [],
      matchWord: matchWord || 'MATCH',
      suffixLines: [text],
    };
  }

  const prefixWords: string[] = [];
  const suffixWords: string[] = [];
  let passedMatch = false;

  for (const token of tokens) {
    if (token.isMatch) {
      passedMatch = true;
      continue;
    }
    if (token.type === 'whitespace') continue;

    if (!passedMatch) {
      prefixWords.push(token.text);
    } else {
      suffixWords.push(token.text);
    }
  }

  return {
    prefixLines: prefixWords,
    matchWord: matchedString,
    suffixLines: suffixWords,
  };
}
