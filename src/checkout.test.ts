import { describe, expect, it } from 'vitest';
import { getCheckout } from './checkout';
import { dartLabel } from './engine';

const route = (rest: number, left = 3, out: 'single' | 'double' | 'master' = 'double') =>
  getCheckout(rest, left, out)?.map(dartLabel).join(' ') ?? null;

describe('getCheckout', () => {
  it('klassische Checkouts', () => {
    expect(route(170)).toBe('T20 T20 Bull');
    expect(route(40)).toBe('D20');
    expect(route(100)).toBe('T20 D20');
    expect(route(2)).toBe('D1');
    expect(route(50)).toBe('Bull');
  });

  it('Bogey-Zahlen haben keinen Checkout', () => {
    for (const n of [169, 168, 166, 165, 163, 162, 159]) expect(route(n)).toBeNull();
  });

  it('Rest 1 und > 170 gehen bei Double-Out nicht', () => {
    expect(route(1)).toBeNull();
    expect(route(171)).toBeNull();
  });

  it('respektiert die verbleibenden Darts', () => {
    expect(route(100, 1)).toBeNull();
    expect(route(100, 2)).toBe('T20 D20');
    expect(route(170, 2)).toBeNull();
  });

  it('Summe stimmt und letzter Dart ist ein Double bei allen 2-170', () => {
    for (let r = 2; r <= 170; r++) {
      const c = getCheckout(r, 3, 'double');
      if (!c) continue;
      expect(c.reduce((a, d) => a + d.value * d.mult, 0)).toBe(r);
      expect(c[c.length - 1].mult).toBe(2);
      expect(c.length).toBeLessThanOrEqual(3);
    }
  });

  it('Single-Out: 60 mit einem Dart', () => {
    expect(route(60, 3, 'single')).toBe('T20');
    expect(route(1, 3, 'single')).toBe('1');
  });

  it('Master-Out erlaubt Triple zum Beenden', () => {
    expect(route(57, 1, 'master')).toBe('T19');
  });
});
