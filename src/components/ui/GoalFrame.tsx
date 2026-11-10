/** A simple goal frame + net, sitting on the pitch's left or right edge (landscape pitch, attacking left-to-right). */
export function GoalFrame({ side, height = 64 }: { side: 'left' | 'right'; height?: number }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute top-1/2 w-4 -translate-y-1/2 border-2 border-white bg-white/10 ${
        side === 'left' ? 'left-0' : 'right-0'
      }`}
      style={{
        height,
        backgroundImage:
          'repeating-linear-gradient(45deg, rgba(255,255,255,0.55) 0, rgba(255,255,255,0.55) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.55) 0, rgba(255,255,255,0.55) 1px, transparent 1px, transparent 4px)',
      }}
    />
  );
}
