import { useState } from 'react';
import { ClubCrest } from '../ui/ClubCrest';
import { getContrastTextColor } from '../../utils/colorContrast';
import { getLeagueZone, ordinal, ZONE_STYLES } from '../../utils/leagueZones';
import type { ClubListing } from '../../data/premierLeague0809';
import type { LeagueDefinition } from '../../data/leagues';

export type CareerScreenId = 'team' | 'fixtures' | 'table' | 'stats' | 'totm';

const NAV_ITEMS: { screen: CareerScreenId; label: string }[] = [
  { screen: 'team', label: 'Team Selection' },
  { screen: 'fixtures', label: 'Fixtures' },
  { screen: 'table', label: 'Table' },
  { screen: 'stats', label: 'Stats' },
  { screen: 'totm', label: 'TOTM' },
];

/** Nav buttons, shared between the desktop row and the mobile dropdown — same markup, different layout wrapper. */
function NavButtons({
  screen,
  club,
  textColor,
  vertical,
  onNavigate,
  onChangeClub,
}: {
  screen: CareerScreenId;
  club: ClubListing;
  textColor: string;
  vertical: boolean;
  onNavigate: (screen: CareerScreenId) => void;
  onChangeClub: () => void;
}) {
  return (
    <>
      {NAV_ITEMS.map((item) => (
        <button
          key={item.screen}
          onClick={() => onNavigate(item.screen)}
          className={`rounded-sm border-2 px-3 py-1.5 text-sm font-bold uppercase tracking-wide transition ${vertical ? 'w-full text-left' : ''}`}
          style={
            screen === item.screen
              ? { borderColor: club.secondaryColor, backgroundColor: 'rgba(255,255,255,0.25)', color: textColor }
              : { borderColor: 'transparent', color: textColor, opacity: 0.8 }
          }
        >
          {item.label}
        </button>
      ))}
      <button
        onClick={onChangeClub}
        className={`rounded-sm border-2 border-transparent px-3 py-1.5 text-sm font-bold uppercase tracking-wide underline ${vertical ? 'w-full text-left' : ''}`}
        style={{ color: textColor, opacity: 0.8 }}
      >
        Change Club
      </button>
    </>
  );
}

export function CareerNav({
  club,
  managerName,
  screen,
  leaguePosition,
  totalClubs,
  leagueTier,
  onNavigate,
  onChangeClub,
}: {
  club: ClubListing;
  managerName: string;
  screen: CareerScreenId;
  /** Current league position (1-based), so the manager can see it without switching to the Table tab. */
  leaguePosition: number;
  totalClubs: number;
  leagueTier: LeagueDefinition['tier'];
  onNavigate: (screen: CareerScreenId) => void;
  onChangeClub: () => void;
}) {
  const textColor = getContrastTextColor(club.primaryColor);
  const [menuOpen, setMenuOpen] = useState(false);
  const zone = getLeagueZone(leaguePosition, totalClubs, leagueTier);

  return (
    <div className="relative border-b-2 border-black/30 px-3 py-2" style={{ backgroundColor: club.primaryColor }}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={30} />
          <div className="min-w-0 leading-tight">
            <span className="block truncate text-base font-bold uppercase tracking-wider" style={{ color: textColor }}>
              {club.name}
            </span>
            <span className="block truncate text-[11px] font-semibold" style={{ color: textColor, opacity: 0.75 }}>
              Managed by {managerName}
            </span>
          </div>
          <button
            onClick={() => onNavigate('table')}
            className="flex shrink-0 items-center gap-1.5 rounded-sm border-2 px-2 py-1 text-xs font-bold"
            style={{ borderColor: 'rgba(255,255,255,0.4)', color: textColor, backgroundColor: 'rgba(255,255,255,0.15)' }}
            title={zone ? ZONE_STYLES[zone].label : 'League position'}
          >
            <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${zone ? ZONE_STYLES[zone].dot : 'bg-white/60'}`} />
            {ordinal(leaguePosition)}
          </button>
        </div>

        {/* Desktop nav */}
        <nav className="hidden shrink-0 items-center gap-1 md:flex">
          <NavButtons screen={screen} club={club} textColor={textColor} vertical={false} onNavigate={onNavigate} onChangeClub={onChangeClub} />
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          className="shrink-0 rounded-sm border-2 border-transparent p-1.5 md:hidden"
          style={{ color: textColor }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {menuOpen ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="mt-2 flex flex-col gap-1 border-t-2 border-black/20 pt-2 md:hidden">
          <NavButtons
            screen={screen}
            club={club}
            textColor={textColor}
            vertical
            onNavigate={(s) => {
              onNavigate(s);
              setMenuOpen(false);
            }}
            onChangeClub={() => {
              onChangeClub();
              setMenuOpen(false);
            }}
          />
        </nav>
      )}
    </div>
  );
}
