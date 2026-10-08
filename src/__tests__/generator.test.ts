import { describe, it, expect } from 'vitest';
import { MatchCutEngine } from '../engine/layout/compositionGenerator';
import { FontConfig } from '../types/editor';

describe('MatchCutEngine generation', () => {
  const fontConfig: FontConfig = {
    family: 'Arial',
    weight: 800,
    size: 90,
    letterSpacing: 2,
    lineHeight: 1.2,
    textTransform: 'uppercase',
    color: '#ffffff',
    highlightColor: '#3b82f6',
  };

  const sampleText = `Build something people remember.
Make it simple.
Make it fast.
Make it yours.`;

  it('should generate identical compositions given the exact same seed and settings', () => {
    const opts = {
      text: sampleText,
      matchWord: 'Make',
      canvasWidth: 1080,
      canvasHeight: 1920,
      targetAnchorX: 540,
      targetAnchorY: 960,
      count: 4,
      fontConfig,
      layoutStyle: 'mixed' as const,
      seed: 48192,
    };

    const run1 = MatchCutEngine.generate(opts);
    const run2 = MatchCutEngine.generate(opts);

    expect(run1.length).toBe(4);
    expect(run2.length).toBe(4);

    // Deep equality of every element coordinate, text, and anchor in sequence
    expect(run1).toEqual(run2);
  });

  it('should generate different compositions given different seeds', () => {
    const runA = MatchCutEngine.generate({
      text: sampleText,
      matchWord: 'Make',
      canvasWidth: 1080,
      canvasHeight: 1920,
      targetAnchorX: 540,
      targetAnchorY: 960,
      count: 3,
      fontConfig,
      layoutStyle: 'mixed',
      seed: 11111,
    });

    const runB = MatchCutEngine.generate({
      text: sampleText,
      matchWord: 'Make',
      canvasWidth: 1080,
      canvasHeight: 1920,
      targetAnchorX: 540,
      targetAnchorY: 960,
      count: 3,
      fontConfig,
      layoutStyle: 'mixed',
      seed: 99999,
    });

    // Seeds are different, layout styles or element arrangements should vary
    expect(runA).not.toEqual(runB);
  });

  it('should maintain stable anchor point across all generated cuts in a sequence', () => {
    const targetX = 540;
    const targetY = 960;

    const comps = MatchCutEngine.generate({
      text: sampleText,
      matchWord: 'Make',
      canvasWidth: 1080,
      canvasHeight: 1920,
      targetAnchorX: targetX,
      targetAnchorY: targetY,
      count: 6,
      fontConfig,
      layoutStyle: 'mixed',
      seed: 34567,
    });

    for (const comp of comps) {
      expect(Math.abs(comp.matchWordBounds.centerX - targetX)).toBeLessThan(2.0);
      expect(Math.abs(comp.matchWordBounds.centerY - targetY)).toBeLessThan(2.0);
    }
  });

  it('should produce variations in surrounding layouts between cuts', () => {
    const comps = MatchCutEngine.generate({
      text: sampleText,
      matchWord: 'Make',
      canvasWidth: 1080,
      canvasHeight: 1920,
      targetAnchorX: 540,
      targetAnchorY: 960,
      count: 5,
      fontConfig,
      layoutStyle: 'mixed',
      seed: 55555,
    });

    // Check that layout styles or element counts vary across cuts
    const styles = comps.map((c) => c.layoutStyle);
    const uniqueStyles = new Set(styles);
    expect(uniqueStyles.size).toBeGreaterThan(1);
  });
});
