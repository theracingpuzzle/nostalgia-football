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

  it('round-trips the manager fields (job security, tenure, league managers, news, and a pending sacking)', () => {
    const save = makeSave({
      leagueManagers: { chelsea: { name: 'Luiz Felipe Scolari', confidence: 40, tenureStartMatchday: 1 } },
      managerJobSecurity: 32,
      managerTenureStartMatchday: 5,
      managerNews: [{ clubId: 'chelsea', outgoingName: 'Luiz Felipe Scolari', incomingName: 'Guus Hiddink', matchday: 25 }],
      sackedState: { offeredClubIds: ['fulham', 'everton'] },
    });
    saveCareer(save);
    expect(loadCareer()).toEqual(save);
  });

  it('loads an old save with none of the manager fields present', () => {
    const save = makeSave();
    saveCareer(save);
    const loaded = loadCareer();
    expect(loaded?.leagueManagers).toBeUndefined();
    expect(loaded?.managerJobSecurity).toBeUndefined();
    expect(loaded?.sackedState).toBeUndefined();
  });
});
