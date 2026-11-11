/** A small rectangle in the card's color — not an emoji, so it renders the same everywhere. Shared by the live match screen and the Full Time screen so cards look identical in both. */
export function CardIcon({ type }: { type: 'yellow' | 'red' }) {
  return <span aria-hidden className={`inline-block h-2.5 w-2 shrink-0 rounded-[1px] ${type === 'red' ? 'bg-red-600' : 'bg-yellow-400'}`} />;
}
