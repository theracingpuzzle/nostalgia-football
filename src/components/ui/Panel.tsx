import type { ReactNode } from 'react';
import { getContrastTextColor } from '../../utils/colorContrast';

interface PanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
  /** Overrides the title bar's default green with a club (or other) brand color. */
  accentColor?: string;
}

export function Panel({ title, children, className = '', accentColor }: PanelProps) {
  return (
    <div className={`border-2 border-ink/30 bg-panel shadow-[3px_3px_0_rgba(0,0,0,0.25)] ${className}`}>
      {title && (
        <div
          className={`border-b-2 border-ink/30 px-3 py-1.5 text-sm font-bold uppercase tracking-wider ${accentColor ? '' : 'bg-pitch-dark text-white'}`}
          style={accentColor ? { backgroundColor: accentColor, color: getContrastTextColor(accentColor) } : undefined}
        >
          {title}
        </div>
      )}
      <div className="p-2">{children}</div>
    </div>
  );
}
