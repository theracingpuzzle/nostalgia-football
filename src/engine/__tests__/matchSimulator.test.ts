import { describe, expect, it } from 'vitest';
import { createMatchSimulation, simulateMatch } from '../matchSimulator';
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

  it('records red-card events into the red cards tally, rarer than bookings', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');
    let foundARedCard = false;
    let totalReds = 0;
    let totalBookings = 0;
    for (let seed = 0; seed < 50; seed++) {
      const result = simulateMatch({ fixtureId: 'f1', home, away, seed });
      const redEvents = result.events.filter((e) => e.type === 'red-card');
      totalReds += redEvents.length;
      totalBookings += result.events.filter((e) => e.type === 'yellow-card').length;
      if (redEvents.length > 0) {
        const tallied = result.homeRedCards.reduce((s, r) => s + r.minutes.length, 0) + result.awayRedCards.reduce((s, r) => s + r.minutes.length, 0);
        expect(tallied).toBe(redEvents.length);
        foundARedCard = true;
      }
    }
    expect(foundARedCard).toBe(true);
    expect(totalReds).toBeLessThan(totalBookings);
  });

  it('does not over-book goalkeepers relative to outfield players', () => {
    // A goalkeeper's `defending` attribute is a meaningless placeholder —
    // real squad data (realSquads2008_09.ts's mk()) sets it to 0 for GKs,
    // not a real skill of theirs, while outfield players get a normal
    // value. makeTeam()'s flat 60-for-everyone test defaults don't
    // reproduce that gap, so this test builds its own XI matching the
    // real data shape. Naively weighting cards by `100 - defending` made
    // a GK's card weight the highest on the pitch instead of one of the
    // lowest — backwards from how rarely real keepers get booked. With 1
    // GK out of 11 players, an unbiased engine books them close to 1/11
    // (~9%) of the time; the bug made it closer to 1 in 4.
    function makeRealisticTeam(clubId: string): TeamMatchInput {
      const club: Club = { id: clubId, name: clubId, shortName: clubId.slice(0, 3).toUpperCase(), colors: { primary: '#000', secondary: '#fff' }, reputation: 60, players: [] };
      const positions: Position[] = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD'];
      const selectedXI = positions.map((position, i) =>
        makePlayer(
          `${clubId}-${position}-${i}`,
          position,
          position === 'GK' ? { pace: 0, shooting: 0, passing: 0, defending: 0, physical: 0, goalkeeping: 70 } : { defending: 70 },
        ),
      );
      return { club, formation: FORMATION_442, selectedXI };
    }

    const home = makeRealisticTeam('home');
    const away = makeRealisticTeam('away');
    let gkCards = 0;
    let totalCards = 0;
    for (let seed = 0; seed < 500; seed++) {
      const result = simulateMatch({ fixtureId: 'f1', home, away, seed });
      for (const event of result.events) {
        if (event.type !== 'yellow-card' && event.type !== 'red-card') continue;
        totalCards += 1;
        if (event.playerId?.endsWith('-GK-0')) gkCards += 1;
      }
    }
    expect(totalCards).toBeGreaterThan(50); // enough of a sample to trust the ratio
    expect(gkCards / totalCards).toBeLessThan(0.07);
  });
});

describe('createMatchSimulation', () => {
  it('running it to 90 in one call matches simulateMatch exactly for the same seed', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');

    const viaWrapper = simulateMatch({ fixtureId: 'f1', home, away, seed: 555 });

    const sim = createMatchSimulation({ fixtureId: 'f1', home, away, seed: 555 });
    sim.advanceTo(90);
    const viaHandle = sim.getResult();

    expect(viaHandle).toEqual(viaWrapper);
  });

  it('advancing in two halves with no substitution matches one 90-minute call exactly', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');

    const whole = simulateMatch({ fixtureId: 'f1', home, away, seed: 909 });

    const sim = createMatchSimulation({ fixtureId: 'f1', home, away, seed: 909 });
    sim.advanceTo(45);
    sim.advanceTo(90);
    const halves = sim.getResult();

    expect(halves).toEqual(whole);
  });

  it('a substitute cannot be credited with events from before they came on', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');
    const sub = makePlayer('home-SUB-0', 'FWD');

    const sim = createMatchSimulation({ fixtureId: 'f1', home, away, seed: 42 });
    sim.advanceTo(45);
    const firstHalfResult = sim.getResult();
    const outgoing = home.selectedXI[9]; // a FWD
    sim.substitute('home', outgoing.id, sub);
    sim.advanceTo(90);
    const finalResult = sim.getResult();

    const subEventsBeforeComingOn = finalResult.events.filter((e) => e.playerId === sub.id && e.minute <= 45);
    expect(subEventsBeforeComingOn).toHaveLength(0);
    // Everything already decided in the first half is untouched by the substitution.
    expect(finalResult.events.filter((e) => e.minute <= 45)).toEqual(firstHalfResult.events);
  });

  it('a substitute can be credited with events after coming on', () => {
    const home = makeTeam('home', { shooting: 95, pace: 95, passing: 90 });
    const away = makeTeam('away', { shooting: 20, pace: 20, passing: 20, defending: 15 });

    let foundSubGoal = false;
    for (let seed = 0; seed < 100 && !foundSubGoal; seed++) {
      const sub = makePlayer('home-SUB-0', 'FWD', { shooting: 99 });
      const sim = createMatchSimulation({ fixtureId: 'f1', home, away, seed });
      sim.advanceTo(45);
      sim.substitute('home', home.selectedXI[9].id, sub);
      sim.advanceTo(90);
      const result = sim.getResult();
      if (result.events.some((e) => e.playerId === sub.id)) foundSubGoal = true;
    }
    expect(foundSubGoal).toBe(true);
  });

  it('homeXI/awayXI include both the starting XI and anyone subbed on', () => {
    const home = makeTeam('home');
    const away = makeTeam('away');
    const sub = makePlayer('home-SUB-0', 'FWD');
    const outgoing = home.selectedXI[9];

    const sim = createMatchSimulation({ fixtureId: 'f1', home, away, seed: 7 });
    sim.advanceTo(45);
    sim.substitute('home', outgoing.id, sub);
    sim.advanceTo(90);
    const result = sim.getResult();

    expect(result.homeXI).toContain(outgoing.id);
    expect(result.homeXI).toContain(sub.id);
  });
});
