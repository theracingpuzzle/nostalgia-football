import { describe, expect, it } from 'vitest';
import { getLeagueZone, zonesForTier } from '../leagueZones';

describe('getLeagueZone', () => {
  it('top tier: top 4 champions, 5th-6th europa, bottom 3 relegation', () => {
    expect(getLeagueZone(4, 20, 'top')).toBe('champions');
    expect(getLeagueZone(5, 20, 'top')).toBe('europa');
    expect(getLeagueZone(6, 20, 'top')).toBe('europa');
    expect(getLeagueZone(7, 20, 'top')).toBeNull();
    expect(getLeagueZone(18, 20, 'top')).toBe('relegation');
    expect(getLeagueZone(20, 20, 'top')).toBe('relegation');
  });

  it('second tier (Championship): top 2 promotion, 3rd-6th playoff, bottom 3 relegation', () => {
    expect(getLeagueZone(2, 24, 'second')).toBe('promotion');
    expect(getLeagueZone(3, 24, 'second')).toBe('playoff');
    expect(getLeagueZone(6, 24, 'second')).toBe('playoff');
    expect(getLeagueZone(7, 24, 'second')).toBeNull();
    expect(getLeagueZone(22, 24, 'second')).toBe('relegation');
    expect(getLeagueZone(21, 24, 'second')).toBeNull();
  });

  it('third tier (League One): same shape as second, but relegates 4 not 3', () => {
    expect(getLeagueZone(2, 24, 'third')).toBe('promotion');
    expect(getLeagueZone(3, 24, 'third')).toBe('playoff');
    expect(getLeagueZone(6, 24, 'third')).toBe('playoff');
    expect(getLeagueZone(7, 24, 'third')).toBeNull();
    expect(getLeagueZone(21, 24, 'third')).toBe('relegation');
    expect(getLeagueZone(20, 24, 'third')).toBeNull();
  });

  it('fourth tier (League Two): top 3 automatic, 4th-7th playoff, bottom 2 relegation', () => {
    expect(getLeagueZone(3, 24, 'fourth')).toBe('promotion');
    expect(getLeagueZone(4, 24, 'fourth')).toBe('playoff');
    expect(getLeagueZone(7, 24, 'fourth')).toBe('playoff');
    expect(getLeagueZone(8, 24, 'fourth')).toBeNull();
    expect(getLeagueZone(23, 24, 'fourth')).toBe('relegation');
    expect(getLeagueZone(22, 24, 'fourth')).toBeNull();
  });
});

describe('zonesForTier', () => {
  it('top tier shows champions/europa/relegation', () => {
    expect(zonesForTier('top')).toEqual(['champions', 'europa', 'relegation']);
  });

  it('every non-top tier shows promotion/playoff/relegation', () => {
    expect(zonesForTier('second')).toEqual(['promotion', 'playoff', 'relegation']);
    expect(zonesForTier('third')).toEqual(['promotion', 'playoff', 'relegation']);
    expect(zonesForTier('fourth')).toEqual(['promotion', 'playoff', 'relegation']);
  });
});
