import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';
import type { Player } from '../engine/types';

export interface TransferOffer {
  id: string;
  outPlayer: Player;
  inPlayer: Player;
  inClubName: string;
  flavorText: string;
  status: 'pending' | 'accepted' | 'declined';
}

/**
 * A deliberately silly, lightweight transfer window — no fees, no wages, no
 * negotiation, just a handful of jokey straight-swap offers you can accept
 * or decline. Not a simulation of how transfers actually work, by design.
 */
export function TransferWindowScreen({
  title,
  offers,
  onAccept,
  onDecline,
  onDone,
}: {
  title: string;
  offers: TransferOffer[];
  onAccept: (offerId: string) => void;
  onDecline: (offerId: string) => void;
  onDone: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl p-4 text-white">
      <h2 className="mb-1 text-center text-xl font-black uppercase tracking-wide">{title}</h2>
      <p className="mb-3 text-center text-sm text-white/70">
        Just for fun — no fees, no wages, just a few silly swap deals on the table.
      </p>

      {offers.length === 0 && (
        <Panel className="mb-3">
          <p className="text-sm text-ink/70">No deals on the table this window.</p>
        </Panel>
      )}

      <div className="flex flex-col gap-3">
        {offers.map((offer) => (
          <Panel key={offer.id}>
            <p className="mb-2 text-sm text-ink">{offer.flavorText}</p>
            <div className="mb-2 flex flex-col gap-1 text-xs text-ink/70 sm:flex-row sm:justify-between">
              <span>
                OUT: <strong>{offer.outPlayer.name}</strong> ({offer.outPlayer.position})
              </span>
              <span>
                IN: <strong>{offer.inPlayer.name}</strong> ({offer.inPlayer.position}) from {offer.inClubName}
              </span>
            </div>
            {offer.status === 'pending' ? (
              <div className="flex gap-2">
                <Button onClick={() => onAccept(offer.id)}>Accept</Button>
                <Button variant="secondary" onClick={() => onDecline(offer.id)}>
                  Decline
                </Button>
              </div>
            ) : (
              <p className={`text-xs font-bold uppercase ${offer.status === 'accepted' ? 'text-green-700' : 'text-ink/40'}`}>
                {offer.status === 'accepted' ? 'Deal done!' : 'Declined'}
              </p>
            )}
          </Panel>
        ))}
      </div>

      <div className="mt-4 flex justify-center">
        <Button onClick={onDone}>Continue</Button>
      </div>
    </div>
  );
}
