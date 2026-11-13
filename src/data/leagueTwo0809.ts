import type { ClubListing } from './premierLeague0809';

/**
 * The 24 clubs of the 2008/09 Football League Two season (English fourth
 * tier) — the fifth league added (see PLAN.md). Same research-before-
 * writing approach as leagueOne0809.ts: the club list and promotion/
 * relegation facts were checked against Wikipedia, not pure recall.
 * Champions Brentford, runners-up Exeter City and third-placed Wycombe
 * Wanderers were promoted automatically (League Two promotes the top 3,
 * not top 2 — a real rule difference from the tiers above it, not an
 * error); Gillingham won the promotion playoff final, beating Shrewsbury
 * Town at Wembley; Chester City and Luton Town were relegated (Luton
 * played the season under a 30-point deduction for financial
 * irregularities — a real, notable detail from that season, not
 * invented). Relegation here has nowhere real to go (the Conference/
 * National League isn't modeled), same treatment as the Championship's
 * own relegation zone had before League One existed. Colors/kitPattern/
 * stadium capacity are the usual best-effort approximation. Club ids are
 * prefixed `l2-`.
 */
export const LEAGUE_TWO_2008_09: ClubListing[] = [
  { id: 'l2-brentford', name: 'Brentford', shortName: 'BRE', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-brentford.svg', kitPattern: 'stripes', stadiumName: 'Griffin Park', stadiumCapacity: 12800 },
  { id: 'l2-exeter', name: 'Exeter City', shortName: 'EXE', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-exeter.svg', kitPattern: 'solid', stadiumName: "St James Park", stadiumCapacity: 8500 },
  { id: 'l2-wycombe', name: 'Wycombe Wanderers', shortName: 'WYC', primaryColor: '#87CEEB', secondaryColor: '#001D5E', crestPath: 'crests/l2-wycombe.svg', kitPattern: 'solid', stadiumName: 'Adams Park', stadiumCapacity: 10000 },
  { id: 'l2-gillingham', name: 'Gillingham', shortName: 'GIL', primaryColor: '#0033A0', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-gillingham.svg', kitPattern: 'solid', stadiumName: 'Priestfield Stadium', stadiumCapacity: 11600 },
  { id: 'l2-shrewsbury', name: 'Shrewsbury Town', shortName: 'SHR', primaryColor: '#FDB913', secondaryColor: '#0033A0', crestPath: 'crests/l2-shrewsbury.svg', kitPattern: 'solid', stadiumName: 'New Meadow', stadiumCapacity: 9900 },
  { id: 'l2-bournemouth', name: 'Bournemouth', shortName: 'BOU', primaryColor: '#D2122E', secondaryColor: '#000000', crestPath: 'crests/l2-bournemouth.svg', kitPattern: 'stripes', stadiumName: 'Dean Court', stadiumCapacity: 9600 },
  { id: 'l2-rotherham', name: 'Rotherham United', shortName: 'ROT', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-rotherham.svg', kitPattern: 'solid', stadiumName: 'Don Valley Stadium', stadiumCapacity: 12000 },
  { id: 'l2-chesterfield', name: 'Chesterfield', shortName: 'CHF', primaryColor: '#0033A0', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-chesterfield.svg', kitPattern: 'solid', stadiumName: 'Saltergate', stadiumCapacity: 10400 },
  { id: 'l2-bradford', name: 'Bradford City', shortName: 'BRA', primaryColor: '#7A1E3A', secondaryColor: '#FDB913', crestPath: 'crests/l2-bradford.svg', kitPattern: 'solid', stadiumName: 'Valley Parade', stadiumCapacity: 25000 },
  { id: 'l2-grimsby', name: 'Grimsby Town', shortName: 'GRI', primaryColor: '#000000', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-grimsby.svg', kitPattern: 'stripes', stadiumName: 'Blundell Park', stadiumCapacity: 9000 },
  { id: 'l2-port-vale', name: 'Port Vale', shortName: 'PTV', primaryColor: '#FFFFFF', secondaryColor: '#000000', crestPath: 'crests/l2-port-vale.svg', kitPattern: 'stripes', stadiumName: 'Vale Park', stadiumCapacity: 19000 },
  { id: 'l2-notts-county', name: 'Notts County', shortName: 'NOT', primaryColor: '#000000', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-notts-county.svg', kitPattern: 'stripes', stadiumName: 'Meadow Lane', stadiumCapacity: 20200 },
  { id: 'l2-lincoln', name: 'Lincoln City', shortName: 'LIN', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-lincoln.svg', kitPattern: 'stripes', stadiumName: 'Sincil Bank', stadiumCapacity: 10100 },
  { id: 'l2-rochdale', name: 'Rochdale', shortName: 'ROC', primaryColor: '#0033A0', secondaryColor: '#000000', crestPath: 'crests/l2-rochdale.svg', kitPattern: 'solid', stadiumName: 'Spotland Stadium', stadiumCapacity: 10200 },
  { id: 'l2-accrington', name: 'Accrington Stanley', shortName: 'ACC', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-accrington.svg', kitPattern: 'solid', stadiumName: 'Crown Ground', stadiumCapacity: 5000 },
  { id: 'l2-morecambe', name: 'Morecambe', shortName: 'MOR', primaryColor: '#D2122E', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-morecambe.svg', kitPattern: 'solid', stadiumName: 'Christie Park', stadiumCapacity: 6000 },
  { id: 'l2-darlington', name: 'Darlington', shortName: 'DAR', primaryColor: '#000000', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-darlington.svg', kitPattern: 'solid', stadiumName: 'Darlington Arena', stadiumCapacity: 25000 },
  { id: 'l2-barnet', name: 'Barnet', shortName: 'BAR', primaryColor: '#000000', secondaryColor: '#FDB913', crestPath: 'crests/l2-barnet.svg', kitPattern: 'solid', stadiumName: 'Underhill Stadium', stadiumCapacity: 5500 },
  { id: 'l2-aldershot', name: 'Aldershot Town', shortName: 'ALD', primaryColor: '#D2122E', secondaryColor: '#0033A0', crestPath: 'crests/l2-aldershot.svg', kitPattern: 'solid', stadiumName: 'Recreation Ground', stadiumCapacity: 7100 },
  { id: 'l2-dagenham', name: 'Dagenham & Redbridge', shortName: 'DAG', primaryColor: '#D2122E', secondaryColor: '#0033A0', crestPath: 'crests/l2-dagenham.svg', kitPattern: 'solid', stadiumName: 'Victoria Road', stadiumCapacity: 6000 },
  { id: 'l2-macclesfield', name: 'Macclesfield Town', shortName: 'MAC', primaryColor: '#0033A0', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-macclesfield.svg', kitPattern: 'solid', stadiumName: 'Moss Rose', stadiumCapacity: 6300 },
  { id: 'l2-bury', name: 'Bury', shortName: 'BUR', primaryColor: '#FFFFFF', secondaryColor: '#0033A0', crestPath: 'crests/l2-bury.svg', kitPattern: 'solid', stadiumName: 'Gigg Lane', stadiumCapacity: 11800 },
  { id: 'l2-chester', name: 'Chester City', shortName: 'CHS', primaryColor: '#0033A0', secondaryColor: '#FFFFFF', crestPath: 'crests/l2-chester.svg', kitPattern: 'solid', stadiumName: 'Deva Stadium', stadiumCapacity: 6000 },
  { id: 'l2-luton', name: 'Luton Town', shortName: 'LUT', primaryColor: '#FF6600', secondaryColor: '#000033', crestPath: 'crests/l2-luton.svg', kitPattern: 'solid', stadiumName: 'Kenilworth Road', stadiumCapacity: 10200 },
];
