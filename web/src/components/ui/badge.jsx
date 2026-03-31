import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary/10 text-primary border border-primary/20',
        secondary: 'bg-secondary text-secondary-foreground',
        destructive: 'bg-red-100 text-red-700 border border-red-200',
        warning: 'bg-amber-100 text-amber-700 border border-amber-200',
        success: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        outline: 'border border-border text-foreground',
        muted: 'bg-muted text-muted-foreground',
        critical: 'bg-red-100 text-red-700 border border-red-300 font-semibold',
        high: 'bg-orange-100 text-orange-700 border border-orange-200',
        medium: 'bg-amber-100 text-amber-700 border border-amber-200',
        offline: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
        connecting: 'bg-amber-100 text-amber-700 border border-amber-200',
        error: 'bg-red-100 text-red-700 border border-red-200',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { badgeVariants };
