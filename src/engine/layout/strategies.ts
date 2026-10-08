import { FontConfig } from '../../types/editor';
import { LayoutStyle, TextElement } from '../../types/rendering';
import { SeededRandom } from '../../utils/random';
import { LayoutPhraseStructure } from './textSlicer';
import { AVAILABLE_FONTS } from '../fonts/fontManager';
import { computeTextVisualBounds } from '../text/measure';

export interface LayoutGeneratorContext {
  phrase: LayoutPhraseStructure;
  canvasWidth: number;
  canvasHeight: number;
  fontConfig: FontConfig;
  rng: SeededRandom;
  style: LayoutStyle;
  compositionIndex: number;
  density: 'sparse' | 'normal' | 'dense';
  randomizationLevel: number;
}

export function generateDraftLayout(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { style } = ctx;

  let draft;
  switch (style) {
    case 'center-stack':
      draft = layoutCenterStack(ctx); break;
    case 'editorial-left':
      draft = layoutEditorial(ctx, 'left'); break;
    case 'editorial-right':
      draft = layoutEditorial(ctx, 'right'); break;
    case 'huge-typography':
      draft = layoutHugeTypography(ctx); break;
    case 'scattered':
      draft = layoutScattered(ctx); break;
    case 'magazine':
      draft = layoutMagazine(ctx); break;
    case 'minimal':
      draft = layoutMinimal(ctx); break;
    case 'vertical':
      draft = layoutVertical(ctx); break;
    case 'split-screen':
      draft = layoutSplitScreen(ctx); break;
    case 'fullscreen-word':
      draft = layoutFullscreenWord(ctx); break;
    case 'random-controlled':
      draft = layoutRandomControlled(ctx); break;
    case 'kinetic':
    default:
      draft = layoutKinetic(ctx); break;
  }

  const maxWidth = ctx.canvasWidth * 0.9;
  for (const el of draft.elements) {
    if (el.bounds.width > maxWidth) {
      const scale = maxWidth / el.bounds.width;
      el.fontSize = Math.max(10, Math.floor(el.fontSize * scale));
      el.bounds = computeTextVisualBounds(
        el.text,
        el.x,
        el.y,
        el.fontFamily,
        el.fontSize,
        el.fontWeight,
        el.fontStyle || 'normal',
        el.letterSpacing,
        el.alignment,
        'middle'
      );
      el.width = el.bounds.width;
      el.height = el.bounds.height;
    }
  }

  return draft;
}

// 1. Center Stack
function layoutCenterStack(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { phrase, canvasWidth, fontConfig, rng, density } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  const densityScale = density === 'dense' ? 1.2 : density === 'sparse' ? 0.85 : 1.0;
  const matchSize = Math.round(fontConfig.size * 1.15 * densityScale);
  const surroundSize = Math.round(matchSize * 0.58);
  const gap = Math.round(matchSize * 0.7);

  // Match Word in center draft (will be anchored)
  const matchText = transformText(phrase.matchWord, fontConfig.textTransform);
  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: canvasWidth / 2,
      y: 0,
      fontFamily: fontConfig.family,
      fontSize: matchSize,
      fontWeight: fontConfig.weight || 800,
      color: fontConfig.highlightColor || '#ffffff',
      alignment: 'center',
      letterSpacing: fontConfig.letterSpacing,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  // Prefix lines stacked above
  let currentY = -gap;
  for (let i = phrase.prefixLines.length - 1; i >= 0; i--) {
    const text = transformText(phrase.prefixLines[i], fontConfig.textTransform);
    const lineId = `prefix-${i}`;
    elements.push(
      createDraftElement({
        id: lineId,
        text,
        x: canvasWidth / 2,
        y: currentY,
        fontFamily: fontConfig.family,
        fontSize: surroundSize,
        fontWeight: 600,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: fontConfig.letterSpacing * 0.5,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.85,
      })
    );
    currentY -= surroundSize * 1.25;
  }

  // Suffix lines stacked below
  currentY = gap;
  for (let i = 0; i < phrase.suffixLines.length; i++) {
    const text = transformText(phrase.suffixLines[i], fontConfig.textTransform);
    const lineId = `suffix-${i}`;
    elements.push(
      createDraftElement({
        id: lineId,
        text,
        x: canvasWidth / 2,
        y: currentY,
        fontFamily: fontConfig.family,
        fontSize: surroundSize,
        fontWeight: 600,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: fontConfig.letterSpacing * 0.5,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.85,
      })
    );
    currentY += surroundSize * 1.25;
  }

  return { elements, matchElementId: matchId };
}

