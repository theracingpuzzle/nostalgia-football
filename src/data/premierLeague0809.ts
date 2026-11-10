export type KitPattern = 'solid' | 'stripes' | 'halves' | 'sleeves';

export interface ClubListing {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  /** Relative path (no leading slash, so it also works when hosted under a sub-path) to that club's real crest SVG, sourced from Wikipedia (see PLAN.md). */
  crestPath: string;
  /** Generic kit layout (not a real kit template) — e.g. "black/white stripes" is a well-known fact about Newcastle's identity, not a licensed design. */
  kitPattern: KitPattern;
}

/**
 * The 20 clubs of the 2008/09 FA Premier League season.
 *
 * CAVEAT: reconstructed from memory, like realSquads2008_09.ts. The identity of the
 * 20 clubs and the top-6/bottom-3 positions are solid; exact mid-table order
 * (roughly positions 7-17) is not guaranteed accurate and should be checked
 * against a source before it's treated as fact anywhere. Colors are
 * approximate primary/secondary kit colors, used as a fallback/accent only.
 * kitPattern is likewise a best-effort "what does their home kit generally
 * look like" (stripes/halves/sleeves/solid) rather than a verified render of
 * their actual 2008/09 shirt.
 *
 * Crests: real official crest SVGs, downloaded from each club's English
 * Wikipedia article (public/crests/<id>.svg) — fine for this private,
 * non-distributed build, but NOT era-accurate: these are the CURRENT crest
 * on file, and at least Stoke City and Newcastle United have since
 * rebranded, so those two (and possibly others) don't match what the club
 * actually wore in 2008/09. Don't redistribute this project with these
 * assets included — they're real trademarked logos, used here only because
 * this is a private build.
 */
export const PREMIER_LEAGUE_2008_09: ClubListing[] = [
  { id: 'man-utd', name: 'Manchester United', shortName: 'MUN', primaryColor: '#DA291C', secondaryColor: '#FBE122', crestPath: 'crests/man-utd.svg', kitPattern: 'solid' },
  { id: 'liverpool', name: 'Liverpool', shortName: 'LIV', primaryColor: '#C8102E', secondaryColor: '#F6EB16', crestPath: 'crests/liverpool.svg', kitPattern: 'solid' },
  { id: 'chelsea', name: 'Chelsea', shortName: 'CHE', primaryColor: '#034694', secondaryColor: '#FFFFFF', crestPath: 'crests/chelsea.svg', kitPattern: 'solid' },
  { id: 'arsenal', name: 'Arsenal', shortName: 'ARS', primaryColor: '#EF0107', secondaryColor: '#FFFFFF', crestPath: 'crests/arsenal.svg', kitPattern: 'sleeves' },
  { id: 'everton', name: 'Everton', shortName: 'EVE', primaryColor: '#003399', secondaryColor: '#FFFFFF', crestPath: 'crests/everton.svg', kitPattern: 'solid' },
  { id: 'aston-villa', name: 'Aston Villa', shortName: 'AVL', primaryColor: '#670E36', secondaryColor: '#95BFE5', crestPath: 'crests/aston-villa.svg', kitPattern: 'sleeves' },
  { id: 'fulham', name: 'Fulham', shortName: 'FUL', primaryColor: '#FFFFFF', secondaryColor: '#000000', crestPath: 'crests/fulham.svg', kitPattern: 'solid' },
  { id: 'tottenham', name: 'Tottenham Hotspur', shortName: 'TOT', primaryColor: '#FFFFFF', secondaryColor: '#132257', crestPath: 'crests/tottenham.svg', kitPattern: 'solid' },
  { id: 'west-ham', name: 'West Ham United', shortName: 'WHU', primaryColor: '#7A263A', secondaryColor: '#1BB1E7', crestPath: 'crests/west-ham.svg', kitPattern: 'sleeves' },
  { id: 'man-city', name: 'Manchester City', shortName: 'MCI', primaryColor: '#6CABDD', secondaryColor: '#FFFFFF', crestPath: 'crests/man-city.svg', kitPattern: 'solid' },
  { id: 'wigan', name: 'Wigan Athletic', shortName: 'WIG', primaryColor: '#1B458F', secondaryColor: '#FFFFFF', crestPath: 'crests/wigan.svg', kitPattern: 'stripes' },
  { id: 'stoke', name: 'Stoke City', shortName: 'STO', primaryColor: '#E03A3E', secondaryColor: '#FFFFFF', crestPath: 'crests/stoke.svg', kitPattern: 'stripes' },
  { id: 'bolton', name: 'Bolton Wanderers', shortName: 'BOL', primaryColor: '#1C2C5B', secondaryColor: '#FFFFFF', crestPath: 'crests/bolton.svg', kitPattern: 'solid' },
  { id: 'portsmouth', name: 'Portsmouth', shortName: 'POR', primaryColor: '#001489', secondaryColor: '#FFFFFF', crestPath: 'crests/portsmouth.svg', kitPattern: 'solid' },
  { id: 'blackburn', name: 'Blackburn Rovers', shortName: 'BLB', primaryColor: '#009EE0', secondaryColor: '#FFFFFF', crestPath: 'crests/blackburn.svg', kitPattern: 'halves' },
  { id: 'sunderland', name: 'Sunderland', shortName: 'SUN', primaryColor: '#EB172B', secondaryColor: '#FFFFFF', crestPath: 'crests/sunderland.svg', kitPattern: 'stripes' },
  { id: 'hull', name: 'Hull City', shortName: 'HUL', primaryColor: '#F18A00', secondaryColor: '#000000', crestPath: 'crests/hull.svg', kitPattern: 'stripes' },
  { id: 'newcastle', name: 'Newcastle United', shortName: 'NEW', primaryColor: '#241F20', secondaryColor: '#FFFFFF', crestPath: 'crests/newcastle.svg', kitPattern: 'stripes' },
  { id: 'middlesbrough', name: 'Middlesbrough', shortName: 'MID', primaryColor: '#CC0000', secondaryColor: '#FFFFFF', crestPath: 'crests/middlesbrough.svg', kitPattern: 'solid' },
  { id: 'west-brom', name: 'West Bromwich Albion', shortName: 'WBA', primaryColor: '#122F67', secondaryColor: '#FFFFFF', crestPath: 'crests/west-brom.svg', kitPattern: 'stripes' },
];
