import { Composition, TextElement } from '../../types/rendering';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates a generated composition against strict rendering and anchoring rules
 */
export function validateComposition(
  composition: Composition,
  canvasWidth: number,
  canvasHeight: number,
  targetAnchorX: number,
  targetAnchorY: number,
  anchorTolerance = 4 // allowed pixel tolerance (accounting for font metric roundings)
): ValidationResult {
  const errors: string[] = [];

  if (!composition || !composition.elements || composition.elements.length === 0) {
    return { valid: false, errors: ['Composition contains no elements'] };
  }

  // 1. Match word element check
  const matchElement = composition.elements.find(
    (el) => el.id === composition.matchElementId || el.isMatchWord
  );

  if (!matchElement) {
    errors.push('Match word element is missing');
  } else {
    // 2. Match word anchor stability check
    const anchorDiffX = Math.abs(matchElement.bounds.centerX - targetAnchorX);
    const anchorDiffY = Math.abs(matchElement.bounds.centerY - targetAnchorY);

    if (anchorDiffX > anchorTolerance || anchorDiffY > anchorTolerance) {
      errors.push(
        `Match word anchor drift detected: center is (${matchElement.bounds.centerX.toFixed(
          1
        )}, ${matchElement.bounds.centerY.toFixed(1)}), expected (${targetAnchorX.toFixed(
          1
        )}, ${targetAnchorY.toFixed(1)}) (dx=${anchorDiffX.toFixed(1)}, dy=${anchorDiffY.toFixed(1)})`
      );
    }
  }

  // 3. Inspect individual elements
  for (let i = 0; i < composition.elements.length; i++) {
    const el = composition.elements[i];

    // NaN / Infinity checks
    if (
      !Number.isFinite(el.x) ||
      !Number.isFinite(el.y) ||
      !Number.isFinite(el.width) ||
      !Number.isFinite(el.height) ||
      !Number.isFinite(el.bounds.centerX) ||
      !Number.isFinite(el.bounds.centerY)
    ) {
      errors.push(`Element "${el.text}" has non-finite coordinates or bounds`);
    }

    if (!Number.isFinite(el.fontSize) || el.fontSize <= 0) {
      errors.push(`Element "${el.text}" has invalid font size ${el.fontSize}`);
    }

    if (!Number.isFinite(el.opacity) || el.opacity < 0 || el.opacity > 1) {
      errors.push(`Element "${el.text}" has invalid opacity ${el.opacity}`);
    }

    if (!Number.isFinite(el.rotation)) {
      errors.push(`Element "${el.text}" has invalid rotation ${el.rotation}`);
    }

    // Boundary check (allow some overflow for dynamic editorial cuts, but ensure not crazy offscreen)
    const margin = Math.max(canvasWidth, canvasHeight) * 0.4;
    if (
      el.bounds.centerX < -margin ||
      el.bounds.centerX > canvasWidth + margin ||
      el.bounds.centerY < -margin ||
      el.bounds.centerY > canvasHeight + margin
    ) {
      errors.push(
        `Element "${el.text}" is completely out of reasonable canvas bounds (${el.bounds.centerX}, ${el.bounds.centerY})`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
