import { useId } from 'react';
import type { KitPattern } from '../../data/premierLeague0809';

const SHIRT_PATH = 'M22 4 L12 10 L2 24 L12 30 L18 22 L18 60 L46 60 L46 22 L52 30 L62 24 L52 10 L42 4 Q38 13 32 13 Q26 13 22 4 Z';

/**
 * A generic jersey/kit silhouette, patterned to roughly match the club's
 * real kit layout (stripes, halves, contrast sleeves) — not a reproduction
 * of any real kit template or licensed design. "Newcastle wear black/white
 * stripes" is a well-known fact about the club's identity, not a
 * copyrightable design; we're recreating that fact generically, same
 * reasoning as ClubCrest's generic shield.
 */
export function KitIcon({
  primaryColor,
  secondaryColor,
  pattern = 'solid',
  size = 16,
}: {
  primaryColor: string;
  secondaryColor: string;
  pattern?: KitPattern;
  size?: number;
}) {
  const clipId = useId();

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0 drop-shadow-[1px_1px_0_rgba(0,0,0,0.4)]">
      <defs>
        <clipPath id={clipId}>
          <path d={SHIRT_PATH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect x={0} y={0} width={64} height={64} fill={primaryColor} />
        {pattern === 'stripes' && (
          <>
            <rect x={6} y={0} width={7} height={64} fill={secondaryColor} />
            <rect x={20} y={0} width={7} height={64} fill={secondaryColor} />
            <rect x={34} y={0} width={7} height={64} fill={secondaryColor} />
            <rect x={48} y={0} width={7} height={64} fill={secondaryColor} />
          </>
        )}
        {pattern === 'halves' && <rect x={32} y={0} width={32} height={64} fill={secondaryColor} />}
        {pattern === 'sleeves' && (
          <>
            <rect x={0} y={0} width={20} height={34} fill={secondaryColor} />
            <rect x={44} y={0} width={20} height={34} fill={secondaryColor} />
          </>
        )}
      </g>
      <path d={SHIRT_PATH} fill="none" stroke={secondaryColor} strokeWidth={2} strokeLinejoin="round" />
      <path d="M26 5 Q32 10 38 5" fill="none" stroke={secondaryColor} strokeWidth={2} />
    </svg>
  );
}
