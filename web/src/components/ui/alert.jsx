import { cn } from '@/lib/utils';
import { AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

const icons = {
  default: Info,
  warning: AlertTriangle,
  destructive: XCircle,
  success: CheckCircle2,
};

const styles = {
  default: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  destructive: 'bg-red-50 border-red-200 text-red-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
};

export function Alert({ className, variant = 'default', title, children }) {
  const Icon = icons[variant] || Info;
  return (
    <div className={cn('flex gap-3 rounded-lg border p-4', styles[variant], className)}>
      <Icon size={18} className="shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