// 2 & 3. Editorial Left / Right
function layoutEditorial(
  ctx: LayoutGeneratorContext,
  alignment: 'left' | 'right'
): { elements: TextElement[]; matchElementId: string } {
  const { phrase, canvasWidth, fontConfig } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  const matchSize = Math.round(fontConfig.size * 1.2);
  const surroundSize = Math.round(matchSize * 0.5);
  const gap = Math.round(matchSize * 0.75);

  const baseX = alignment === 'left' ? canvasWidth * 0.15 : canvasWidth * 0.85;

  const matchText = transformText(phrase.matchWord, fontConfig.textTransform);
  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: baseX,
      y: 0,
      fontFamily: fontConfig.family,
      fontSize: matchSize,
      fontWeight: 900,
      color: fontConfig.highlightColor || '#ffffff',
      alignment,
      letterSpacing: fontConfig.letterSpacing,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  let currentY = -gap;
  for (let i = phrase.prefixLines.length - 1; i >= 0; i--) {
    const text = transformText(phrase.prefixLines[i], fontConfig.textTransform);
    elements.push(
      createDraftElement({
        id: `prefix-${i}`,
        text,
        x: baseX,
        y: currentY,
        fontFamily: fontConfig.family,
        fontSize: surroundSize,
        fontWeight: 500,
        color: fontConfig.color,
        alignment,
        letterSpacing: 2,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.75,
      })
    );
    currentY -= surroundSize * 1.3;
  }

  currentY = gap;
  for (let i = 0; i < phrase.suffixLines.length; i++) {
    const text = transformText(phrase.suffixLines[i], fontConfig.textTransform);
    elements.push(
      createDraftElement({
        id: `suffix-${i}`,
        text,
        x: baseX,
        y: currentY,
        fontFamily: fontConfig.family,
        fontSize: surroundSize,
        fontWeight: 500,
        color: fontConfig.color,
        alignment,
        letterSpacing: 2,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.75,
      })
    );
    currentY += surroundSize * 1.3;
  }

  return { elements, matchElementId: matchId };
}

// 4. Huge Typography
function layoutHugeTypography(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { phrase, canvasWidth, fontConfig, rng } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  // Huge scale for match word (up to 1.8x base)
  const matchSize = Math.round(fontConfig.size * 1.7);
  const microSize = Math.max(24, Math.round(matchSize * 0.28));
  const gap = Math.round(matchSize * 0.65);

  const matchText = transformText(phrase.matchWord, 'uppercase');
  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: canvasWidth / 2,
      y: 0,
      fontFamily: 'Anton',
      fontSize: matchSize,
      fontWeight: 900,
      color: fontConfig.highlightColor || '#ffffff',
      alignment: 'center',
      letterSpacing: 2,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  // Micro prefix tags
  if (phrase.prefixLines.length > 0) {
    const combinedPrefix = phrase.prefixLines.join(' • ');
    elements.push(
      createDraftElement({
        id: 'prefix-micro',
        text: transformText(combinedPrefix, 'uppercase'),
        x: canvasWidth / 2,
        y: -gap,
        fontFamily: 'Space Grotesk',
        fontSize: microSize,
        fontWeight: 700,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 6,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.8,
      })
    );
  }

  // Micro suffix tags
  if (phrase.suffixLines.length > 0) {
    const combinedSuffix = phrase.suffixLines.join(' • ');
    elements.push(
      createDraftElement({
        id: 'suffix-micro',
        text: transformText(combinedSuffix, 'uppercase'),
        x: canvasWidth / 2,
        y: gap,
        fontFamily: 'Space Grotesk',
        fontSize: microSize,
        fontWeight: 700,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 6,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.8,
      })
    );
  }

  return { elements, matchElementId: matchId };
}

