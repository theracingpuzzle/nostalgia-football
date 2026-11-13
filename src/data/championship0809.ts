import type { ClubListing } from './premierLeague0809';

/**
 * The 24 clubs of the 2008/09 Football League Championship season (English
 * second tier) — the third league added beyond the Premier League and La
 * Liga (see PLAN.md for the multi-league expansion).
 *
 * Same caveat as premierLeague0809.ts/laLiga0809.ts: reconstructed from
 * memory, not a verified source. Solid facts: champions Wolverhampton
 * Wanderers and runners-up Birmingham City were promoted automatically,
 * Burnley won the promotion playoff final against Sheffield United, and
 * Norwich City, Southampton (deducted 10 points that season for entering
 * administration) and Charlton Athletic were relegated. Exact mid-table
 * order is not guaranteed. Colors/kitPattern are a best-effort real-identity
 * fallback (e.g. QPR's blue-and-white hoops approximated as stripes, since
 * there's no dedicated "hoops" pattern), not a verified render of the
 * actual 2008/09 shirt. Stadium names are real grounds for that era (e.g.
 * Cardiff's Ninian Park, before their 2009 move to Cardiff City Stadium);
 * capacities are rounded approximations, lower-confidence for the smaller
 * clubs than for the well-known ones. Club ids are prefixed `ch-` to
 * guarantee no collision with any other league's ids.
 */
