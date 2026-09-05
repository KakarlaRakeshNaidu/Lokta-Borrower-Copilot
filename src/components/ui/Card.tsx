import type { HTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../lib/utils';

export function Card({ children, className, ...props }: PropsWithChildren<HTMLAttributes<HTMLDivElement>>) {
  return <section className={cn('rounded-lg border border-[#dce7e2] bg-white p-5 shadow-sm', className)} {...props}>{children}</section>;
}