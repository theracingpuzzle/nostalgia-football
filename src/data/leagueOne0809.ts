import type { ClubListing } from './premierLeague0809';

/**
 * The 24 clubs of the 2008/09 Football League One season (English third
 * tier) — the fourth league added beyond the Premier League, La Liga and
 * Championship (see PLAN.md).
 *
 * Unlike the earlier leagues, the club list and promotion/relegation
 * facts here were checked against Wikipedia (not pure recall) before
 * writing this file, given how much more obscure this division is:
 * champions Leicester City and runners-up Peterborough United were
 * promoted automatically; Scunthorpe United won the promotion playoff
 * final (beating Millwall 3-2, after beating Milton Keynes Dons in the
 * semis); Northampton Town, Crewe Alexandra, Cheltenham Town and
 * Hereford United were relegated (League One relegates 4 clubs, not 3 —
 * a genuine rule difference from the Championship, not an error). Colors/
 * kitPattern/stadium capacity are the usual best-effort approximation
 * (not verified), same caveat as every other league's club list. Club
 * ids are prefixed `l1-`.
 */
export const LEAGUE_ONE_2008_09: ClubListing[] = [
  { id: 'l1-leicester', name: 'Leicester City', shortName: 'LEI', primaryColor: '#003090', secondaryColor: '#FDBE11', crestPath: 'crests/l1-leicester.svg', kitPattern: 'solid', stadiumName: 'Walkers Stadium', stadiumCapacity: 32300 },
  { id: 'l1-peterborough', name: 'Peterborough United', shortName: 'PET', primaryColor: '#1D4D9B', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-peterborough.svg', kitPattern: 'solid', stadiumName: 'London Road', stadiumCapacity: 15300 },
  { id: 'l1-scunthorpe', name: 'Scunthorpe United', shortName: 'SCU', primaryColor: '#8A1538', secondaryColor: '#87CEEB', crestPath: 'crests/l1-scunthorpe.svg', kitPattern: 'stripes', stadiumName: 'Glanford Park', stadiumCapacity: 9000 },
  { id: 'l1-millwall', name: 'Millwall', shortName: 'MIL', primaryColor: '#001D5E', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-millwall.svg', kitPattern: 'solid', stadiumName: 'The Den', stadiumCapacity: 20000 },
  { id: 'l1-mk-dons', name: 'Milton Keynes Dons', shortName: 'MKD', primaryColor: '#FFFFFF', secondaryColor: '#000000', crestPath: 'crests/l1-mk-dons.svg', kitPattern: 'solid', stadiumName: 'Stadium MK', stadiumCapacity: 22000 },
  { id: 'l1-leeds', name: 'Leeds United', shortName: 'LEE', primaryColor: '#FFFFFF', secondaryColor: '#1D4289', crestPath: 'crests/l1-leeds.svg', kitPattern: 'solid', stadiumName: 'Elland Road', stadiumCapacity: 37900 },
  { id: 'l1-huddersfield', name: 'Huddersfield Town', shortName: 'HUD', primaryColor: '#0066B3', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-huddersfield.svg', kitPattern: 'stripes', stadiumName: 'Galpharm Stadium', stadiumCapacity: 24500 },
  { id: 'l1-brighton', name: 'Brighton & Hove Albion', shortName: 'BHA', primaryColor: '#0057B8', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-brighton.svg', kitPattern: 'stripes', stadiumName: 'Withdean Stadium', stadiumCapacity: 8850 },
  { id: 'l1-leyton-orient', name: 'Leyton Orient', shortName: 'ORI', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-leyton-orient.svg', kitPattern: 'solid', stadiumName: 'Matchroom Stadium', stadiumCapacity: 9300 },
  { id: 'l1-swindon', name: 'Swindon Town', shortName: 'SWI', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-swindon.svg', kitPattern: 'solid', stadiumName: 'County Ground', stadiumCapacity: 15700 },
  { id: 'l1-tranmere', name: 'Tranmere Rovers', shortName: 'TRA', primaryColor: '#FFFFFF', secondaryColor: '#000080', crestPath: 'crests/l1-tranmere.svg', kitPattern: 'solid', stadiumName: 'Prenton Park', stadiumCapacity: 16800 },
  { id: 'l1-southend', name: 'Southend United', shortName: 'SOU', primaryColor: '#0033A0', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-southend.svg', kitPattern: 'solid', stadiumName: 'Roots Hall', stadiumCapacity: 12400 },
  { id: 'l1-oldham', name: 'Oldham Athletic', shortName: 'OLD', primaryColor: '#004D98', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-oldham.svg', kitPattern: 'solid', stadiumName: 'Boundary Park', stadiumCapacity: 13500 },
  { id: 'l1-walsall', name: 'Walsall', shortName: 'WAL', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-walsall.svg', kitPattern: 'stripes', stadiumName: 'Bescot Stadium', stadiumCapacity: 11300 },
  { id: 'l1-colchester', name: 'Colchester United', shortName: 'COL', primaryColor: '#0033A0', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-colchester.svg', kitPattern: 'solid', stadiumName: 'Community Stadium', stadiumCapacity: 10000 },
  { id: 'l1-yeovil', name: 'Yeovil Town', shortName: 'YEO', primaryColor: '#00573F', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-yeovil.svg', kitPattern: 'solid', stadiumName: 'Huish Park', stadiumCapacity: 9600 },
  { id: 'l1-carlisle', name: 'Carlisle United', shortName: 'CAR', primaryColor: '#1B5FAA', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-carlisle.svg', kitPattern: 'solid', stadiumName: 'Brunton Park', stadiumCapacity: 9700 },
  { id: 'l1-bristol-rovers', name: 'Bristol Rovers', shortName: 'BRI', primaryColor: '#1B5FAA', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-bristol-rovers.svg', kitPattern: 'halves', stadiumName: 'Memorial Stadium', stadiumCapacity: 12000 },
  { id: 'l1-stockport', name: 'Stockport County', shortName: 'STO', primaryColor: '#0033A0', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-stockport.svg', kitPattern: 'stripes', stadiumName: 'Edgeley Park', stadiumCapacity: 10800 },
  { id: 'l1-northampton', name: 'Northampton Town', shortName: 'NTC', primaryColor: '#7A1E3A', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-northampton.svg', kitPattern: 'solid', stadiumName: 'Sixfields Stadium', stadiumCapacity: 7600 },
  { id: 'l1-crewe', name: 'Crewe Alexandra', shortName: 'CRE', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-crewe.svg', kitPattern: 'solid', stadiumName: 'Gresty Road', stadiumCapacity: 10000 },
  { id: 'l1-cheltenham', name: 'Cheltenham Town', shortName: 'CHT', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-cheltenham.svg', kitPattern: 'solid', stadiumName: 'Whaddon Road', stadiumCapacity: 7000 },
  { id: 'l1-hereford', name: 'Hereford United', shortName: 'HFD', primaryColor: '#FFFFFF', secondaryColor: '#000000', crestPath: 'crests/l1-hereford.svg', kitPattern: 'solid', stadiumName: 'Edgar Street', stadiumCapacity: 6700 },
  { id: 'l1-hartlepool', name: 'Hartlepool United', shortName: 'HAR', primaryColor: '#0033A0', secondaryColor: '#FFFFFF', crestPath: 'crests/l1-hartlepool.svg', kitPattern: 'stripes', stadiumName: 'Victoria Park', stadiumCapacity: 7800 },
];