export const CHAMPIONSHIP_2008_09: ClubListing[] = [
  { id: 'ch-wolves', name: 'Wolverhampton Wanderers', shortName: 'WOL', primaryColor: '#FDB913', secondaryColor: '#231F20', crestPath: 'crests/ch-wolves.svg', kitPattern: 'solid', stadiumName: 'Molineux Stadium', stadiumCapacity: 31700 },
  { id: 'ch-birmingham', name: 'Birmingham City', shortName: 'BIR', primaryColor: '#1B458F', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-birmingham.svg', kitPattern: 'solid', stadiumName: "St Andrew's", stadiumCapacity: 30000 },
  { id: 'ch-sheffield-utd', name: 'Sheffield United', shortName: 'SHU', primaryColor: '#EE2737', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-sheffield-utd.svg', kitPattern: 'stripes', stadiumName: 'Bramall Lane', stadiumCapacity: 32000 },
  { id: 'ch-burnley', name: 'Burnley', shortName: 'BUR', primaryColor: '#6C1D45', secondaryColor: '#99D6EA', crestPath: 'crests/ch-burnley.svg', kitPattern: 'solid', stadiumName: 'Turf Moor', stadiumCapacity: 22000 },
  { id: 'ch-preston', name: 'Preston North End', shortName: 'PNE', primaryColor: '#FFFFFF', secondaryColor: '#003087', crestPath: 'crests/ch-preston.svg', kitPattern: 'solid', stadiumName: 'Deepdale', stadiumCapacity: 23400 },
  { id: 'ch-cardiff', name: 'Cardiff City', shortName: 'CAR', primaryColor: '#0070B5', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-cardiff.svg', kitPattern: 'solid', stadiumName: 'Ninian Park', stadiumCapacity: 22000 },
  { id: 'ch-swansea', name: 'Swansea City', shortName: 'SWA', primaryColor: '#FFFFFF', secondaryColor: '#000000', crestPath: 'crests/ch-swansea.svg', kitPattern: 'solid', stadiumName: 'Liberty Stadium', stadiumCapacity: 20500 },
  { id: 'ch-reading', name: 'Reading', shortName: 'REA', primaryColor: '#004494', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-reading.svg', kitPattern: 'stripes', stadiumName: 'Madejski Stadium', stadiumCapacity: 24200 },
  { id: 'ch-forest', name: 'Nottingham Forest', shortName: 'NFO', primaryColor: '#DD0000', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-forest.svg', kitPattern: 'solid', stadiumName: 'City Ground', stadiumCapacity: 30000 },
  { id: 'ch-doncaster', name: 'Doncaster Rovers', shortName: 'DON', primaryColor: '#DA291C', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-doncaster.svg', kitPattern: 'stripes', stadiumName: 'Keepmoat Stadium', stadiumCapacity: 15200 },
  { id: 'ch-ipswich', name: 'Ipswich Town', shortName: 'IPS', primaryColor: '#0033A0', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-ipswich.svg', kitPattern: 'solid', stadiumName: 'Portman Road', stadiumCapacity: 30300 },
  { id: 'ch-bristol-city', name: 'Bristol City', shortName: 'BRC', primaryColor: '#DA291C', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-bristol-city.svg', kitPattern: 'solid', stadiumName: 'Ashton Gate', stadiumCapacity: 21500 },
  { id: 'ch-blackpool', name: 'Blackpool', shortName: 'BLA', primaryColor: '#FF7900', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-blackpool.svg', kitPattern: 'solid', stadiumName: 'Bloomfield Road', stadiumCapacity: 9700 },
  { id: 'ch-crystal-palace', name: 'Crystal Palace', shortName: 'CRY', primaryColor: '#1B458F', secondaryColor: '#C4122E', crestPath: 'crests/ch-crystal-palace.svg', kitPattern: 'stripes', stadiumName: 'Selhurst Park', stadiumCapacity: 26000 },
  { id: 'ch-watford', name: 'Watford', shortName: 'WAT', primaryColor: '#FBEE23', secondaryColor: '#000000', crestPath: 'crests/ch-watford.svg', kitPattern: 'solid', stadiumName: 'Vicarage Road', stadiumCapacity: 19900 },
  { id: 'ch-sheffield-wed', name: 'Sheffield Wednesday', shortName: 'SHW', primaryColor: '#0066B3', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-sheffield-wed.svg', kitPattern: 'stripes', stadiumName: 'Hillsborough', stadiumCapacity: 39800 },
  { id: 'ch-coventry', name: 'Coventry City', shortName: 'COV', primaryColor: '#78B9E7', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-coventry.svg', kitPattern: 'solid', stadiumName: 'Ricoh Arena', stadiumCapacity: 32600 },
  { id: 'ch-barnsley', name: 'Barnsley', shortName: 'BRN', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-barnsley.svg', kitPattern: 'solid', stadiumName: 'Oakwell', stadiumCapacity: 23100 },
  { id: 'ch-derby', name: 'Derby County', shortName: 'DER', primaryColor: '#FFFFFF', secondaryColor: '#000000', crestPath: 'crests/ch-derby.svg', kitPattern: 'solid', stadiumName: 'Pride Park', stadiumCapacity: 33000 },
  { id: 'ch-plymouth', name: 'Plymouth Argyle', shortName: 'PLY', primaryColor: '#005642', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-plymouth.svg', kitPattern: 'solid', stadiumName: 'Home Park', stadiumCapacity: 16000 },
  { id: 'ch-qpr', name: 'Queens Park Rangers', shortName: 'QPR', primaryColor: '#1D5BA4', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-qpr.svg', kitPattern: 'stripes', stadiumName: 'Loftus Road', stadiumCapacity: 18500 },
  { id: 'ch-norwich', name: 'Norwich City', shortName: 'NOR', primaryColor: '#FFF200', secondaryColor: '#00A650', crestPath: 'crests/ch-norwich.svg', kitPattern: 'solid', stadiumName: 'Carrow Road', stadiumCapacity: 27000 },
  { id: 'ch-southampton', name: 'Southampton', shortName: 'SOU', primaryColor: '#D71920', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-southampton.svg', kitPattern: 'stripes', stadiumName: "St Mary's Stadium", stadiumCapacity: 32500 },
  { id: 'ch-charlton', name: 'Charlton Athletic', shortName: 'CHA', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/ch-charlton.svg', kitPattern: 'solid', stadiumName: 'The Valley', stadiumCapacity: 27100 },
];
