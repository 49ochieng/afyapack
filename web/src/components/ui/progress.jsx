import { cn } from '@/lib/utils';

export function Progress({ className, value = 0, max = 100, ...props }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div
      className={cn('relative h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      {...props}
    >
      <div
        className="h-full bg-primary transition-all duration-500 rounded-full"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
