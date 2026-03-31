import { cn } from '@/lib/utils';

export function Input({ className, type = 'text', ...props }) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-10 w-full rounded-xl border border-input bg-white px-3.5 py-2 text-sm text-foreground',
        'placeholder:text-muted-foreground/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all duration-150',
        'shadow-inset-sm',
        className,
      )}
      {...props}
    />
  );
}
