import { describe, it, expect } from 'vitest';
import { lockCompositionToAnchor } from '../engine/layout/anchor';
import { TextElement } from '../types/rendering';
import { computeTextVisualBounds } from '../engine/text/measure';

describe('Match word anchor positioning', () => {
  it('should lock match word visual center to target coordinates', () => {
    const targetAnchorX = 540;
    const targetAnchorY = 960;

    const draftElements: TextElement[] = [
      {
        id: 'prefix-1',
        text: 'BEFORE TEXT',
        x: 400,
        y: 100,
        width: 200,
        height: 40,
        fontFamily: 'Arial',
        fontSize: 36,
        fontWeight: 600,
        letterSpacing: 0,
        rotation: 0,
        opacity: 1,
        color: '#ffffff',
        alignment: 'center',
        zIndex: 5,
        isMatchWord: false,
        bounds: computeTextVisualBounds('BEFORE TEXT', 400, 100, 'Arial', 36, 600, 'normal', 0, 'center', 'middle'),
      },
      {
        id: 'target-match',
        text: 'LOCKED',
        x: 350,
        y: 250,
        width: 300,
        height: 80,
        fontFamily: 'Arial',
        fontSize: 80,
        fontWeight: 900,
        letterSpacing: 2,
        rotation: 0,
        opacity: 1,
        color: '#3b82f6',
        alignment: 'center',
        zIndex: 10,
        isMatchWord: true,
        bounds: computeTextVisualBounds('LOCKED', 350, 250, 'Arial', 80, 900, 'normal', 2, 'center', 'middle'),
      },
    ];

    const result = lockCompositionToAnchor(
      draftElements,
      'target-match',
      targetAnchorX,
      targetAnchorY
    );

    const lockedMatch = result.elements.find((el) => el.id === 'target-match')!;

    // Match word visual center must align with target anchor within 1px
    expect(Math.abs(lockedMatch.bounds.centerX - targetAnchorX)).toBeLessThan(1.0);
    expect(Math.abs(lockedMatch.bounds.centerY - targetAnchorY)).toBeLessThan(1.0);
    expect(Math.abs(result.matchWordBounds.centerX - targetAnchorX)).toBeLessThan(1.0);
    expect(Math.abs(result.matchWordBounds.centerY - targetAnchorY)).toBeLessThan(1.0);

    // Prefix element must also have been shifted by the exact same delta
    const shiftedPrefix = result.elements.find((el) => el.id === 'prefix-1')!;
    expect(shiftedPrefix.x).toBe(400 + result.translationApplied.dx);
    expect(shiftedPrefix.y).toBe(100 + result.translationApplied.dy);
  });
});
