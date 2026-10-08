import { FontConfig } from '../../types/editor';
import { Composition, LayoutStyle } from '../../types/rendering';
import { SeededRandom } from '../../utils/random';
import { lockCompositionToAnchor } from './anchor';
import { generateDraftLayout } from './strategies';
import { generateTextSliceVariation } from './textSlicer';
import { validateComposition } from './validator';

export interface GenerateCompositionsOptions {
  text: string;
  matchWord: string;
  occurrenceIndex?: number;
  canvasWidth: number;
  canvasHeight: number;
  targetAnchorX: number;
  targetAnchorY: number;
  count: number;
  fontConfig: FontConfig;
  layoutStyle: LayoutStyle | 'mixed';
  density?: 'sparse' | 'normal' | 'dense';
  randomizationLevel?: number;
  cutDuration?: number;
  seed: number;
}

const ALL_LAYOUT_STYLES: LayoutStyle[] = [
  'kinetic',
  'center-stack',
  'editorial-left',
  'huge-typography',
  'magazine',
  'scattered',
  'editorial-right',
  'split-screen',
  'vertical',
  'fullscreen-word',
  'random-controlled',
  'minimal',
];

export class MatchCutEngine {
  /**
   * Deterministically generates a sequence of compositions anchored to target coordinates
   */
  public static generate(options: GenerateCompositionsOptions): Composition[] {
    const {
      text,
      matchWord,
      occurrenceIndex = 0,
      canvasWidth,
      canvasHeight,
      targetAnchorX,
      targetAnchorY,
      count,
      fontConfig,
      layoutStyle,
      density = 'normal',
      randomizationLevel = 0.5,
      cutDuration = 0.6,
      seed,
    } = options;

    const masterRng = new SeededRandom(seed);
    const compositions: Composition[] = [];

    const effectiveMatch = matchWord.trim() || 'MATCH';

    for (let i = 0; i < count; i++) {
      // Deterministic sub-seed for this cut
      const cutSeed = (seed + i * 8191 + masterRng.int(1, 1000)) >>> 0;
      let cutRng = new SeededRandom(cutSeed);

      // Determine style for this cut
      let activeStyle: LayoutStyle;
      if (layoutStyle === 'mixed') {
        // Guarantee variety across cuts
        activeStyle = ALL_LAYOUT_STYLES[i % ALL_LAYOUT_STYLES.length];
      } else {
        activeStyle = layoutStyle;
      }

      let composition: Composition | null = null;
      const MAX_RETRIES = 5;

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const attemptRng = attempt === 0 ? cutRng : new SeededRandom(cutSeed + attempt * 1013);

        // 1. Generate dynamic text variation around match word
        const phrase = generateTextSliceVariation(
          text,
          effectiveMatch,
          occurrenceIndex,
          i,
          attemptRng
        );

        // 2. Generate draft layout
        const draft = generateDraftLayout({
          phrase,
          canvasWidth,
          canvasHeight,
          fontConfig,
          rng: attemptRng,
          style: activeStyle,
          compositionIndex: i,
          density,
          randomizationLevel,
        });

        // 3. Anchor match word to exact target coordinates
        const anchored = lockCompositionToAnchor(
          draft.elements,
          draft.matchElementId,
          targetAnchorX,
          targetAnchorY
        );

        const candidate: Composition = {
          id: `cut-${i}-${attempt}`,
          index: i,
          elements: anchored.elements,
          anchor: {
            x: targetAnchorX,
            y: targetAnchorY,
          },
          matchElementId: draft.matchElementId,
          matchWordBounds: anchored.matchWordBounds,
          duration: cutDuration,
          layoutStyle: activeStyle,
          seedUsed: cutSeed + attempt * 1013,
          sourceTextSnippet: phrase.rawMatchText,
        };

        // 4. Validate composition
        const validation = validateComposition(
          candidate,
          canvasWidth,
          canvasHeight,
          targetAnchorX,
          targetAnchorY
        );

        if (validation.valid) {
          composition = candidate;
          break;
        } else {
          // If failed, fall back to center-stack on final attempts
          if (attempt >= 2) {
            activeStyle = 'center-stack';
          }
        }
      }

      // If all retries failed (rare edge cases), produce a foolproof center-stack composition
      if (!composition) {
        const fallbackRng = new SeededRandom(cutSeed);
        const phrase = {
          prefixLines: [],
          matchWord: effectiveMatch,
          suffixLines: [],
          rawMatchText: effectiveMatch,
        };
        const draft = generateDraftLayout({
          phrase,
          canvasWidth,
          canvasHeight,
          fontConfig,
          rng: fallbackRng,
          style: 'center-stack',
          compositionIndex: i,
          density,
          randomizationLevel,
        });
        const anchored = lockCompositionToAnchor(
          draft.elements,
          draft.matchElementId,
          targetAnchorX,
          targetAnchorY
        );
        composition = {
          id: `cut-${i}-fallback`,
          index: i,
          elements: anchored.elements,
          anchor: { x: targetAnchorX, y: targetAnchorY },
          matchElementId: draft.matchElementId,
          matchWordBounds: anchored.matchWordBounds,
          duration: cutDuration,
          layoutStyle: 'center-stack',
          seedUsed: cutSeed,
        };
      }

      compositions.push(composition);
    }

    return compositions;
  }
}
