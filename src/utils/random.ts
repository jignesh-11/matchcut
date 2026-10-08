/**
 * Deterministic seeded pseudo-random number generator (Mulberry32).
 * Fast, passes modern statistical tests, and guarantees exact reproducibility.
 */
export class SeededRandom {
  private s: number;

  constructor(seed: number = 1337) {
    this.s = Math.floor(seed) >>> 0;
    // Warm up the generator
    for (let i = 0; i < 5; i++) {
      this.next();
    }
  }

  private next(): number {
    let t = (this.s += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a float in [0, 1)
   */
  public random(): number {
    return this.next();
  }

  /**
   * Returns an integer in [min, max] inclusive
   */
  public int(min: number, max: number): number {
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns a float in [min, max)
   */
  public float(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Randomly picks one item from array
   */
  public pick<T>(array: readonly T[] | T[]): T {
    if (!array || array.length === 0) {
      throw new Error('Cannot pick from empty array');
    }
    const idx = Math.floor(this.next() * array.length);
    return array[idx];
  }

  /**
   * Returns a shuffled copy of an array using Fisher-Yates
   */
  public shuffle<T>(array: readonly T[] | T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }

  /**
   * Returns true with given probability [0, 1]
   */
  public boolean(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Create an independent child generator derived deterministically
   */
  public fork(): SeededRandom {
    const childSeed = Math.floor(this.next() * 0xffffffff);
    return new SeededRandom(childSeed);
  }
}
