import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Panel } from '../components/ui/Panel';

export function ManagerNameScreen({ onContinue }: { onContinue: (managerName: string) => void }) {
  const [name, setName] = useState('');
  const trimmed = name.trim();

  function submit() {
    if (!trimmed) return;
    onContinue(trimmed);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-white">
      <h2 className="text-2xl font-black uppercase tracking-wide">Who's the Boss?</h2>
      <Panel className="w-full max-w-sm">
        <label className="mb-1 block text-xs font-bold uppercase text-ink/70" htmlFor="manager-name">
          Manager name
        </label>
        <input
          id="manager-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="e.g. Alex Ferguson"
          maxLength={40}
          autoFocus
          className="w-full rounded-sm border-2 border-ink/30 bg-white px-3 py-2 text-base text-ink outline-none focus:border-pitch-dark"
        />
        <Button className="mt-3 w-full" onClick={submit} disabled={!trimmed}>
          Continue
        </Button>
      </Panel>
    </div>
  );
}
