import type { Player, Position } from '../engine/types';

/**
 * Squads for all 24 clubs of the 2008/09 League Two season, keyed by the
 * club ids in leagueTwo0809.ts. Same caveat and conventions as the other
 * leagues' squad files: a best-effort reconstruction from memory, not a
 * verified source — confidence here is the lowest of any league added so
 * far, since this is the most obscure division in the game, though the
 * club list itself and the promotion/relegation facts were checked
 * against Wikipedia (see leagueTwo0809.ts). Confidence is highest for the
 * clubs that actually went up or down that season (promoted: Brentford,
 * Exeter City, Wycombe Wanderers, Gillingham; relegated: Chester City,
 * Luton Town) and for well-known individual players, lower for squad
 * depth at the smaller clubs. Attribute numbers are placeholder filler
 * (see PLAN.md), not from the original.
 */

let counter = 0;
function mk(name: string, position: Position, age = 27, injured = false): Player {
  counter += 1;
  const overall = position === 'GK' ? 0 : 70;
  return {
    id: `l2-p${counter}-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
    name,
    position,
    age,
    injured,
    attributes: {
      pace: overall,
      shooting: overall,
      passing: overall,
      defending: overall,
      physical: overall,
      goalkeeping: overall === 0 ? 70 : 20,
    },
  };
}

export const REAL_SQUADS_LEAGUE_TWO_2008_09: Record<string, Player[]> = {
  'l2-brentford': [
    mk('Simon Royce', 'GK', 36), mk('Craig Woodman', 'DEF', 26), mk('Karleigh Osborne', 'DEF', 21), mk('Lewis Fenwick', 'MID', 25),
    mk('Sam Saunders', 'MID', 24), mk('Kevin O\'Connor', 'DEF', 25), mk('Glenn Poole', 'MID', 25), mk('Marcus Bean', 'MID', 23),
    mk('Charlie MacDonald', 'FWD', 24), mk('Nathan Elder', 'FWD', 20), mk('Lewis Blunden', 'DEF', 19), mk('Adam Griffiths', 'DEF', 22), mk('Jon Panayiotou', 'MID', 21),
  ],
  'l2-exeter': [
    mk('Paul Jones', 'GK', 42), mk('Scot Bennett', 'DEF', 20), mk('Danny Coles', 'DEF', 24), mk('Steven Tully', 'DEF', 27),
    mk('Matt Gill', 'MID', 25), mk('Richard Logan', 'FWD', 28), mk('Steve Tully', 'MID', 26), mk('John O\'Flynn', 'FWD', 28),
    mk('Dean Moxey', 'DEF', 24), mk('Craig Pargo', 'FWD', 22), mk('Alan Gow', 'MID', 25), mk('Richard Pym', 'GK', 24), mk('Sean Devine', 'FWD', 33),
  ],
  'l2-wycombe': [
    mk('Frank Talia', 'GK', 38), mk('Leon Johnson', 'DEF', 27), mk('Chris Vinnicombe', 'DEF', 37), mk('Mark Stallard', 'FWD', 35),
    mk('Scott McGleish', 'FWD', 33), mk('Jermaine Easter', 'FWD', 24), mk('Sam Wood', 'MID', 26), mk('Steve Brown', 'MID', 33),
    mk('Stuart Beavon', 'FWD', 23), mk('Michael Simpson', 'MID', 27), mk('Tommy Doherty', 'MID', 29), mk('Mark Rogers', 'DEF', 22), mk('Lewis Montrose', 'MID', 19),
  ],
  'l2-gillingham': [
    mk('Alan Julian', 'GK', 24), mk('Lewis Cardwell', 'FWD', 22), mk('Adam Miller', 'MID', 24), mk('Barry Fuller', 'DEF', 24),
    mk('Danny Jackman', 'DEF', 27), mk('Jack Midson', 'FWD', 23), mk('Dennis Oli', 'FWD', 22), mk('Andy Frampton', 'DEF', 29),
    mk('Mark Bentley', 'MID', 23), mk('Curtis Weston', 'MID', 21), mk('Garry Richards', 'DEF', 24), mk('Jo Kuffour', 'FWD', 28), mk('Ryan Hall', 'MID', 20),
  ],
  'l2-shrewsbury': [
    mk('Lewis Ingham', 'GK', 21), mk('Ben Davies', 'DEF', 19), mk('Marc Tierney', 'DEF', 22), mk('Scott Vernon', 'FWD', 24),
    mk('Grant Holt', 'FWD', 27), mk('Nathan Arnold', 'MID', 23), mk('Luke Rodgers', 'FWD', 26), mk('Lewis Buckley', 'FWD', 21),
    mk('Lewis Tewson', 'MID', 22), mk('Chris Humphrey', 'MID', 19), mk('Graham Evans', 'DEF', 27), mk('Shane Cansdell-Sherriff', 'DEF', 27), mk('Richard Hope', 'DEF', 28),
  ],
  'l2-bournemouth': [
    mk('Shwan Jalal', 'GK', 23), mk('Tony Pulis Jr', 'MID', 24), mk('Sam Vokes', 'FWD', 19), mk('Danny Hollands', 'MID', 23),
    mk('Brett Pitman', 'FWD', 20), mk('Warren Cummings', 'DEF', 25), mk('Shaun Cooper', 'DEF', 20), mk('Lewis Rigby', 'DEF', 25),
    mk('James Hayter', 'FWD', 28), mk('Joe Howe', 'MID', 20), mk('Marvin Bartley', 'MID', 21), mk('Jason Pearce', 'DEF', 22), mk('Jason Matthews', 'DEF', 27),
  ],
  'l2-rotherham': [
    mk('Lewis Rimmer', 'GK', 35), mk('Drewe Broughton', 'FWD', 28), mk('Ryan Cresswell', 'DEF', 18), mk('Jamie Green', 'DEF', 24),
    mk('Paul Hurst', 'DEF', 34), mk('Josh Law', 'MID', 25), mk('Lewis Farley', 'MID', 26), mk('Nathan Montgomery', 'MID', 21),
    mk('Mark Hudson', 'DEF', 28), mk('Lewis Whitmore', 'FWD', 29), mk('Jamie Yates', 'FWD', 19), mk('Chris Beardsley', 'FWD', 24), mk('Scott Shearer', 'GK', 24),
  ],
  'l2-chesterfield': [
    mk('Tommy Lee', 'GK', 22), mk('Jack Lester', 'FWD', 33), mk('Derek Niven', 'MID', 25), mk('Dean Holden', 'DEF', 29),
    mk('Craig Stanton', 'MID', 21), mk('Danny Whitaker', 'MID', 26), mk('Gary Roberts', 'MID', 24), mk('Wayne Boyd', 'DEF', 19),
    mk('Mark Allott', 'MID', 32), mk('Colin Larkin', 'FWD', 25), mk('Drissa Diallo', 'DEF', 26), mk('Jon-Paul McGovern', 'MID', 26), mk('Ian Breckin', 'DEF', 33),
  ],
  'l2-bradford': [
    mk('Simon Eastwood', 'GK', 19), mk('Zesh Rehman', 'DEF', 24), mk('David Wetherall', 'DEF', 37), mk('Luke O\'Brien', 'DEF', 19),
    mk('Lee Bullock', 'MID', 25), mk('Joe Colbeck', 'MID', 21), mk('Omar Daley', 'MID', 25), mk('Barry Conlon', 'FWD', 30),
    mk('Peter Thorne', 'FWD', 34), mk('Michael Flynn', 'MID', 29), mk('Tom Adeyemi', 'MID', 17), mk('Guy Branston', 'DEF', 29), mk('Lewis Tansey', 'GK', 20),
  ],
  'l2-grimsby': [
    mk('Phil Barnes', 'GK', 22), mk('Paul Raynor', 'DEF', 34), mk('Michael Pattison', 'DEF', 23), mk('Gary Jones', 'MID', 32),
    mk('Richard Hinds', 'DEF', 29), mk('Rob Atkinson', 'DEF', 23), mk('Michael Reddy', 'FWD', 25), mk('Isaiah Rankin', 'FWD', 30), mk('James Hunt', 'MID', 25),
    mk('John McDermott', 'DEF', 37), mk('Danny North', 'FWD', 22), mk('Jean-Paul Kamudimba Kalala', 'MID', 25), mk('Andy Monkhouse', 'FWD', 25), mk('Gary Bennett', 'MID', 28),
  ],
  'l2-port-vale': [
    mk('Lewis Henshall', 'GK', 27), mk('Chris Robertson', 'DEF', 25), mk('Doug Loft', 'MID', 21), mk('Tony Naylor', 'FWD', 36),
    mk('Marc Richards', 'FWD', 25), mk('Anthony Griffith', 'MID', 25), mk('Steve Jennings', 'MID', 24), mk('Danny Glover', 'FWD', 20),
    mk('Louis Dodds', 'MID', 23), mk('Gareth Owen', 'DEF', 26), mk('Mark McGregor', 'DEF', 28), mk('Adam Yates', 'DEF', 21), mk('Jamie Proctor', 'FWD', 18),
  ],
  'l2-notts-county': [
    mk('Russell Hoult', 'GK', 37), mk('Craig Oakes', 'DEF', 30), mk('Alan Marriott', 'GK', 27), mk('Jake Buxton', 'DEF', 22),
    mk('Jay Smith', 'MID', 27), mk('Craig Westcarr', 'FWD', 21), mk('Myles Weston', 'FWD', 19), mk('John Thompson', 'DEF', 28),
    mk('Richard Butcher', 'MID', 25), mk('Shaun Harrad', 'FWD', 24), mk('Neal Bishop', 'MID', 26), mk('Jonathan Forte', 'FWD', 22), mk('Kevin Rapley', 'DEF', 19),
  ],
  'l2-lincoln': [
    mk('Jake Kean', 'GK', 20), mk('Scott Kerr', 'MID', 22), mk('Josh Gowling', 'DEF', 24), mk('Paul Green', 'MID', 25),
    mk('Jamie Forrester', 'FWD', 33), mk('Alan Power', 'MID', 22), mk('Gavin McCallum', 'FWD', 22), mk('Cleveland Taylor', 'MID', 21),
    mk('Lewis Swift', 'DEF', 25), mk('Nathan Jarman', 'FWD', 21), mk('Peter Gain', 'MID', 32), mk('Ben Hutchinson', 'MID', 21), mk('Lewis Hunt', 'DEF', 23),
  ],
  'l2-rochdale': [
    mk('Sam Russell', 'GK', 27), mk('Frank Fielding', 'GK', 21),
    mk('Tom Kennedy', 'DEF', 23), mk('Nathan Stanton', 'DEF', 29), mk('Rory McArdle', 'DEF', 20), mk('Simon Ramsden', 'DEF', 26), mk('Scott Wiseman', 'DEF', 21),
    mk('Adam Rundle', 'MID', 27), mk('Ciaran Toner', 'MID', 27), mk('Clark Keltie', 'MID', 25), mk('Gary Jones', 'MID', 32), mk('Joe Thompson', 'MID', 19), mk('Will Buckley', 'MID', 19),
    mk('Adam Le Fondre', 'FWD', 22), mk('Chris Dagnall', 'FWD', 21), mk('Lee Thorpe', 'FWD', 32),
  ],
  'l2-accrington': [
    mk('Ian Dunbavin', 'GK', 27), mk('Richie Baker', 'MID', 25), mk('Robbie Threlfall', 'DEF', 20), mk('Peter Cavanagh', 'DEF', 29),
    mk('Luke Joyce', 'MID', 21), mk('Jimmy Ryan', 'MID', 20), mk('Andy Proctor', 'MID', 25), mk('Ian Craney', 'MID', 25),
    mk('Leam Richardson', 'DEF', 29), mk('Bobby Grant', 'FWD', 18), mk('Sean McConville', 'MID', 18), mk('Romauld Boco', 'FWD', 27), mk('Dean Winnard', 'DEF', 19),
  ],
  'l2-morecambe': [
    mk('Barry Roche', 'GK', 24), mk('Michael Twiss', 'DEF', 27), mk('Daniel Bogdanovic', 'FWD', 25), mk('Garry Thompson', 'MID', 25),
    mk('Shaun Whalley', 'MID', 19), mk('Stewart Drummond', 'MID', 29), mk('Craig Stanley', 'MID', 24), mk('Danny Carlton', 'MID', 30),
    mk('Jim Bentley', 'DEF', 29), mk('Craig Hinde', 'DEF', 23), mk('Michael Parker', 'DEF', 22), mk('Kevin Ellison', 'MID', 29), mk('Scott Mcguire', 'FWD', 27),
  ],
  'l2-darlington': [
    mk('Chris Porter', 'GK', 24), mk('Jon Shaw', 'FWD', 27), mk('Clark Keltie', 'DEF', 23), mk('Sam Collins', 'DEF', 24),
    mk('Marc Joseph', 'DEF', 30), mk('Wayne Brooks', 'MID', 28), mk('Ryan Valentine', 'DEF', 26), mk('Liam Hatch', 'FWD', 23),
    mk('Julian Joachim', 'MID', 34), mk('Gary Holt', 'MID', 36), mk('Jonathan Franks', 'MID', 24), mk('Gavin Cogdon', 'FWD', 24), mk('Kallum Higginbotham', 'FWD', 18),
  ],
  'l2-barnet': [
    mk('Ross Flitney', 'GK', 24), mk('Mark Butler', 'DEF', 26), mk('Albert Adomah', 'MID', 20), mk('Hershy Gordon', 'FWD', 23),
    mk('Giuliano Grazioli', 'FWD', 29), mk('Lee Harris', 'FWD', 27), mk('Andy Yoell', 'MID', 19), mk('John Nutter', 'DEF', 28),
    mk('Jean-Louis Akpa Akpro', 'DEF', 27), mk('Mark Marshall', 'MID', 18), mk('Sam Cox', 'DEF', 22), mk('Dean Beckwith', 'DEF', 25), mk('Ismail Yakubu', 'DEF', 24),
  ],
  'l2-aldershot': [
    mk('Nikki Bull', 'GK', 28), mk('Anthony Charles', 'DEF', 25), mk('Scott Donnelly', 'MID', 19), mk('Jamie Collins', 'MID', 19),
    mk('Marvin Morgan', 'FWD', 24), mk('Ben Harding', 'MID', 21), mk('John Grant', 'FWD', 30), mk('Bira Dembele', 'DEF', 29),
    mk('Ben Wright', 'FWD', 19), mk('Jermaine McGlashan', 'MID', 21), mk('Craig Watkins', 'DEF', 30), mk('Nicky Wroe', 'MID', 27), mk('Rob Gier', 'DEF', 27),
  ],
  'l2-dagenham': [
    mk('Tony Roberts', 'GK', 37), mk('Mark Arber', 'DEF', 30), mk('Scott Griffiths', 'DEF', 23), mk('Paul Benson', 'FWD', 25),
    mk('Danny Green', 'MID', 25), mk('Ben Strevens', 'MID', 32), mk('Jon Nurse', 'FWD', 26), mk('Charlie Lee', 'MID', 21),
    mk('Scott Doe', 'DEF', 20), mk('Craig Stone', 'MID', 25), mk('Shane Huke', 'MID', 25), mk('Georges Mandjeck', 'MID', 19), mk('Damian Spencer', 'FWD', 28),
  ],
  'l2-macclesfield': [
    mk('Tony Warner', 'GK', 33), mk('Jon Worthington', 'MID', 32), mk('Matthew Tipton', 'FWD', 28), mk('Chris Holroyd', 'FWD', 21),
    mk('Lewis Trotman', 'FWD', 24), mk('Kingsley James', 'MID', 25), mk('John Rooney', 'MID', 21), mk('Steve Williams', 'DEF', 29),
    mk('Waide Fairhurst', 'MID', 19), mk('Michael Welch', 'DEF', 24), mk('Peter Winn', 'FWD', 22), mk('Kyle Critchell', 'MID', 18), mk('David Artell', 'DEF', 28),
  ],
  'l2-bury': [
    mk('Glyn Garner', 'GK', 32), mk('Tom Shaw', 'MID', 24), mk('Michael Symes', 'FWD', 22), mk('Chris Senior', 'FWD', 28),
    mk('Chris Brandon', 'MID', 29), mk('Andy Bishop', 'FWD', 28), mk('David Buchanan', 'DEF', 20), mk('Kevin Sandwith', 'DEF', 28),
    mk('Craig Whitmore', 'MID', 29), mk('Mark Carrington', 'MID', 24), mk('Paul Scott', 'MID', 32), mk('Efe Sodje', 'DEF', 33), mk('Martin Bullock', 'MID', 29),
  ],
  'l2-chester': [
    mk('Mark Halstead', 'GK', 20), mk('Johnnie Jackson', 'MID', 26), mk('Nicky Southall', 'MID', 32), mk('Chris Shuker', 'MID', 26),
    mk('Lindon Meikle', 'MID', 26), mk('Craig Hobson', 'DEF', 26), mk('Sean Hessey', 'DEF', 27), mk('Chris Blackburn', 'DEF', 26),
    mk('Elliott Durrell', 'MID', 20), mk('Peter Thomas', 'DEF', 27), mk('Lewis Prendergast', 'FWD', 25), mk('Ryan Brown', 'MID', 22), mk('James Spencer', 'GK', 24),
  ],
  'l2-luton': [
    mk('Mark Tyler', 'GK', 32), mk('Chris Coyne', 'DEF', 30), mk('Calvin Andrew', 'FWD', 19), mk('Claude Gnakpa', 'MID', 21),
    mk('Kevin Nicholls', 'MID', 29), mk('Asa Hall', 'MID', 21), mk('Steve Robinson', 'MID', 34), mk('Paul Underwood', 'DEF', 30),
    mk('Dean Morgan', 'FWD', 26), mk('Chris Perkins', 'MID', 22), mk('Lewis Macklin', 'DEF', 29), mk('Jake Howells', 'MID', 18), mk('Curtis Osano', 'MID', 20),
  ],
};
