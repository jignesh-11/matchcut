import { describe, it, expect } from 'vitest';
import { measureText, computeTextVisualBounds } from '../engine/text/measure';

describe('Text measurement engine', () => {
  it('should measure text dimensions with positive width and height', () => {
    const metrics = measureText('HELLO', 'Arial', 64, 700);

    expect(metrics.width).toBeGreaterThan(0);
    expect(metrics.height).toBeGreaterThan(0);
    expect(metrics.ascent).toBeGreaterThan(0);
  });

  it('should scale width proportionally with font size', () => {
    const mSmall = measureText('KINETIC', 'Arial', 32, 700);
    const mLarge = measureText('KINETIC', 'Arial', 64, 700);

    expect(mLarge.width).toBeGreaterThan(mSmall.width);
  });

  it('should account for letter spacing in calculated bounds', () => {
    const normal = measureText('SPACED', 'Arial', 40, 700, 'normal', 0);
    const spaced = measureText('SPACED', 'Arial', 40, 700, 'normal', 10);

    expect(spaced.width).toBeGreaterThan(normal.width);
  });

  it('should compute visual bounds and center point', () => {
    const bounds = computeTextVisualBounds(
      'MATCH',
      500,
      500,
      'Arial',
      80,
      800,
      'normal',
      0,
      'center',
      'middle'
    );

    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
    // Center alignment should put center X approximately at baseX (within 1px)
    expect(Math.abs(bounds.centerX - 500)).toBeLessThan(1);
  });
});
