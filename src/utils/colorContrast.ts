/** Picks black or white text for readability against a given hex background. */
export function getContrastTextColor(hexColor: string): '#000000' | '#ffffff' {
  const hex = hexColor.replace('#', '');
  if (hex.length !== 6) return '#ffffff';

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  // Perceived brightness (ITU-R BT.601).
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 150 ? '#000000' : '#ffffff';
}
