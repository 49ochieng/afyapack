import { cn } from '@/lib/utils';

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        'flex min-h-[80px] w-full rounded-xl border border-input bg-white px-3.5 py-2.5 text-sm text-foreground',
        'placeholder:text-muted-foreground/60 resize-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'transition-all duration-150',
        className,
      )}
      {...props}
    />
  );
}