// 5. Scattered Typography
function layoutScattered(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { phrase, canvasWidth, fontConfig, rng } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  const matchSize = Math.round(fontConfig.size * 1.25);
  const surroundSize = Math.round(matchSize * 0.6);

  const matchText = transformText(phrase.matchWord, fontConfig.textTransform);
  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: canvasWidth / 2,
      y: 0,
      fontFamily: fontConfig.family,
      fontSize: matchSize,
      fontWeight: 800,
      color: fontConfig.highlightColor || '#ffffff',
      alignment: 'center',
      letterSpacing: fontConfig.letterSpacing,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  // Scattered prefix
  for (let i = 0; i < phrase.prefixLines.length; i++) {
    const offsetX = rng.float(-160, 160);
    const offsetY = -matchSize * (0.8 + i * 0.7);
    const rot = rng.float(-5, 5);

    elements.push(
      createDraftElement({
        id: `prefix-scatter-${i}`,
        text: transformText(phrase.prefixLines[i], fontConfig.textTransform),
        x: canvasWidth / 2 + offsetX,
        y: offsetY,
        fontFamily: fontConfig.family,
        fontSize: surroundSize,
        fontWeight: 600,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: fontConfig.letterSpacing,
        rotation: rot,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.9,
      })
    );
  }

  // Scattered suffix
  for (let i = 0; i < phrase.suffixLines.length; i++) {
    const offsetX = rng.float(-160, 160);
    const offsetY = matchSize * (0.8 + i * 0.7);
    const rot = rng.float(-5, 5);

    elements.push(
      createDraftElement({
        id: `suffix-scatter-${i}`,
        text: transformText(phrase.suffixLines[i], fontConfig.textTransform),
        x: canvasWidth / 2 + offsetX,
        y: offsetY,
        fontFamily: fontConfig.family,
        fontSize: surroundSize,
        fontWeight: 600,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: fontConfig.letterSpacing,
        rotation: rot,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.9,
      })
    );
  }

  return { elements, matchElementId: matchId };
}

// 6. Magazine Layout
function layoutMagazine(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { phrase, canvasWidth, fontConfig, rng } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  const matchSize = Math.round(fontConfig.size * 1.3);
  const kickerSize = Math.round(matchSize * 0.32);
  const bodySize = Math.round(matchSize * 0.48);

  const matchText = transformText(phrase.matchWord, 'uppercase');
  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: canvasWidth / 2,
      y: 0,
      fontFamily: 'Playfair Display',
      fontStyle: 'italic',
      fontSize: matchSize,
      fontWeight: 900,
      color: fontConfig.highlightColor || '#ffffff',
      alignment: 'center',
      letterSpacing: 1,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  // Kicker header
  if (phrase.prefixLines.length > 0) {
    elements.push(
      createDraftElement({
        id: 'mag-kicker',
        text: transformText(phrase.prefixLines.join(' '), 'uppercase'),
        x: canvasWidth / 2,
        y: -matchSize * 0.75,
        fontFamily: 'Inter',
        fontSize: kickerSize,
        fontWeight: 700,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 5,
        isMatchWord: false,
        zIndex: 6,
        opacity: 0.8,
      })
    );
  }

  // Editorial body subtitle
  if (phrase.suffixLines.length > 0) {
    elements.push(
      createDraftElement({
        id: 'mag-body',
        text: phrase.suffixLines.join(' '),
        x: canvasWidth / 2,
        y: matchSize * 0.8,
        fontFamily: 'Inter',
        fontSize: bodySize,
        fontWeight: 400,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 1,
        isMatchWord: false,
        zIndex: 6,
        opacity: 0.85,
      })
    );
  }

  return { elements, matchElementId: matchId };
}

