import { beforeEach, describe, expect, it } from 'vitest';
import { clearCareer, loadCareer, saveCareer, type CareerSaveData } from '../careerStorage';

function makeSave(overrides: Partial<CareerSaveData> = {}): CareerSaveData {
  return {
    clubId: 'arsenal',
    leagueId: 'premier-league',
    managerName: 'Test Manager',
    screen: 'team',
    formationId: '4-4-2',
    selectedXI: ['p1', 'p2'],
    fixtures: [],
    nextSeed: 42,
    lastPlayedFixtureId: null,
    allSquads: { arsenal: [] },
    transferWindow: null,
    januaryWindowShown: false,
    transferOffers: [],
    transferTimeline: [],
    seasonSummaryDismissed: false,
    ...overrides,
  };
}

describe('careerStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when nothing has been saved', () => {
    expect(loadCareer()).toBeNull();
  });

  it('round-trips a saved career', () => {
    const save = makeSave();
    saveCareer(save);
    expect(loadCareer()).toEqual(save);
  });

  it('overwrites the single save slot rather than keeping multiple', () => {
    saveCareer(makeSave({ clubId: 'arsenal' }));
    saveCareer(makeSave({ clubId: 'chelsea' }));
    expect(loadCareer()?.clubId).toBe('chelsea');
  });

  it('clearCareer removes the save', () => {
    saveCareer(makeSave());
    clearCareer();
    expect(loadCareer()).toBeNull();
  });

  it('rejects corrupted JSON rather than throwing', () => {
    localStorage.setItem('fsm-career-v1', '{not valid json');
    expect(loadCareer()).toBeNull();
  });

  it('rejects well-formed JSON that is missing required fields', () => {
    localStorage.setItem('fsm-career-v1', JSON.stringify({ foo: 'bar' }));
    expect(loadCareer()).toBeNull();
  });
});
