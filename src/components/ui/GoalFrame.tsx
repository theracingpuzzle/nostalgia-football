/** A simple goal frame + net, sitting on one edge of the pitch. `size` is the length of the goal mouth along that edge. */
export function GoalFrame({ side, size = 64 }: { side: 'left' | 'right' | 'top' | 'bottom'; size?: number }) {
  const netPattern =
    'repeating-linear-gradient(45deg, rgba(255,255,255,0.55) 0, rgba(255,255,255,0.55) 1px, transparent 1px, transparent 4px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.55) 0, rgba(255,255,255,0.55) 1px, transparent 1px, transparent 4px)';

  const isEdgeVertical = side === 'left' || side === 'right';
  const edgeClass =
    side === 'left' ? 'left-0 top-1/2 -translate-y-1/2' : side === 'right' ? 'right-0 top-1/2 -translate-y-1/2' : side === 'top' ? 'top-0 left-1/2 -translate-x-1/2' : 'bottom-0 left-1/2 -translate-x-1/2';

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute border-2 border-white bg-white/10 ${edgeClass} ${isEdgeVertical ? 'w-4' : 'h-4'}`}
      style={isEdgeVertical ? { height: size, backgroundImage: netPattern } : { width: size, backgroundImage: netPattern }}
    />
  );
}