// 7. Minimal Layout
function layoutMinimal(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { phrase, canvasWidth, fontConfig } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  const matchSize = Math.round(fontConfig.size * 0.95);
  const surroundSize = Math.round(matchSize * 0.45);
  const gap = Math.round(matchSize * 0.85);

  const matchText = transformText(phrase.matchWord, fontConfig.textTransform);
  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: canvasWidth / 2,
      y: 0,
      fontFamily: 'Space Grotesk',
      fontSize: matchSize,
      fontWeight: 700,
      color: fontConfig.highlightColor || '#ffffff',
      alignment: 'center',
      letterSpacing: 4,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  if (phrase.prefixLines.length > 0) {
    elements.push(
      createDraftElement({
        id: 'minimal-prefix',
        text: phrase.prefixLines.join(' '),
        x: canvasWidth / 2,
        y: -gap,
        fontFamily: 'Space Grotesk',
        fontSize: surroundSize,
        fontWeight: 400,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 2,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.65,
      })
    );
  }

  if (phrase.suffixLines.length > 0) {
    elements.push(
      createDraftElement({
        id: 'minimal-suffix',
        text: phrase.suffixLines.join(' '),
        x: canvasWidth / 2,
        y: gap,
        fontFamily: 'Space Grotesk',
        fontSize: surroundSize,
        fontWeight: 400,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 2,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.65,
      })
    );
  }

  return { elements, matchElementId: matchId };
}

// 8. Vertical Layout
function layoutVertical(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { phrase, canvasWidth, fontConfig } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  const matchSize = Math.round(fontConfig.size * 1.3);
  const surroundSize = Math.round(matchSize * 0.45);

  const matchText = transformText(phrase.matchWord, 'uppercase');
  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: canvasWidth / 2,
      y: 0,
      fontFamily: 'Syne',
      fontSize: matchSize,
      fontWeight: 800,
      color: fontConfig.highlightColor || '#ffffff',
      alignment: 'center',
      letterSpacing: 6,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  let currentY = -matchSize * 0.7;
  for (let i = phrase.prefixLines.length - 1; i >= 0; i--) {
    elements.push(
      createDraftElement({
        id: `prefix-vert-${i}`,
        text: phrase.prefixLines[i],
        x: canvasWidth / 2,
        y: currentY,
        fontFamily: 'Inter',
        fontSize: surroundSize,
        fontWeight: 600,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 3,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.75,
      })
    );
    currentY -= surroundSize * 1.5;
  }

  currentY = matchSize * 0.7;
  for (let i = 0; i < phrase.suffixLines.length; i++) {
    elements.push(
      createDraftElement({
        id: `suffix-vert-${i}`,
        text: phrase.suffixLines[i],
        x: canvasWidth / 2,
        y: currentY,
        fontFamily: 'Inter',
        fontSize: surroundSize,
        fontWeight: 600,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 3,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.75,
      })
    );
    currentY += surroundSize * 1.5;
  }

  return { elements, matchElementId: matchId };
}

// 9. Split Screen
function layoutSplitScreen(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { phrase, canvasWidth, fontConfig } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  const matchSize = Math.round(fontConfig.size * 1.35);
  const flankSize = Math.round(matchSize * 0.5);
  const gap = Math.round(matchSize * 0.8);

  const matchText = transformText(phrase.matchWord, 'uppercase');
  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: canvasWidth / 2,
      y: 0,
      fontFamily: 'Oswald',
      fontSize: matchSize,
      fontWeight: 700,
      color: fontConfig.highlightColor || '#ffffff',
      alignment: 'center',
      letterSpacing: 3,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  // Upper block
  if (phrase.prefixLines.length > 0) {
    elements.push(
      createDraftElement({
        id: 'split-top',
        text: transformText(phrase.prefixLines.join(' '), 'uppercase'),
        x: canvasWidth / 2,
        y: -gap,
        fontFamily: 'Oswald',
        fontSize: flankSize,
        fontWeight: 500,
        color: '#94a3b8',
        alignment: 'center',
        letterSpacing: 2,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.9,
      })
    );
  }

  // Lower block
  if (phrase.suffixLines.length > 0) {
    elements.push(
      createDraftElement({
        id: 'split-bottom',
        text: transformText(phrase.suffixLines.join(' '), 'uppercase'),
        x: canvasWidth / 2,
        y: gap,
        fontFamily: 'Oswald',
        fontSize: flankSize,
        fontWeight: 500,
        color: '#94a3b8',
        alignment: 'center',
        letterSpacing: 2,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.9,
      })
    );
  }

  return { elements, matchElementId: matchId };
}

