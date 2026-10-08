import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../utils/random';

describe('SeededRandom', () => {
  it('should generate deterministic sequence with identical seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    const values1 = [rng1.random(), rng1.int(1, 100), rng1.float(10, 20), rng1.boolean()];
    const values2 = [rng2.random(), rng2.int(1, 100), rng2.float(10, 20), rng2.boolean()];

    expect(values1).toEqual(values2);
  });

  it('should generate different sequences with different seeds', () => {
    const rng1 = new SeededRandom(1111);
    const rng2 = new SeededRandom(9999);

    expect(rng1.random()).not.toEqual(rng2.random());
  });

  it('should pick elements deterministically from array', () => {
    const arr = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
    const rng1 = new SeededRandom(777);
    const rng2 = new SeededRandom(777);

    expect(rng1.pick(arr)).toBe(rng2.pick(arr));
  });

  it('should shuffle arrays deterministically', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8];
    const rng1 = new SeededRandom(888);
    const rng2 = new SeededRandom(888);

    expect(rng1.shuffle(arr)).toEqual(rng2.shuffle(arr));
  });

  it('should respect range boundaries for int and float', () => {
    const rng = new SeededRandom(42);
    for (let i = 0; i < 50; i++) {
      const val = rng.int(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(15);
      expect(Number.isInteger(val)).toBe(true);

      const f = rng.float(2.5, 4.5);
      expect(f).toBeGreaterThanOrEqual(2.5);
      expect(f).toBeLessThan(4.5);
    }
  });
});
