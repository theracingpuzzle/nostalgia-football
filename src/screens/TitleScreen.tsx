import { Button } from '../components/ui/Button';

export function TitleScreen({ onNewCareer }: { onNewCareer: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-4 text-center text-white">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-wider drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] sm:text-5xl">
          Flash Soccer Manager
        </h1>
        <p className="mt-2 text-lg font-bold uppercase tracking-[0.3em] text-white/80">Reborn</p>
        <p className="mt-4 text-sm text-white/60">A 2008/09 Premier League management recreation</p>
      </div>

      <Button className="px-8 py-3 text-base" onClick={onNewCareer}>
        New Career
      </Button>
    </div>
  );
}
