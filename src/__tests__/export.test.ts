import { describe, it, expect } from 'vitest';
import {
  getResolutionDimensions,
  getFrameCompositionInfo,
} from '../engine/video/videoExporter';
import { Composition } from '../types/rendering';

describe('Video Export Pipeline geometry and frame pacing', () => {
  describe('getResolutionDimensions', () => {
    it('should return correct 9:16 portrait dimensions', () => {
      expect(getResolutionDimensions('720p', '9:16')).toEqual({ width: 720, height: 1280 });
      expect(getResolutionDimensions('1080p', '9:16')).toEqual({ width: 1080, height: 1920 });
      expect(getResolutionDimensions('1440p', '9:16')).toEqual({ width: 1440, height: 2560 });
    });

    it('should return correct 1:1 square dimensions', () => {
      expect(getResolutionDimensions('720p', '1:1')).toEqual({ width: 720, height: 720 });
      expect(getResolutionDimensions('1080p', '1:1')).toEqual({ width: 1080, height: 1080 });
      expect(getResolutionDimensions('1440p', '1:1')).toEqual({ width: 1440, height: 1440 });
    });

    it('should return correct 16:9 landscape dimensions', () => {
      expect(getResolutionDimensions('720p', '16:9')).toEqual({ width: 1280, height: 720 });
      expect(getResolutionDimensions('1080p', '16:9')).toEqual({ width: 1920, height: 1080 });
      expect(getResolutionDimensions('1440p', '16:9')).toEqual({ width: 2560, height: 1440 });
    });
  });

  describe('getFrameCompositionInfo', () => {
    const mockCompositions: Composition[] = [
      {
        id: 'comp-0',
        index: 0,
        anchor: { x: 540, y: 960 },
        matchElementId: 'm0',
        matchWordBounds: { x: 440, y: 920, width: 200, height: 80, centerX: 540, centerY: 960 },
        duration: 1.0,
        layoutStyle: 'kinetic',
        seedUsed: 1,
        elements: [],
      },
      {
        id: 'comp-1',
        index: 1,
        anchor: { x: 540, y: 960 },
        matchElementId: 'm1',
        matchWordBounds: { x: 440, y: 920, width: 200, height: 80, centerX: 540, centerY: 960 },
        duration: 1.0,
        layoutStyle: 'center-stack',
        seedUsed: 2,
        elements: [],
      },
      {
        id: 'comp-2',
        index: 2,
        anchor: { x: 540, y: 960 },
        matchElementId: 'm2',
        matchWordBounds: { x: 440, y: 920, width: 200, height: 80, centerX: 540, centerY: 960 },
        duration: 1.0,
        layoutStyle: 'magazine',
        seedUsed: 3,
        elements: [],
      },
    ];

    it('should identify active composition during steady-state playback', () => {
      const info0 = getFrameCompositionInfo(mockCompositions, 0.4, 0.1);
      expect(info0.currentComp.id).toBe('comp-0');
      expect(info0.nextComp).toBeUndefined();
      expect(info0.transitionProgress).toBe(0);
      expect(info0.compositionIndex).toBe(0);

      const info1 = getFrameCompositionInfo(mockCompositions, 1.4, 0.1);
      expect(info1.currentComp.id).toBe('comp-1');
      expect(info1.nextComp).toBeUndefined();
      expect(info1.transitionProgress).toBe(0);
      expect(info1.compositionIndex).toBe(1);
    });

    it('should compute interpolation progress during transition window', () => {
      // Transition duration is 0.1s. Comp 0 ends at 1.0s. At 0.95s, time remaining is 0.05s (50% progress)
      const transInfo = getFrameCompositionInfo(mockCompositions, 0.95, 0.1);
      expect(transInfo.currentComp.id).toBe('comp-0');
      expect(transInfo.nextComp?.id).toBe('comp-1');
      expect(transInfo.transitionProgress).toBeCloseTo(0.5, 2);
    });

    it('should correctly handle the very final frame of playback without out-of-bounds error', () => {
      // Total duration is 3.0s. Test at 2.99s and 3.0s
      const finalInfo = getFrameCompositionInfo(mockCompositions, 2.99, 0.1);
      expect(finalInfo.currentComp.id).toBe('comp-2');
      expect(finalInfo.nextComp).toBeUndefined();
      expect(finalInfo.compositionIndex).toBe(2);

      const beyondInfo = getFrameCompositionInfo(mockCompositions, 3.5, 0.1);
      expect(beyondInfo.currentComp.id).toBe('comp-2');
    });
  });
});
