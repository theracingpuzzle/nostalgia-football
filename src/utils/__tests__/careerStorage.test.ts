import { beforeEach, describe, expect, it } from 'vitest';
import { clearCareer, loadCareer, saveCareer, type EmployedSaveData, type UnemployedSaveData } from '../careerStorage';
import type { BackgroundLeagueState } from '../backgroundLeague';

function makeSave(overrides: Partial<EmployedSaveData> = {}): EmployedSaveData {
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

function makeUnemployedSave(overrides: Partial<UnemployedSaveData> = {}): UnemployedSaveData {
  const league: BackgroundLeagueState = { leagueId: 'championship', clubIds: ['chelsea', 'everton'], fixtures: [], nextSeed: 1, playoff: null, managers: {}, managerNews: [] };
  return {
    status: 'unemployed',
    managerName: 'Test Manager',
    seasonNumber: 2,
    leagues: [league],
    allSquads: {},
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
    expect((loadCareer() as EmployedSaveData | null)?.clubId).toBe('chelsea');
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

  it('round-trips the manager fields (job security, tenure, league managers, news, and a pending approach)', () => {
    const save = makeSave({
      leagueManagers: { chelsea: { name: null, confidence: 40, tenureStartMatchday: 25 }, everton: { name: 'David Moyes', confidence: 60, tenureStartMatchday: 1 } },
      managerJobSecurity: 32,
      managerTenureStartMatchday: 5,
      managerNews: [
        { clubId: 'chelsea', outgoingName: 'Luiz Felipe Scolari', incomingName: null, matchday: 25 },
        { clubId: 'fulham', outgoingName: null, incomingName: 'Roy Hodgson', matchday: 28 },
      ],
      managerApproachState: { clubId: 'everton' },
      managerLastApproachMatchday: 30,
    });
    saveCareer(save);
    expect(loadCareer()).toEqual(save);
  });

  it('loads an old save with none of the manager fields present', () => {
    const save = makeSave();
    saveCareer(save);
    const loaded = loadCareer() as EmployedSaveData | null;
    expect(loaded?.leagueManagers).toBeUndefined();
    expect(loaded?.managerJobSecurity).toBeUndefined();
    expect(loaded?.managerApproachState).toBeUndefined();
    expect(loaded?.managerLastApproachMatchday).toBeUndefined();
    expect(loaded?.seasonNumber).toBeUndefined();
  });

  it('round-trips seasonNumber', () => {
    const save = makeSave({ seasonNumber: 4 });
    saveCareer(save);
    expect((loadCareer() as EmployedSaveData | null)?.seasonNumber).toBe(4);
  });

  it('an old save with no `status` field still loads (treated as employed)', () => {
    const save = makeSave();
    expect(save.status).toBeUndefined();
    saveCareer(save);
    const loaded = loadCareer();
    expect(loaded).not.toBeNull();
    expect((loaded as EmployedSaveData).clubId).toBe('arsenal');
  });

  it('round-trips an unemployed save', () => {
    const save = makeUnemployedSave();
    saveCareer(save);
    expect(loadCareer()).toEqual(save);
  });

  it('rejects an unemployed-shaped save missing required fields', () => {
    localStorage.setItem('fsm-career-v1', JSON.stringify({ status: 'unemployed', managerName: 'Test Manager' }));
    expect(loadCareer()).toBeNull();
  });
});
