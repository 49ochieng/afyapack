import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export function Select({ className, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-10 w-full appearance-none rounded-xl border border-input bg-white px-3.5 py-2 pr-9 text-sm text-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-150',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        size={15}
      />
    </div>
  );
}
