import { describe, it, expect } from 'vitest';
import { getFrameCompositionInfo } from '../engine/video/videoExporter';
import { Composition } from '../types/rendering';

describe('Timeline and frame timing calculations', () => {
  const dummyComps: Composition[] = [
    {
      id: 'comp-0',
      index: 0,
      duration: 1.0, // 0.0s to 1.0s
      elements: [],
      anchor: { x: 500, y: 500 },
      matchElementId: 'm0',
      matchWordBounds: { x: 0, y: 0, width: 100, height: 50, centerX: 500, centerY: 500 },
      layoutStyle: 'kinetic',
      seedUsed: 1,
    },
    {
      id: 'comp-1',
      index: 1,
      duration: 1.0, // 1.0s to 2.0s
      elements: [],
      anchor: { x: 500, y: 500 },
      matchElementId: 'm1',
      matchWordBounds: { x: 0, y: 0, width: 100, height: 50, centerX: 500, centerY: 500 },
      layoutStyle: 'editorial-left',
      seedUsed: 2,
    },
  ];

  it('should resolve correct active composition at time t', () => {
    const info0 = getFrameCompositionInfo(dummyComps, 0.4, 0.1);
    expect(info0.currentComp.id).toBe('comp-0');
    expect(info0.transitionProgress).toBe(0);

    const info1 = getFrameCompositionInfo(dummyComps, 1.4, 0.1);
    expect(info1.currentComp.id).toBe('comp-1');
  });

  it('should calculate transition progress near composition boundary', () => {
    // Transition duration is 0.1s, comp-0 ends at 1.0s. At 0.95s, progress is 0.5 (halfway)
    const info = getFrameCompositionInfo(dummyComps, 0.95, 0.1);
    expect(info.currentComp.id).toBe('comp-0');
    expect(info.nextComp?.id).toBe('comp-1');
    expect(info.transitionProgress).toBeCloseTo(0.5, 2);
  });
});
