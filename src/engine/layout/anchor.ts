import { TextElement } from '../../types/rendering';
import { computeTextVisualBounds } from '../text/measure';
import { rotatePoint } from '../../utils/geometry';

export interface AnchorResult {
  elements: TextElement[];
  matchWordBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
  };
  translationApplied: {
    dx: number;
    dy: number;
  };
}

/**
 * Positions and locks the composition so that the match element's visual center
 * aligns exactly with (targetAnchorX, targetAnchorY).
 */
export function lockCompositionToAnchor(
  elements: TextElement[],
  matchElementId: string,
  targetAnchorX: number,
  targetAnchorY: number
): AnchorResult {
  const matchElement = elements.find((el) => el.id === matchElementId);
  if (!matchElement) {
    throw new Error(`Match element with id "${matchElementId}" not found in composition.`);
  }

  // 1. Compute the un-translated visual bounds of the match word
  const bounds = computeTextVisualBounds(
    matchElement.text,
    matchElement.x,
    matchElement.y,
    matchElement.fontFamily,
    matchElement.fontSize,
    matchElement.fontWeight,
    matchElement.fontStyle || 'normal',
    matchElement.letterSpacing,
    matchElement.alignment,
    'middle' // We use middle baseline for reliable vertical centering
  );

  let currentCenterX = bounds.centerX;
  let currentCenterY = bounds.centerY;

  // If match element has rotation, compute rotated center
  if (matchElement.rotation && matchElement.rotation !== 0) {
    const rot = rotatePoint(
      currentCenterX,
      currentCenterY,
      matchElement.x,
      matchElement.y,
      matchElement.rotation
    );
    currentCenterX = rot.x;
    currentCenterY = rot.y;
  }

  // 2. Compute translation vector
  const dx = targetAnchorX - currentCenterX;
  const dy = targetAnchorY - currentCenterY;

  // 3. Shift all elements by (dx, dy)
  const translatedElements: TextElement[] = elements.map((el) => {
    const nextX = el.x + dx;
    const nextY = el.y + dy;

    // Recalculate visual bounds with new coordinates
    const elBounds = computeTextVisualBounds(
      el.text,
      nextX,
      nextY,
      el.fontFamily,
      el.fontSize,
      el.fontWeight,
      el.fontStyle || 'normal',
      el.letterSpacing,
      el.alignment,
      'middle'
    );

    return {
      ...el,
      x: nextX,
      y: nextY,
      bounds: elBounds,
    };
  });

  const finalMatch = translatedElements.find((el) => el.id === matchElementId)!;

  return {
    elements: translatedElements,
    matchWordBounds: finalMatch.bounds,
    translationApplied: { dx, dy },
  };
}
