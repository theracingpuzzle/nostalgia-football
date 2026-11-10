import { useState } from 'react';
import { getContrastTextColor } from '../../utils/colorContrast';

interface ClubCrestProps {
  primaryColor: string;
  secondaryColor: string;
  label: string;
  size?: number;
  /** Real crest image path (e.g. from public/crests). Falls back to a generic shield if omitted or if it fails to load. */
  crestPath?: string;
}

/**
 * Club badge. Prefers a real crest image (crestPath) — downloaded from
 * Wikipedia for this private, non-distributed build (see PLAN.md) — and
 * falls back to a generic shield in the club's colors if none is given or
 * the image fails to load.
 */
export function ClubCrest({ primaryColor, secondaryColor, label, size = 28, crestPath }: ClubCrestProps) {
  const [imageFailed, setImageFailed] = useState(false);

  if (crestPath && !imageFailed) {
    return (
      <img
        src={crestPath}
        alt={`${label} crest`}
        width={size}
        height={size}
        className="shrink-0 object-contain drop-shadow-[1px_1px_0_rgba(0,0,0,0.25)]"
        style={{ width: size, height: size }}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return <GenericCrest primaryColor={primaryColor} secondaryColor={secondaryColor} label={label} size={size} />;
}

function GenericCrest({ primaryColor, secondaryColor, label, size = 28 }: Omit<ClubCrestProps, 'crestPath'>) {
  const textColor = getContrastTextColor(primaryColor);
  return (
    <svg
      width={size}
      height={size * 1.2}
      viewBox="0 0 100 120"
      role="img"
      aria-label={`${label} crest`}
      className="shrink-0 drop-shadow-[1px_1px_0_rgba(0,0,0,0.35)]"
    >
      <path d="M50 2 L90 15 L90 55 Q90 95 50 118 Q10 95 10 55 L10 15 Z" fill={primaryColor} stroke={secondaryColor} strokeWidth={6} />
      <text
        x="50"
        y="70"
        textAnchor="middle"
        fontSize="34"
        fontWeight="bold"
        fill={textColor}
        fontFamily="'Trebuchet MS', Verdana, sans-serif"
      >
        {label}
      </text>
    </svg>
  );
}
