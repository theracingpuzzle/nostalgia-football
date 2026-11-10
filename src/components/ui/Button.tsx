import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-pitch border-pitch-dark text-white hover:bg-pitch-light',
  secondary: 'bg-panel border-ink/40 text-ink hover:bg-white',
  danger: 'bg-red-700 border-red-900 text-white hover:bg-red-600',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`rounded-sm border-2 px-3 py-1.5 text-sm font-bold uppercase tracking-wide shadow-[2px_2px_0_rgba(0,0,0,0.35)] transition active:translate-y-px active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none ${VARIANT_CLASSES[variant]} ${className}`}
    />
  );
}
