import { hashSeed } from '../engine/rng';

/**
 * Each club's manager at the start of the 2008/09 season.
 *
 * Real names cover the Premier League and La Liga only (40 clubs) —
 * sourced from each club's/manager's Wikipedia season article, same
 * method already used for crests and squads. Several needed
 * cross-checking against the club's actual in-season managerial
 * timeline to get the real AUGUST 2008 name right rather than whichever
 * manager a summary table happened to list most prominently — e.g. Real
 * Madrid started the season with Bernd Schuster, not Juande Ramos (who
 * only took over in December); Atlético Madrid started with Javier
 * Aguirre, not Abel Resino (who replaced him in February); Espanyol
 * started with Tintín Márquez, not Mauricio Pochettino (who only arrived
 * in January, after a further change in between).
 *
 * Every other league's clubs (Championship, League One, League Two)
 * don't have that research done yet, so they draw a clearly-invented
 * name from PLACEHOLDER_MANAGER_POOL instead — deterministic per club
 * (see getInitialManagerName), not random per render. Extend with real
 * names for those leagues later, same "not modeled yet" honesty already
 * used elsewhere (see PLAN.md).
 *
 * The in-season sacking/hiring simulation this data feeds (see
 * engine/managers.ts) is NOT a replay of real history — real 2008/09
 * managerial changes (Scolari→Hiddink at Chelsea, Ramos→Redknapp at
 * Tottenham, Ince→Allardyce at Blackburn, and others) happened, but this
 * engine already decides league position and promotion/relegation from
 * its own simulated results, never real ones, and a scripted historical
 * sacking would be the first thing to contradict that. These names are
 * only ever a real STARTING point.
 */
export const REAL_MANAGERS_2008_09: Record<string, string> = {
  'man-utd': 'Sir Alex Ferguson',
  liverpool: 'Rafael Benítez',
  chelsea: 'Luiz Felipe Scolari',
  arsenal: 'Arsène Wenger',
  everton: 'David Moyes',
  'aston-villa': "Martin O'Neill",
  fulham: 'Roy Hodgson',
  tottenham: 'Juande Ramos',
  'west-ham': 'Alan Curbishley',
  'man-city': 'Mark Hughes',
  wigan: 'Steve Bruce',
  stoke: 'Tony Pulis',
  bolton: 'Gary Megson',
  portsmouth: 'Harry Redknapp',
  blackburn: 'Paul Ince',
  sunderland: 'Roy Keane',
  hull: 'Phil Brown',
  newcastle: 'Kevin Keegan',
  middlesbrough: 'Gareth Southgate',
  'west-brom': 'Tony Mowbray',

  'll-real-madrid': 'Bernd Schuster',
  'll-barcelona': 'Pep Guardiola',
  'll-atletico-madrid': 'Javier Aguirre',
  'll-valencia': 'Unai Emery',
  'll-villarreal': 'Manuel Pellegrini',
  'll-sevilla': 'Manolo Jiménez',
  'll-deportivo': 'Miguel Ángel Lotina',
  'll-athletic-bilbao': 'Joaquín Caparrós',
  'll-mallorca': 'Gregorio Manzano',
  'll-malaga': 'Antonio Tapia',
  'll-racing-santander': 'Juan Ramón López Muñiz',
  'll-getafe': 'Víctor Muñoz',
  'll-osasuna': 'José Ángel Ziganda',
  'll-valladolid': 'José Luis Mendilibar',
  'll-espanyol': 'Tintín Márquez',
  'll-sporting-gijon': 'Manolo Preciado',
  'll-almeria': 'Gonzalo Arconada',
  'll-real-betis': 'Paco Chaparro',
  'll-numancia': 'Sergije Krešić',
  'll-recreativo-huelva': 'Manolo Zambrano',
};

/**
 * Clearly-invented names (not real people) for every club without a
 * sourced real manager yet, and for any AI replacement hire made during
 * a sacking simulation. Deliberately a bit larger-than-life/pun-ish so
 * nobody mistakes one for a real 2008/09 manager.
 */
export const PLACEHOLDER_MANAGER_POOL: string[] = [
  'Len Postlethwaite',
  'Barry Cruickshank',
  'Dennis Fairweather',
  'Eric Sedgefield',
  'Ron Attwater',
  'Malcolm Tiverton',
  'Trevor Buckhurst',
  'Geoff Harlestone',
  'Colin Pembrook',
  'Stan Whitlock',
  'Reg Ashcombe',
  'Norman Didsbury',
  'Keith Overstone',
  'Derek Mottram',
  'Arthur Brantingham',
  'Frank Oldcastle',
  'Walter Crowbridge',
  'Sid Gunnersley',
  'Cyril Hathersage',
  'Bernard Elmswood',
  'Victor Pensnett',
  'Leonard Shircliffe',
  'Harold Kingswear',
  'Clifford Ravenscroft',
];

/** A club's manager at the start of the season — real where researched, otherwise a deterministic (not random-per-render) placeholder pick, so the same club always gets the same invented name. */
export function getInitialManagerName(clubId: string): string {
  const real = REAL_MANAGERS_2008_09[clubId];
  if (real) return real;
  return PLACEHOLDER_MANAGER_POOL[hashSeed(clubId) % PLACEHOLDER_MANAGER_POOL.length];
}
