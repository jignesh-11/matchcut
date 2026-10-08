import { describe, it, expect } from 'vitest';
import { validateComposition } from '../engine/layout/validator';
import { Composition } from '../types/rendering';

describe('Composition validation', () => {
  const validComposition: Composition = {
    id: 'cut-0',
    index: 0,
    anchor: { x: 540, y: 960 },
    matchElementId: 'match-0',
    matchWordBounds: {
      x: 440,
      y: 920,
      width: 200,
      height: 80,
      centerX: 540,
      centerY: 960,
    },
    duration: 0.6,
    layoutStyle: 'kinetic',
    seedUsed: 1234,
    elements: [
      {
        id: 'match-0',
        text: 'FOCUS',
        x: 540,
        y: 960,
        width: 200,
        height: 80,
        fontFamily: 'Syne',
        fontSize: 90,
        fontWeight: 800,
        letterSpacing: 2,
        rotation: 0,
        opacity: 1,
        color: '#ffffff',
        alignment: 'center',
        zIndex: 10,
        isMatchWord: true,
        bounds: {
          x: 440,
          y: 920,
          width: 200,
          height: 80,
          centerX: 540,
          centerY: 960,
        },
      },
    ],
  };

  it('should pass validation for a valid composition', () => {
    const res = validateComposition(validComposition, 1080, 1920, 540, 960);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('should fail if match word element is missing', () => {
    const invalid = {
      ...validComposition,
      elements: [
        {
          ...validComposition.elements[0],
          id: 'other-id',
          isMatchWord: false,
        },
      ],
    };
    const res = validateComposition(invalid, 1080, 1920, 540, 960);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Match word element is missing');
  });

  it('should fail if match word anchor drifts outside tolerance', () => {
    const drifted = {
      ...validComposition,
      elements: [
        {
          ...validComposition.elements[0],
          bounds: {
            ...validComposition.elements[0].bounds,
            centerX: 600, // Drifts 60px away from 540
          },
        },
      ],
    };
    const res = validateComposition(drifted, 1080, 1920, 540, 960);
    expect(res.valid).toBe(false);
    expect(res.errors[0]).toContain('anchor drift detected');
  });

  it('should fail if coordinates contain NaN or Infinity', () => {
    const invalidCoords = {
      ...validComposition,
      elements: [
        {
          ...validComposition.elements[0],
          x: NaN,
        },
      ],
    };
    const res = validateComposition(invalidCoords, 1080, 1920, 540, 960);
    expect(res.valid).toBe(false);
    expect(res.errors.some((e) => e.includes('non-finite'))).toBe(true);
  });
});
