import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:     'bg-primary text-white hover:opacity-90 shadow-sm',
        destructive: 'bg-destructive text-white hover:opacity-90 shadow-sm',
        outline:     'border border-border bg-white hover:bg-secondary text-foreground',
        secondary:   'bg-secondary text-foreground hover:bg-secondary/70',
        ghost:       'hover:bg-secondary text-foreground',
        link:        'text-primary underline-offset-4 hover:underline',
        warning:     'bg-amber-500 text-white hover:bg-amber-600 shadow-sm',
        success:     'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
        navy:        'bg-nav text-white hover:opacity-90 shadow-sm',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm:      'h-8 px-3 text-xs',
        lg:      'h-11 px-5 text-[15px]',
        xl:      'h-13 px-7 text-base font-bold',
        icon:    'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size:    'default',
    },
  },
);

export function Button({ className, variant, size, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };
