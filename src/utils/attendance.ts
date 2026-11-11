function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

/**
 * Simulated attendance — NOT a real historical figure. Deterministic per
 * fixture (same fixture id always produces the same number) so it doesn't
 * flicker between the match-day and full-time screens, scaled to 82%-99% of
 * the club's approximate capacity and rounded to the nearest 100.
 */
export function computeAttendance(fixtureId: string, capacity: number): number {
  const factor = 0.82 + hash01(fixtureId) * 0.17;
  return Math.round((capacity * factor) / 100) * 100;
}
