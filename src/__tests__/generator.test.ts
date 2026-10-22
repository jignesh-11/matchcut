import { describe, it, expect } from 'vitest';
import { MatchCutEngine } from '../engine/layout/compositionGenerator';
import { FontConfig } from '../types/editor';
import { LayoutStyle } from '../types/rendering';

describe('MatchCutEngine generation & layout quality', () => {
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

  it('should generate identical compositions given the exact same seed and settings (deterministic)', () => {
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

  it('should successfully generate valid compositions for all 12 layout presets', () => {
    const allPresets: LayoutStyle[] = [
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

    for (const style of allPresets) {
      const comps = MatchCutEngine.generate({
        text: 'Focus on shipping great products daily.',
        matchWord: 'shipping',
        canvasWidth: 1080,
        canvasHeight: 1920,
        targetAnchorX: 540,
        targetAnchorY: 960,
        count: 2,
        fontConfig,
        layoutStyle: style,
        seed: 42100,
      });

      expect(comps.length).toBe(2);
      expect(comps[0].elements.length).toBeGreaterThan(0);
      expect(comps[0].matchElementId).toBeDefined();
      expect(Math.abs(comps[0].matchWordBounds.centerX - 540)).toBeLessThan(2.0);
    }
  });

  it('should adapt layout cleanly when target anchor is near the top edge', () => {
    const comps = MatchCutEngine.generate({
      text: 'Prefix line one\nPrefix line two\nTarget word\nSuffix line',
      matchWord: 'Target',
      canvasWidth: 1080,
      canvasHeight: 1920,
      targetAnchorX: 540,
      targetAnchorY: 200, // Near top
      count: 3,
      fontConfig,
      layoutStyle: 'center-stack',
      seed: 88888,
    });

    expect(comps.length).toBe(3);
    for (const comp of comps) {
      // Anchor center is exactly at 200
      expect(Math.abs(comp.matchWordBounds.centerY - 200)).toBeLessThan(2.0);
      // Verify elements do not clip far into negative space
      for (const el of comp.elements) {
        expect(el.y - el.height / 2).toBeGreaterThan(-400);
      }
    }
  });

  it('should adapt layout cleanly when target anchor is near the bottom edge', () => {
    const comps = MatchCutEngine.generate({
      text: 'Prefix line\nTarget word\nSuffix line one\nSuffix line two\nSuffix line three',
      matchWord: 'Target',
      canvasWidth: 1080,
      canvasHeight: 1920,
      targetAnchorX: 540,
      targetAnchorY: 1720, // Near bottom
      count: 3,
      fontConfig,
      layoutStyle: 'center-stack',
      seed: 77777,
    });

    expect(comps.length).toBe(3);
    for (const comp of comps) {
      expect(Math.abs(comp.matchWordBounds.centerY - 1720)).toBeLessThan(2.0);
      for (const el of comp.elements) {
        expect(el.y + el.height / 2).toBeLessThan(1920 + 400);
      }
    }
  });

  it('should handle short inputs and isolated words gracefully', () => {
    const comps = MatchCutEngine.generate({
      text: 'SOLO',
      matchWord: 'SOLO',
      canvasWidth: 1080,
      canvasHeight: 1920,
      targetAnchorX: 540,
      targetAnchorY: 960,
      count: 3,
      fontConfig,
      layoutStyle: 'kinetic',
      seed: 12345,
    });

    expect(comps.length).toBe(3);
    for (const comp of comps) {
      expect(comp.elements.length).toBeGreaterThanOrEqual(1);
      expect(Math.abs(comp.matchWordBounds.centerX - 540)).toBeLessThan(2.0);
    }
  });
});
