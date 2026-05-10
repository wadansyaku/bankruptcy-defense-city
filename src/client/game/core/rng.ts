export interface Rng {
  readonly seed: string;
  state: number;
  next(): number;
  int(minInclusive: number, maxInclusive: number): number;
  float(minInclusive: number, maxExclusive: number): number;
  bool(probability: number): boolean;
  pick<T>(items: readonly T[]): T;
  fork(label: string): Rng;
}

export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export class DeterministicRng implements Rng {
  readonly seed: string;
  state: number;

  constructor(seed: string, state = hashString(seed)) {
    this.seed = seed;
    this.state = state >>> 0;
  }

  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
  }

  int(minInclusive: number, maxInclusive: number): number {
    const min = Math.ceil(minInclusive);
    const max = Math.floor(maxInclusive);
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(minInclusive: number, maxExclusive: number): number {
    return this.next() * (maxExclusive - minInclusive) + minInclusive;
  }

  bool(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error("Cannot pick from an empty array");
    }
    return items[this.int(0, items.length - 1)];
  }

  fork(label: string): Rng {
    return new DeterministicRng(`${this.seed}:${label}`, hashString(`${this.state}:${label}`));
  }
}

export function createRng(seed: string): Rng {
  return new DeterministicRng(seed);
}

export function deterministicNoise(seed: string, x: number, y: number, salt: string): number {
  const h = hashString(`${seed}:${salt}:${x},${y}`);
  let t = (h + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296;
}

