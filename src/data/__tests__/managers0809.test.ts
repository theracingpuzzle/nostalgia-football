import { describe, expect, it } from 'vitest';
import { LEAGUES } from '../leagues';
import { PLACEHOLDER_MANAGER_POOL, REAL_MANAGERS_2008_09, getInitialManagerName } from '../managers0809';

describe('REAL_MANAGERS_2008_09', () => {
  it('covers every Premier League and La Liga club, and no one else', () => {
    const plIds = LEAGUES.find((l) => l.id === 'premier-league')!.clubs.map((c) => c.id);
    const laLigaIds = LEAGUES.find((l) => l.id === 'la-liga')!.clubs.map((c) => c.id);
    const realIds = Object.keys(REAL_MANAGERS_2008_09);

    expect(realIds.sort()).toEqual([...plIds, ...laLigaIds].sort());
  });

  it('has a non-empty, distinct name for every club', () => {
    const names = Object.values(REAL_MANAGERS_2008_09);
    expect(names.every((n) => n.trim().length > 0)).toBe(true);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('getInitialManagerName', () => {
  it('returns the real name for a Premier League/La Liga club', () => {
    expect(getInitialManagerName('man-utd')).toBe('Sir Alex Ferguson');
    expect(getInitialManagerName('ll-barcelona')).toBe('Pep Guardiola');
  });

  it('returns a deterministic placeholder for a club with no real data', () => {
    const first = getInitialManagerName('ch-barnsley');
    const second = getInitialManagerName('ch-barnsley');
    expect(first).toBe(second);
    expect(PLACEHOLDER_MANAGER_POOL).toContain(first);
  });

  it('gives different clubs a varied spread of placeholders, not all the same one', () => {
    const championshipIds = LEAGUES.find((l) => l.id === 'championship')!.clubs.map((c) => c.id);
    const picks = new Set(championshipIds.map((id) => getInitialManagerName(id)));
    expect(picks.size).toBeGreaterThan(1);
  });
});
