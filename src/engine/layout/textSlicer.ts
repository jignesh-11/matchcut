import { SeededRandom } from '../../utils/random';
import { groupTextAroundMatch, tokenizeTextWithMatch } from '../../utils/text';

export interface LayoutPhraseStructure {
  prefixLines: string[];
  matchWord: string;
  suffixLines: string[];
  rawMatchText: string;
}

/**
 * Creates dynamic line/word variations around the match word for each cut
 */
export function generateTextSliceVariation(
  fullText: string,
  matchWord: string,
  occurrenceIndex: number,
  compositionIndex: number,
  rng: SeededRandom
): LayoutPhraseStructure {
  const grouped = groupTextAroundMatch(fullText, matchWord, occurrenceIndex);

  // If text is short or single line, we can chunk prefix and suffix into 1, 2, or 3 lines
  const prefixWords = grouped.prefixLines;
  const suffixWords = grouped.suffixLines;

  // Different slicing modes across cuts:
  // 0: full text chunked into balanced lines
  // 1: minimal focus (match word only, or with just 1 neighboring word)
  // 2: heavy prefix punch (prefix lines prominent)
  // 3: heavy suffix punch (suffix lines prominent)
  // 4: staggered phrases
  const mode = rng.int(0, 4);

  let prefixResult: string[] = [];
  let suffixResult: string[] = [];

  if (mode === 1 && compositionIndex > 0 && rng.boolean(0.45)) {
    // Punchy isolated cut: Match word alone or with minimal flank
    if (rng.boolean(0.5) && prefixWords.length > 0) {
      prefixResult = [prefixWords[prefixWords.length - 1]];
    }
    if (rng.boolean(0.5) && suffixWords.length > 0) {
      suffixResult = [suffixWords[0]];
    }
  } else {
    // Normal / balanced chunking
    prefixResult = chunkWordsIntoLines(prefixWords, rng);
    suffixResult = chunkWordsIntoLines(suffixWords, rng);
  }

  return {
    prefixLines: prefixResult,
    matchWord: grouped.matchWord,
    suffixLines: suffixResult,
    rawMatchText: grouped.matchWord,
  };
}

function chunkWordsIntoLines(words: string[], rng: SeededRandom): string[] {
  if (words.length === 0) return [];
  if (words.length <= 2) return [words.join(' ')];

  const lines: string[] = [];
  // Decide how many words per line (1 to 4)
  let currentIndex = 0;

  while (currentIndex < words.length) {
    const remaining = words.length - currentIndex;
    const wordsInLine = Math.min(remaining, rng.int(1, Math.min(3, remaining)));
    const line = words.slice(currentIndex, currentIndex + wordsInLine).join(' ');
    lines.push(line);
    currentIndex += wordsInLine;
  }

  return lines;
}
