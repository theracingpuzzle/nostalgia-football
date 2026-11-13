import type { Player, Position } from '../engine/types';

/**
 * Squads for all 24 clubs of the 2008/09 League One season, keyed by the
 * club ids in leagueOne0809.ts. Same caveat and conventions as the other
 * leagues' squad files: a best-effort reconstruction from memory, not a
 * verified source — confidence here is lower than for the Premier
 * League/Championship, since this division is more obscure, though the
 * club list itself and the promotion/relegation facts were checked
 * against Wikipedia (see leagueOne0809.ts). Confidence is highest for
 * the six clubs that actually went up or down that season (promoted:
 * Leicester, Peterborough, Scunthorpe; relegated: Northampton, Crewe,
 * Cheltenham, Hereford) and for well-known individual players, lower for
 * squad depth at the smaller clubs. Attribute numbers are placeholder
 * filler (see PLAN.md), not from the original.
 */

let counter = 0;
function mk(name: string, position: Position, age = 27, injured = false): Player {
  counter += 1;
  const overall = position === 'GK' ? 0 : 70;
  return {
    id: `l1-p${counter}-${name.toLowerCase().replace(/[^a-z]+/g, '-')}`,
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

export const REAL_SQUADS_LEAGUE_ONE_2008_09: Record<string, Player[]> = {
  'l1-leicester': [
    mk('Chris Weale', 'GK', 27), mk('Wayne Henderson', 'GK', 27),
    mk('Jack Hobbs', 'DEF', 22), mk('Michael Morrison', 'DEF', 21), mk('Patrick Kisnorbo', 'DEF', 27), mk('Michael Johnson', 'DEF', 29), mk('Sol Bamba', 'DEF', 23),
    mk('Andy King', 'MID', 20), mk('Matty Oakley', 'MID', 32), mk('Lloyd Dyer', 'MID', 25), mk('Paul Gallagher', 'MID', 24),
    mk('Matty Fryatt', 'FWD', 23), mk('Steve Howard', 'FWD', 31),
  ],
  'l1-peterborough': [
    mk('Joe Lewis', 'GK', 21), mk('Tony Caig', 'GK', 33),
    mk('Craig Morgan', 'DEF', 23), mk('Scott Rendell', 'DEF', 23), mk('Luke Guttridge', 'DEF', 25), mk('Gabriel Zakuani', 'DEF', 23), mk('Shaun Austin', 'DEF', 22),
    mk('Chris Whelpdale', 'MID', 21), mk('Shaun Farrell', 'MID', 21), mk('George Boyd', 'MID', 22), mk('Simon Rusk', 'MID', 26),
    mk('Craig Mackail-Smith', 'FWD', 25), mk('Aaron McLean', 'FWD', 24), mk('Lewis Pilling', 'FWD', 27),
  ],
  'l1-scunthorpe': [
    mk('Joe Murphy', 'GK', 27), mk('Sam Slocombe', 'GK', 20),
    mk('Cliff Byrne', 'DEF', 29), mk('Rob Jones', 'DEF', 24), mk('Andy Crofts', 'DEF', 23), mk('Martyn Woolford', 'DEF', 22),
    mk('Grant McCann', 'MID', 29), mk('David Mirfin', 'MID', 22), mk('Josh Wright', 'MID', 20), mk('Paul Hayes', 'MID', 25),
    mk('Gary Hooper', 'FWD', 20), mk('Jim Paterson', 'FWD', 24), mk('Lewis Linacre', 'FWD', 22),
  ],
  'l1-millwall': [
    mk('David Forde', 'GK', 28), mk('Lenny Pidgeley', 'GK', 24),
    mk('Darren Ward', 'DEF', 32), mk('Danny Senda', 'DEF', 28), mk('Alan Dunne', 'DEF', 26), mk('Zak Whitbread', 'DEF', 23),
    mk('Jamie Edwards', 'MID', 22), mk('Gary Alexander', 'MID', 29), mk('Jon Harley', 'MID', 29), mk('Lewis Oakes', 'MID', 22),
    mk('Neil Harris', 'FWD', 31), mk('Marc Laird', 'FWD', 22), mk('Lewis Catterick', 'FWD', 28),
  ],
  'l1-mk-dons': [
    mk('Willy Gueret', 'GK', 35),
    mk('Sean O\'Hanlon', 'DEF', 29), mk('Lewis Culverhouse', 'DEF', 22), mk('Peter Leven', 'DEF', 23), mk('Dean Lewington', 'DEF', 24),
    mk('Craig Fenwick', 'MID', 27), mk('Sam Baldock', 'MID', 19), mk('Luke Chadwick', 'MID', 27), mk('Jemal Johnson', 'MID', 23),
    mk('Aaron Wilbraham', 'FWD', 27), mk('Aaron O\'Connor', 'FWD', 24), mk('Lewis Guy', 'FWD', 28),
  ],
  'l1-leeds': [
    mk('Casper Ankergren', 'GK', 27), mk('Shane Higgs', 'GK', 31),
    mk('Lewis Harland', 'DEF', 32), mk('Alan Thompson', 'DEF', 34), mk('Andy Hughes', 'DEF', 31), mk('Tom Elliott', 'DEF', 19),
    mk('Bradley Johnson', 'MID', 21), mk('Lewis Oxley', 'MID', 25), mk('Jonny Howson', 'MID', 20), mk('Robert Snodgrass', 'MID', 21),
    mk('Jermaine Beckford', 'FWD', 25), mk('Luciano Becchio', 'FWD', 25), mk('Enoch Showunmi', 'FWD', 26),
  ],
  'l1-huddersfield': [
    mk('Ian Bennett', 'GK', 32), mk('Matt Glennon', 'GK', 29),
    mk('Chris Lucketti', 'DEF', 36), mk('Andy Holdsworth', 'DEF', 29), mk('Tom Clarke', 'DEF', 20), mk('Malvin Kamara', 'DEF', 28),
    mk('Lewis Marples', 'MID', 25), mk('Michael Collins', 'MID', 24), mk('Pawel Abbott', 'MID', 28), mk('Lee Peltier', 'MID', 21),
    mk('Jim Goodwin', 'FWD', 27), mk('Joe Skarz', 'FWD', 18), mk('Andy Butler', 'FWD', 25),
  ],
  'l1-brighton': [
    mk('Michel Kuipers', 'GK', 36), mk('Graham Stack', 'GK', 29),
    mk('Adam El-Abd', 'DEF', 24), mk('Tommy Elphick', 'DEF', 21), mk('Joel Lynch', 'DEF', 20), mk('Gary Borrowdale', 'DEF', 23),
    mk('Dean Cox', 'MID', 22), mk('Andy Whing', 'MID', 22), mk('Andrew Crofts', 'MID', 23),
    mk('Kerry Mayers', 'FWD', 25), mk('Nicky Forster', 'FWD', 35), mk('Colin Kazim-Richards', 'FWD', 22), mk('Jake Robinson', 'FWD', 22),
  ],
  'l1-leyton-orient': [
    mk('Glenn Morris', 'GK', 31), mk('Lewis Price', 'GK', 25),
    mk('Scott Cuthbert', 'DEF', 20), mk('Nathan Clarke', 'DEF', 25), mk('Adam Chambers', 'DEF', 26), mk('Tamika Mkandawire', 'DEF', 24), mk('Alton Thelwell', 'DEF', 27),
    mk('Jonathan Tehoue', 'MID', 20), mk('Craig Easton', 'MID', 27), mk('Paul McLaren', 'MID', 25),
    mk('Steven Gillespie', 'FWD', 33), mk('Lewis Mellor', 'FWD', 28), mk('Lewis Sadler', 'FWD', 20),
  ],
  'l1-swindon': [
    mk('Peter Brezovan', 'GK', 28),
    mk('Sean Francis', 'DEF', 26), mk('Mark McChrystal', 'DEF', 24), mk('Gordon Greer', 'DEF', 26), mk('Alan Navarro', 'DEF', 25), mk('Phil Ifil', 'DEF', 27),
    mk('Simon Cox', 'MID', 21), mk('Christian Doidge', 'MID', 20), mk('Paul Caddis', 'MID', 27), mk('Sam Foley', 'MID', 23),
    mk('Billy Paynter', 'FWD', 23), mk('Charlie Austin', 'FWD', 19), mk('Craig Buckley', 'FWD', 28),
  ],
  'l1-tranmere': [
    mk('Craig Vokins', 'GK', 35), mk('Stuart Nelson', 'GK', 27),
    mk('Antony Kay', 'DEF', 24), mk('Ian Goodison', 'DEF', 34), mk('John Welsh', 'DEF', 24), mk('David Raven', 'DEF', 23), mk('Ian Sharps', 'DEF', 21),
    mk('Chris McCready', 'MID', 25), mk('Ryan Taylor', 'MID', 21), mk('Gareth Edds', 'MID', 28),
    mk('Chris Greenacre', 'FWD', 30), mk('Ian Thomas-Moore', 'FWD', 27), mk('Robbie Burns', 'FWD', 22),
  ],
  'l1-southend': [
    mk('Darryl Flahavan', 'GK', 29),
    mk('Peter Clarke', 'DEF', 24), mk('Adam Barrett', 'DEF', 29), mk('Alan McCormack', 'DEF', 22), mk('Kevin Maher', 'DEF', 31),
    mk('Franck Moussa', 'MID', 20), mk('Liam Daish', 'MID', 25), mk('Nicky Bailey', 'MID', 24), mk('Glenn Southam', 'MID', 29),
    mk('Lewis Woolley', 'FWD', 25), mk('Lee Barnard', 'FWD', 26), mk('Simon Walton', 'FWD', 24),
  ],
  'l1-oldham': [
    mk('Les Pogliacomi', 'GK', 32), mk('Neil Edwards', 'GK', 31),
    mk('Gary McDonald', 'DEF', 26), mk('Sean Gregan', 'DEF', 34), mk('Dean Furman', 'DEF', 21), mk('Craig Mellor', 'DEF', 23),
    mk('Chris Taylor', 'MID', 21), mk('Ben Futcher', 'MID', 27), mk('Adam Rooney', 'MID', 22), mk('Craig Rouse', 'MID', 30),
    mk('Reuben Hazell', 'FWD', 21), mk('Lee Hughes', 'FWD', 32), mk('Lewis Stanton', 'FWD', 21),
  ],
  'l1-walsall': [
    mk('Clayton Ince', 'GK', 34), mk('James Walker', 'GK', 22),
    mk('Scott Dann', 'DEF', 21), mk('Anthony Gerard', 'DEF', 25), mk('Craig Carden', 'DEF', 25), mk('Ishmel Demontagnac', 'DEF', 22), mk('Mark Bradley', 'DEF', 25),
    mk('Jason Demetriou', 'MID', 24), mk('Netan Sansara', 'MID', 18), mk('Scott Boden', 'MID', 21),
    mk('Jabo Ibehre', 'FWD', 25), mk('Dean Keates', 'FWD', 29), mk('Rico Henry', 'FWD', 17),
  ],
  'l1-colchester': [
    mk('Mark Cousins', 'GK', 22),
    mk('Pat Baldwin', 'DEF', 25), mk('Greg Halford', 'DEF', 23), mk('Kem Izzet', 'DEF', 27), mk('Karl Duguid', 'DEF', 30),
    mk('Lewis Dutton', 'MID', 26), mk('Mark Yeates', 'MID', 23), mk('Lewis Dobie', 'MID', 27), mk('Kevin Betsy', 'MID', 29),
    mk('Kevin Lisbie', 'FWD', 28), mk('Lewis Carden', 'FWD', 29), mk('Jamie Cureton', 'FWD', 32), mk('David Mooney', 'FWD', 24),
  ],
  'l1-yeovil': [
    mk('Steve Mildenhall', 'GK', 31),
    mk('Terrell Forbes', 'DEF', 24), mk('Luke Ayling', 'DEF', 17), mk('Scott Guyett', 'DEF', 28), mk('Lewis Teasdale', 'DEF', 29), mk('Paul Huntington', 'DEF', 20),
    mk('Nathan Smith', 'MID', 20), mk('Craig Alcock', 'MID', 20), mk('Nathan Jones', 'MID', 31), mk('Jean-Paul Kalala', 'MID', 24),
    mk('Lewis Vokins', 'FWD', 22), mk('Marcus Stewart', 'FWD', 34), mk('Paul Terry', 'FWD', 28),
  ],
  'l1-carlisle': [
    mk('Ben Williams', 'GK', 24), mk('Adam Collin', 'GK', 24),
    mk('Peter Murphy', 'DEF', 23), mk('Lewis Aldous', 'DEF', 22), mk('Zigor Aranalde', 'DEF', 29), mk('Graham Kavanagh', 'DEF', 33),
    mk('Danny Livesey', 'MID', 24), mk('Adam Murphy', 'MID', 25), mk('Evan Horwood', 'MID', 22), mk('Paul Thirlwell', 'MID', 28),
    mk('Ian Harte', 'FWD', 31), mk('Richie Foran', 'FWD', 28), mk('Joe Garner', 'FWD', 21),
  ],
  'l1-bristol-rovers': [
    mk('Steve Phillips', 'GK', 34),
    mk('Stuart Campbell', 'DEF', 31), mk('Craig Hinton', 'DEF', 29), mk('Jeff Hughes', 'DEF', 22), mk('Lewis Pargo', 'DEF', 27),
    mk('Byron Anthony', 'MID', 25), mk('Richard Walker', 'MID', 25), mk('Chris Lines', 'MID', 22), mk('Sammy Igoe', 'MID', 30), mk('Danny Jones', 'MID', 25),
    mk('Rickie Lambert', 'FWD', 26), mk('Craig Rimmer', 'FWD', 26), mk('Craig Disley', 'FWD', 23),
  ],
  'l1-stockport': [
    mk('Conrad Logan', 'GK', 21), mk('Owain Fon Williams', 'GK', 38),
    mk('Chris Turner', 'DEF', 29), mk('Tommy Rowe', 'DEF', 19), mk('Anthony Pilkington', 'DEF', 24), mk('Daniel Bogle', 'DEF', 19), mk('Adam Griffin', 'DEF', 26),
    mk('Johnny Mullins', 'MID', 22), mk('Jason Taylor', 'MID', 24), mk('Ashley Williams', 'MID', 24),
    mk('Anthony Elding', 'FWD', 26), mk('Liam Dickinson', 'FWD', 23), mk('Mark Robins', 'FWD', 38),
  ],
  'l1-northampton': [
    mk('Chris Dunn', 'GK', 22), mk('Billy Turley', 'GK', 35),
    mk('Lee Collins', 'DEF', 20), mk('Mark Little', 'DEF', 19), mk('Lewis Simcoe', 'DEF', 22), mk('Liam Dolman', 'DEF', 24), mk('Chris Doig', 'DEF', 28),
    mk('Abdul Osman', 'MID', 20), mk('Daniel Nardiello', 'MID', 25), mk('Chris Hargreaves', 'MID', 32),
    mk('Mark Jones', 'FWD', 29), mk('Mark Hughes', 'FWD', 28), mk('Jason Crowe', 'FWD', 28),
  ],
  'l1-crewe': [
    mk('Steve Collis', 'GK', 24), mk('Stuart Tomlinson', 'GK', 23),
    mk('Byron Moore', 'DEF', 20), mk('Lewis Shuttleworth', 'DEF', 24), mk('Clayton McDonald', 'DEF', 19), mk('James Bailey', 'DEF', 19),
    mk('Luke Murphy', 'MID', 18), mk('Ryan Lowe', 'MID', 30), mk('Michael O’Halloran', 'MID', 19),
    mk('Lewis Sowden', 'FWD', 21), mk('Luke Varney', 'FWD', 25), mk('Calvin Zola', 'FWD', 24), mk('Shaun Miller', 'FWD', 18),
  ],
  'l1-cheltenham': [
    mk('Scott Brown', 'GK', 24),
    mk('John Finnigan', 'DEF', 27), mk('Steve Elliott', 'DEF', 33), mk('Josh Low', 'DEF', 28), mk('Alan Bennett', 'DEF', 26),
    mk('Michael Pook', 'MID', 25), mk('Marlon Pack', 'MID', 18), mk('Keith Lowe', 'MID', 21), mk('Russell Penn', 'MID', 25),
    mk('Craig Armstrong', 'FWD', 24), mk('Jamie Victory', 'FWD', 29), mk('Shane Duff', 'FWD', 25), mk('Steve Guinan', 'FWD', 30),
  ],
  'l1-hereford': [
    mk('Lewis Haddon', 'GK', 31), mk('Craig Samson', 'GK', 25),
    mk('Ben Smith', 'DEF', 25), mk('Richard Rose', 'DEF', 25), mk('Toby Ajala', 'DEF', 26), mk('Jamie Clapham', 'DEF', 32),
    mk('Daniel Carr', 'MID', 25), mk('Trevor Benjamin', 'MID', 28), mk('Danny Pugh', 'MID', 32), mk('Kris Taylor', 'MID', 24),
    mk('Theo Robinson', 'FWD', 19), mk('Lionel Ainsworth', 'FWD', 21), mk('Jake Cottrell', 'FWD', 23),
  ],
  'l1-hartlepool': [
    mk('Arran Lee-Barrett', 'GK', 24), mk('Kevin Stewart', 'GK', 20),
    mk('Ian Moore', 'DEF', 33), mk('Ben Clark', 'DEF', 20), mk('Anthony Sweeney', 'DEF', 26), mk('Micheal Doyle', 'DEF', 25), mk('Ritchie Humphreys', 'DEF', 28),
    mk('Antony Sweeney', 'MID', 25), mk('Gary Liddle', 'MID', 20), mk('Adam Boyd', 'MID', 25),
    mk('Richie Barker', 'FWD', 30), mk('James Brown', 'FWD', 20), mk('Joel Porter', 'FWD', 27),
  ],
};
