import { describe, it, expect } from 'vitest';
import { lockCompositionToAnchor } from '../engine/layout/anchor';
import { TextElement } from '../types/rendering';
import { computeTextVisualBounds } from '../engine/text/measure';

describe('Match word anchor positioning & stability', () => {
  const targetAnchorX = 540;
  const targetAnchorY = 960;

  it('should lock match word visual center to target coordinates within sub-pixel tolerance (<1px)', () => {
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

    // Match word visual center must align with target anchor within 1.0px tolerance
    expect(Math.abs(lockedMatch.bounds.centerX - targetAnchorX)).toBeLessThan(1.0);
    expect(Math.abs(lockedMatch.bounds.centerY - targetAnchorY)).toBeLessThan(1.0);
    expect(Math.abs(result.matchWordBounds.centerX - targetAnchorX)).toBeLessThan(1.0);
    expect(Math.abs(result.matchWordBounds.centerY - targetAnchorY)).toBeLessThan(1.0);

    // Surrounding element must also be translated by the exact same vector
    const shiftedPrefix = result.elements.find((el) => el.id === 'prefix-1')!;
    expect(shiftedPrefix.x).toBe(400 + result.translationApplied.dx);
    expect(shiftedPrefix.y).toBe(100 + result.translationApplied.dy);
  });

  it('should maintain zero anchor drift across changing font sizes (24px to 160px)', () => {
    const fontSizes = [24, 48, 72, 96, 128, 160];

    for (const size of fontSizes) {
      const matchBounds = computeTextVisualBounds('KINETIC', 200, 300, 'Arial', size, 800, 'normal', 1, 'center', 'middle');
      const elements: TextElement[] = [
        {
          id: 'match-word',
          text: 'KINETIC',
          x: 200,
          y: 300,
          width: matchBounds.width,
          height: matchBounds.height,
          fontFamily: 'Arial',
          fontSize: size,
          fontWeight: 800,
          letterSpacing: 1,
          rotation: 0,
          opacity: 1,
          color: '#ffffff',
          alignment: 'center',
          zIndex: 10,
          isMatchWord: true,
          bounds: matchBounds,
        },
      ];

      const result = lockCompositionToAnchor(elements, 'match-word', targetAnchorX, targetAnchorY);
      const anchored = result.elements[0];

      expect(Math.abs(anchored.bounds.centerX - targetAnchorX)).toBeLessThan(1.0);
      expect(Math.abs(anchored.bounds.centerY - targetAnchorY)).toBeLessThan(1.0);
    }
  });

  it('should maintain zero anchor drift across different font families', () => {
    const families = ['Arial', 'Space Grotesk', 'Syne', 'Anton', 'Cinzel'];

    for (const family of families) {
      const matchBounds = computeTextVisualBounds('ANCHOR', 150, 450, family, 84, 700, 'normal', 0, 'center', 'middle');
      const elements: TextElement[] = [
        {
          id: 'test-word',
          text: 'ANCHOR',
          x: 150,
          y: 450,
          width: matchBounds.width,
          height: matchBounds.height,
          fontFamily: family,
          fontSize: 84,
          fontWeight: 700,
          letterSpacing: 0,
          rotation: 0,
          opacity: 1,
          color: '#ffffff',
          alignment: 'center',
          zIndex: 10,
          isMatchWord: true,
          bounds: matchBounds,
        },
      ];

      const result = lockCompositionToAnchor(elements, 'test-word', targetAnchorX, targetAnchorY);
      const anchored = result.elements[0];

      expect(Math.abs(anchored.bounds.centerX - targetAnchorX)).toBeLessThan(1.0);
      expect(Math.abs(anchored.bounds.centerY - targetAnchorY)).toBeLessThan(1.0);
    }
  });

  it('should anchor accurately with left, center, and right text alignments', () => {
    const alignments: ('left' | 'center' | 'right')[] = ['left', 'center', 'right'];

    for (const alignment of alignments) {
      const matchBounds = computeTextVisualBounds('ALIGN', 300, 400, 'Arial', 64, 700, 'normal', 0, alignment, 'middle');
      const elements: TextElement[] = [
        {
          id: 'align-test',
          text: 'ALIGN',
          x: 300,
          y: 400,
          width: matchBounds.width,
          height: matchBounds.height,
          fontFamily: 'Arial',
          fontSize: 64,
          fontWeight: 700,
          letterSpacing: 0,
          rotation: 0,
          opacity: 1,
          color: '#ffffff',
          alignment,
          zIndex: 10,
          isMatchWord: true,
          bounds: matchBounds,
        },
      ];

      const result = lockCompositionToAnchor(elements, 'align-test', targetAnchorX, targetAnchorY);
      const anchored = result.elements[0];

      expect(Math.abs(anchored.bounds.centerX - targetAnchorX)).toBeLessThan(1.0);
      expect(Math.abs(anchored.bounds.centerY - targetAnchorY)).toBeLessThan(1.0);
    }
  });

  it('should account for rotation transformations when locking anchor', () => {
    const rotations = [0, 15, 45, 90, -30];

    for (const rot of rotations) {
      const bounds = computeTextVisualBounds('ROTATED', 200, 200, 'Arial', 60, 800, 'normal', 0, 'center', 'middle');
      const elements: TextElement[] = [
        {
          id: 'rotated-match',
          text: 'ROTATED',
          x: 200,
          y: 200,
          width: bounds.width,
          height: bounds.height,
          fontFamily: 'Arial',
          fontSize: 60,
          fontWeight: 800,
          letterSpacing: 0,
          rotation: rot,
          opacity: 1,
          color: '#ffffff',
          alignment: 'center',
          zIndex: 10,
          isMatchWord: true,
          bounds,
        },
      ];

      const result = lockCompositionToAnchor(elements, 'rotated-match', targetAnchorX, targetAnchorY);
      const anchored = result.elements[0];

      // After translation, visual center (accounting for rotation) must align with target coordinates
      expect(Math.abs(result.matchWordBounds.centerX - targetAnchorX)).toBeLessThan(1.0);
      expect(Math.abs(result.matchWordBounds.centerY - targetAnchorY)).toBeLessThan(1.0);
    }
  });

  it('should throw an informative error if match element id is not found in composition', () => {
    const elements: TextElement[] = [
      {
        id: 'some-word',
        text: 'HELLO',
        x: 0,
        y: 0,
        width: 100,
        height: 50,
        fontFamily: 'Arial',
        fontSize: 30,
        fontWeight: 400,
        letterSpacing: 0,
        rotation: 0,
        opacity: 1,
        color: '#fff',
        alignment: 'center',
        zIndex: 1,
        isMatchWord: false,
        bounds: computeTextVisualBounds('HELLO', 0, 0, 'Arial', 30, 400, 'normal', 0, 'center', 'middle'),
      },
    ];

    expect(() => lockCompositionToAnchor(elements, 'missing-id', 500, 500)).toThrow(
      'Match element with id "missing-id" not found in composition.'
    );
  });
});
