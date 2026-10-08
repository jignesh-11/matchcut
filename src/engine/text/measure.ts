import { fontManager } from '../fonts/fontManager';
import { BoxWithCenter, createBoxWithCenter } from '../../utils/geometry';

export interface TextMetricsInfo {
  width: number;
  height: number;
  ascent: number;
  descent: number;
  actualLeft: number;
  actualRight: number;
  fontBoundingBoxAscent?: number;
  fontBoundingBoxDescent?: number;
}

// Global cached measurement canvas
let measureCanvas: HTMLCanvasElement | null = null;
let measureCtx: CanvasRenderingContext2D | null = null;

// Cache map key: fontStyle_fontWeight_fontSize_fontFamily_letterSpacing_text
const measurementCache = new Map<string, TextMetricsInfo>();

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;

  if (!measureCanvas) {
    measureCanvas = document.createElement('canvas');
    measureCanvas.width = 100;
    measureCanvas.height = 100;
    measureCtx = measureCanvas.getContext('2d', { willReadFrequently: true });
  }
  return measureCtx;
}

/**
 * Measures text using 2D canvas context with caching
 */
export function measureText(
  text: string,
  fontFamily: string,
  fontSize: number,
  fontWeight: number | string = 700,
  fontStyle: 'normal' | 'italic' = 'normal',
  letterSpacing: number = 0
): TextMetricsInfo {
  const cacheKey = `${fontStyle}_${fontWeight}_${fontSize}_${fontFamily}_${letterSpacing}_${text}`;
  const cached = measurementCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const ctx = getMeasureContext();

  if (!ctx) {
    // Fallback for non-DOM / test environments without Canvas
    const charWidth = fontSize * 0.6;
    const width = Math.max(1, text.length * charWidth + (text.length - 1) * letterSpacing);
    const height = fontSize * 1.2;
    const ascent = fontSize * 0.9;
    const descent = fontSize * 0.3;
    const fallback: TextMetricsInfo = {
      width,
      height,
      ascent,
      descent,
      actualLeft: 0,
      actualRight: width,
    };
    measurementCache.set(cacheKey, fallback);
    return fallback;
  }

  ctx.save();
  ctx.font = fontManager.getFontCSS(fontFamily, fontSize, fontWeight, fontStyle);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';

  // Support canvas letterSpacing if supported by browser
  if ('letterSpacing' in ctx && typeof (ctx as unknown as Record<string, unknown>).letterSpacing === 'string') {
    (ctx as unknown as { letterSpacing: string }).letterSpacing = `${letterSpacing}px`;
  }

  const metrics = ctx.measureText(text);

  // Calculate width accounting for manual letter spacing if canvas API doesn't support it natively
  let calculatedWidth = metrics.width;
  if (!('letterSpacing' in ctx) && letterSpacing !== 0 && text.length > 1) {
    calculatedWidth += (text.length - 1) * letterSpacing;
  }

  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
  const height = ascent + descent;

  const actualLeft = metrics.actualBoundingBoxLeft || 0;
  const actualRight = metrics.actualBoundingBoxRight || calculatedWidth;

  ctx.restore();

  const result: TextMetricsInfo = {
    width: Math.max(1, calculatedWidth),
    height: Math.max(1, height),
    ascent,
    descent,
    actualLeft,
    actualRight,
    fontBoundingBoxAscent: metrics.fontBoundingBoxAscent,
    fontBoundingBoxDescent: metrics.fontBoundingBoxDescent,
  };

  // Limit cache size to prevent memory bloat
  if (measurementCache.size > 2000) {
    measurementCache.clear();
  }
  measurementCache.set(cacheKey, result);

  return result;
}

/**
 * Computes exact visual bounding box for a text string at a given base placement (x, y)
 * baseline: 'middle', 'alphabetic', or 'top'
 * alignment: 'left', 'center', 'right'
 */
export function computeTextVisualBounds(
  text: string,
  baseX: number,
  baseY: number,
  fontFamily: string,
  fontSize: number,
  fontWeight: number | string = 700,
  fontStyle: 'normal' | 'italic' = 'normal',
  letterSpacing: number = 0,
  alignment: 'left' | 'center' | 'right' = 'center',
  baseline: 'alphabetic' | 'middle' | 'top' = 'alphabetic'
): BoxWithCenter {
  const metrics = measureText(text, fontFamily, fontSize, fontWeight, fontStyle, letterSpacing);

  let leftX = baseX;
  if (alignment === 'center') {
    leftX = baseX - metrics.width / 2;
  } else if (alignment === 'right') {
    leftX = baseX - metrics.width;
  }

  let topY = baseY;
  if (baseline === 'alphabetic') {
    topY = baseY - metrics.ascent;
  } else if (baseline === 'middle') {
    topY = baseY - metrics.height / 2;
  } else if (baseline === 'top') {
    topY = baseY;
  }

  return createBoxWithCenter(leftX, topY, metrics.width, metrics.height);
}
