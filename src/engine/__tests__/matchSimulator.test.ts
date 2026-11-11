import { describe, expect, it } from 'vitest';
import { simulateMatch } from '../matchSimulator';
import type { Club, Formation, Player, PlayerAttributes, Position, TeamMatchInput } from '../types';

const FORMATION_442: Formation = {
  id: '4-4-2',
  name: '4-4-2',
  slots: [
    { position: 'GK', count: 1 },
    { position: 'DEF', count: 4 },
    { position: 'MID', count: 4 },
    { position: 'FWD', count: 2 },
  ],
  attackBias: 1,
  defenseBias: 1,
};

function makePlayer(id: string, position: Position, overrides: Partial<PlayerAttributes> = {}): Player {
  const base: PlayerAttributes = { pace: 60, shooting: 60, passing: 60, defending: 60, physical: 60, goalkeeping: 10 };
  return { id, name: id, position, age: 25, attributes: { ...base, ...overrides } };
}

function makeTeam(clubId: string, overrides: Partial<PlayerAttributes> = {}): TeamMatchInput {
  const club: Club = {
    id: clubId,
    name: clubId,
    shortName: clubId.slice(0, 3).toUpperCase(),
    colors: { primary: '#000', secondary: '#fff' },
    reputation: 60,
    players: [],
  };
  const selectedXI = (['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD'] as Position[]).map(
    (position, i) => makePlayer(`${clubId}-${position}-${i}`, position, overrides),
  );
  return { club, formation: FORMATION_442, selectedXI };
}

describe('simulateMatch', () => {
  it('is deterministic: the same seed always produces the same result', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');

    const resultA = simulateMatch({ fixtureId: 'f1', home, away, seed: 12345 });
    const resultB = simulateMatch({ fixtureId: 'f1', home, away, seed: 12345 });

    expect(resultA.homeGoals).toBe(resultB.homeGoals);
    expect(resultA.awayGoals).toBe(resultB.awayGoals);
    expect(resultA.events).toEqual(resultB.events);
  });

  it('produces different results for different seeds (not frozen output)', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');

    const results = Array.from({ length: 10 }, (_, i) => simulateMatch({ fixtureId: 'f1', home, away, seed: i }));
    const scorelines = new Set(results.map((r) => `${r.homeGoals}-${r.awayGoals}`));
    expect(scorelines.size).toBeGreaterThan(1);
  });

  it('gives the home side a measurable edge across many seeds, all else equal', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');

    let homeWins = 0;
    let awayWins = 0;
    const trials = 600;
    for (let seed = 0; seed < trials; seed++) {
      const result = simulateMatch({ fixtureId: 'f1', home, away, seed });
      if (result.homeGoals > result.awayGoals) homeWins++;
      if (result.awayGoals > result.homeGoals) awayWins++;
    }

    expect(homeWins).toBeGreaterThan(awayWins);
  });

  it('a much stronger side wins far more often than a much weaker one', () => {
    const strong = makeTeam('strong', { shooting: 90, pace: 90, passing: 85, defending: 85, physical: 85 });
    const weak = makeTeam('weak', { shooting: 25, pace: 25, passing: 30, defending: 30, physical: 30 });

    let strongWins = 0;
    const trials = 200;
    for (let seed = 0; seed < trials; seed++) {
      const result = simulateMatch({ fixtureId: 'f1', home: strong, away: weak, seed, applyHomeAdvantage: false });
      if (result.homeGoals > result.awayGoals) strongWins++;
    }

    expect(strongWins).toBeGreaterThan(trials * 0.8);
  });

  it('every goal event has a matching scorer entry', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');
    const result = simulateMatch({ fixtureId: 'f1', home, away, seed: 777 });

    const homeGoalEvents = result.events.filter((e) => e.type === 'goal' && e.side === 'home');
    const totalHomeScorerGoals = result.homeScorers.reduce((sum, s) => sum + s.minutes.length, 0);
    expect(homeGoalEvents.length).toBe(result.homeGoals);
    expect(totalHomeScorerGoals).toBe(result.homeGoals);
  });

  it('most (not all) goals get an assist, from a teammate rather than the scorer', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');
    let totalGoals = 0;
    let totalAssists = 0;
    for (let seed = 0; seed < 50; seed++) {
      const result = simulateMatch({ fixtureId: 'f1', home, away, seed });
      totalGoals += result.homeGoals + result.awayGoals;
      totalAssists += result.homeAssists.reduce((s, a) => s + a.minutes.length, 0) + result.awayAssists.reduce((s, a) => s + a.minutes.length, 0);
      for (const event of result.events) {
        if (event.type === 'goal' && event.assistPlayerId) expect(event.assistPlayerId).not.toBe(event.playerId);
      }
    }
    expect(totalAssists).toBeGreaterThan(0);
    expect(totalAssists).toBeLessThan(totalGoals);
  });

  it('records yellow-card events into the bookings tally', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');
    let foundABooking = false;
    for (let seed = 0; seed < 50 && !foundABooking; seed++) {
      const result = simulateMatch({ fixtureId: 'f1', home, away, seed });
      const bookingEvents = result.events.filter((e) => e.type === 'yellow-card');
      const totalBookings = result.homeBookings.reduce((s, b) => s + b.minutes.length, 0) + result.awayBookings.reduce((s, b) => s + b.minutes.length, 0);
      if (bookingEvents.length > 0) {
        expect(totalBookings).toBe(bookingEvents.length);
        foundABooking = true;
      }
    }
    expect(foundABooking).toBe(true);
  });
});