// 10. Fullscreen Word
function layoutFullscreenWord(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { phrase, canvasWidth, fontConfig } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  // Extremely large scale
  const matchSize = Math.round(fontConfig.size * 1.8);
  const bannerSize = Math.max(22, Math.round(matchSize * 0.22));
  const gap = Math.round(matchSize * 0.65);

  const matchText = transformText(phrase.matchWord, 'uppercase');
  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: canvasWidth / 2,
      y: 0,
      fontFamily: 'Anton',
      fontSize: matchSize,
      fontWeight: 900,
      color: fontConfig.highlightColor || '#ffffff',
      alignment: 'center',
      letterSpacing: 2,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  if (phrase.prefixLines.length > 0) {
    elements.push(
      createDraftElement({
        id: 'full-banner-top',
        text: transformText(phrase.prefixLines.join(' '), 'uppercase'),
        x: canvasWidth / 2,
        y: -gap,
        fontFamily: 'Inter',
        fontSize: bannerSize,
        fontWeight: 800,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 6,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.75,
      })
    );
  }

  if (phrase.suffixLines.length > 0) {
    elements.push(
      createDraftElement({
        id: 'full-banner-bottom',
        text: transformText(phrase.suffixLines.join(' '), 'uppercase'),
        x: canvasWidth / 2,
        y: gap,
        fontFamily: 'Inter',
        fontSize: bannerSize,
        fontWeight: 800,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 6,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.75,
      })
    );
  }

  return { elements, matchElementId: matchId };
}

// 11. Random Controlled Composition
function layoutRandomControlled(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { phrase, canvasWidth, fontConfig, rng } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  // Controlled randomized fonts & scales
  const randomFont = rng.pick(AVAILABLE_FONTS).family;
  const matchSize = Math.round(fontConfig.size * rng.float(1.1, 1.45));
  const surroundSize = Math.round(matchSize * rng.float(0.45, 0.65));
  const rotMatch = rng.float(-2.5, 2.5);

  const matchText = transformText(
    phrase.matchWord,
    rng.boolean(0.6) ? 'uppercase' : fontConfig.textTransform
  );

  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: canvasWidth / 2,
      y: 0,
      fontFamily: randomFont,
      fontSize: matchSize,
      fontWeight: rng.pick([700, 800, 900]),
      fontStyle: rng.boolean(0.2) ? 'italic' : 'normal',
      color: fontConfig.highlightColor || '#ffffff',
      alignment: 'center',
      letterSpacing: rng.int(0, 4),
      rotation: rotMatch,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  let currentY = -matchSize * rng.float(0.65, 0.85);
  for (let i = phrase.prefixLines.length - 1; i >= 0; i--) {
    const rot = rng.float(-3, 3);
    elements.push(
      createDraftElement({
        id: `prefix-rand-${i}`,
        text: phrase.prefixLines[i],
        x: canvasWidth / 2 + rng.float(-40, 40),
        y: currentY,
        fontFamily: fontConfig.family,
        fontSize: surroundSize,
        fontWeight: rng.pick([500, 600, 700]),
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: rng.int(1, 4),
        rotation: rot,
        isMatchWord: false,
        zIndex: 5,
        opacity: rng.float(0.7, 0.95),
      })
    );
    currentY -= surroundSize * 1.3;
  }

  currentY = matchSize * rng.float(0.65, 0.85);
  for (let i = 0; i < phrase.suffixLines.length; i++) {
    const rot = rng.float(-3, 3);
    elements.push(
      createDraftElement({
        id: `suffix-rand-${i}`,
        text: phrase.suffixLines[i],
        x: canvasWidth / 2 + rng.float(-40, 40),
        y: currentY,
        fontFamily: fontConfig.family,
        fontSize: surroundSize,
        fontWeight: rng.pick([500, 600, 700]),
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: rng.int(1, 4),
        rotation: rot,
        isMatchWord: false,
        zIndex: 5,
        opacity: rng.float(0.7, 0.95),
      })
    );
    currentY += surroundSize * 1.3;
  }

  return { elements, matchElementId: matchId };
}

