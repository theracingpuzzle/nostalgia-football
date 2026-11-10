import { ClubCrest } from '../ui/ClubCrest';
import { getContrastTextColor } from '../../utils/colorContrast';
import type { ClubListing } from '../../data/premierLeague0809';

export type CareerScreenId = 'team' | 'fixtures' | 'table' | 'scorers';

const NAV_ITEMS: { screen: CareerScreenId; label: string }[] = [
  { screen: 'team', label: 'Team Selection' },
  { screen: 'fixtures', label: 'Fixtures' },
  { screen: 'table', label: 'Table' },
  { screen: 'scorers', label: 'Scorers' },
];

export function CareerNav({
  club,
  screen,
  onNavigate,
  onChangeClub,
}: {
  club: ClubListing;
  screen: CareerScreenId;
  onNavigate: (screen: CareerScreenId) => void;
  onChangeClub: () => void;
}) {
  const textColor = getContrastTextColor(club.primaryColor);

  return (
    <div className="flex items-center justify-between gap-2 border-b-2 border-black/30 px-3 py-2" style={{ backgroundColor: club.primaryColor }}>
      <div className="flex items-center gap-2">
        <ClubCrest primaryColor={club.primaryColor} secondaryColor={club.secondaryColor} label={club.shortName} crestPath={club.crestPath} size={30} />
        <span className="text-base font-bold uppercase tracking-wider" style={{ color: textColor }}>
          {club.name}
        </span>
      </div>
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.screen}
            onClick={() => onNavigate(item.screen)}
            className="rounded-sm border-2 px-3 py-1.5 text-sm font-bold uppercase tracking-wide transition"
            style={
              screen === item.screen
                ? { borderColor: club.secondaryColor, backgroundColor: 'rgba(255,255,255,0.25)', color: textColor }
                : { borderColor: 'transparent', color: textColor, opacity: 0.8 }
            }
          >
            {item.label}
          </button>
        ))}
        <button onClick={onChangeClub} className="rounded-sm border-2 border-transparent px-3 py-1.5 text-sm font-bold uppercase tracking-wide underline" style={{ color: textColor, opacity: 0.8 }}>
          Change Club
        </button>
      </nav>
    </div>
  );
}
