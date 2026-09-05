import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({ children, className, variant = 'primary', ...props }: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>) {
  return (
    <button
      className={cn(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-ink text-white hover:bg-[#1f3430]',
        variant === 'secondary' && 'border border-[#cbd8d3] bg-white text-ink hover:bg-[#f0f6f3]',
        variant === 'ghost' && 'text-ink hover:bg-[#edf5f1]',
        variant === 'danger' && 'bg-danger text-white hover:bg-[#8f1d15]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}