// 12. Kinetic Typography (Modern Reels/Shorts fast kinetic style)
function layoutKinetic(ctx: LayoutGeneratorContext): {
  elements: TextElement[];
  matchElementId: string;
} {
  const { phrase, canvasWidth, fontConfig, rng } = ctx;
  const elements: TextElement[] = [];
  const matchId = `match-${ctx.compositionIndex}`;

  const kineticFonts = ['Syne', 'Anton', 'Montserrat', 'Space Grotesk'];
  const kineticFont = rng.pick(kineticFonts);
  const matchSize = Math.round(fontConfig.size * rng.float(1.2, 1.4));
  const surroundSize = Math.round(matchSize * 0.52);
  const gap = Math.round(matchSize * 0.72);

  const matchText = transformText(phrase.matchWord, 'uppercase');
  elements.push(
    createDraftElement({
      id: matchId,
      text: matchText,
      x: canvasWidth / 2,
      y: 0,
      fontFamily: kineticFont,
      fontSize: matchSize,
      fontWeight: 900,
      color: fontConfig.highlightColor || '#ffffff',
      alignment: 'center',
      letterSpacing: 2,
      isMatchWord: true,
      zIndex: 10,
    })
  );

  let currentY = -gap;
  for (let i = phrase.prefixLines.length - 1; i >= 0; i--) {
    elements.push(
      createDraftElement({
        id: `kinetic-prefix-${i}`,
        text: transformText(phrase.prefixLines[i], 'uppercase'),
        x: canvasWidth / 2,
        y: currentY,
        fontFamily: 'Inter',
        fontSize: surroundSize,
        fontWeight: 700,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 3,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.85,
      })
    );
    currentY -= surroundSize * 1.25;
  }

  currentY = gap;
  for (let i = 0; i < phrase.suffixLines.length; i++) {
    elements.push(
      createDraftElement({
        id: `kinetic-suffix-${i}`,
        text: transformText(phrase.suffixLines[i], 'uppercase'),
        x: canvasWidth / 2,
        y: currentY,
        fontFamily: 'Inter',
        fontSize: surroundSize,
        fontWeight: 700,
        color: fontConfig.color,
        alignment: 'center',
        letterSpacing: 3,
        isMatchWord: false,
        zIndex: 5,
        opacity: 0.85,
      })
    );
    currentY += surroundSize * 1.25;
  }

  return { elements, matchElementId: matchId };
}

function transformText(
  text: string,
  transform: 'none' | 'uppercase' | 'lowercase' | 'capitalize' = 'none'
): string {
  if (transform === 'uppercase') return text.toUpperCase();
  if (transform === 'lowercase') return text.toLowerCase();
  if (transform === 'capitalize') {
    return text.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return text;
}

function createDraftElement(params: {
  id: string;
  text: string;
  x: number;
  y: number;
  fontFamily: string;
  fontSize: number;
  fontWeight: number | string;
  fontStyle?: 'normal' | 'italic';
  color: string;
  alignment: 'left' | 'center' | 'right';
  letterSpacing: number;
  rotation?: number;
  isMatchWord: boolean;
  zIndex: number;
  opacity?: number;
}): TextElement {
  const bounds = computeTextVisualBounds(
    params.text,
    params.x,
    params.y,
    params.fontFamily,
    params.fontSize,
    params.fontWeight,
    params.fontStyle || 'normal',
    params.letterSpacing,
    params.alignment,
    'middle'
  );

  return {
    id: params.id,
    text: params.text,
    x: params.x,
    y: params.y,
    width: bounds.width,
    height: bounds.height,
    fontFamily: params.fontFamily,
    fontSize: params.fontSize,
    fontWeight: params.fontWeight,
    fontStyle: params.fontStyle,
    letterSpacing: params.letterSpacing,
    rotation: params.rotation || 0,
    opacity: params.opacity !== undefined ? params.opacity : 1,
    color: params.color,
    alignment: params.alignment,
    zIndex: params.zIndex,
    isMatchWord: params.isMatchWord,
    bounds,
  };
}
