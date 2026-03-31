'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RedFlagBanner({ flags, dismissible = true }) {
  const [dismissed, setDismissed] = useState(false);
  if (!flags?.length || dismissed) return null;

  const criticalFlags = flags.filter(f => f.severity === 'critical');
  const highFlags     = flags.filter(f => f.severity === 'high');
  const otherFlags    = flags.filter(f => f.severity !== 'critical' && f.severity !== 'high');
  const hasCritical   = criticalFlags.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className={cn(
          'rounded-2xl border p-4 space-y-3',
          hasCritical ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
              hasCritical ? 'bg-red-100' : 'bg-amber-100',
            )}>
              <AlertTriangle size={16} className={hasCritical ? 'text-red-600' : 'text-amber-600'} />
            </div>
            <div>
              <p className={cn('text-sm font-bold', hasCritical ? 'text-red-800' : 'text-amber-800')}>
                {hasCritical ? 'Critical Alerts Detected' : 'Clinical Alerts'}
              </p>
              <p className={cn('text-xs', hasCritical ? 'text-red-600' : 'text-amber-600')}>
                {flags.length} flag{flags.length > 1 ? 's' : ''} · Review urgently
              </p>
            </div>
          </div>
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center transition-colors',
                hasCritical ? 'text-red-400 hover:bg-red-100' : 'text-amber-400 hover:bg-amber-100',
              )}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Flags */}
        <div className="space-y-1.5">
          {[...criticalFlags, ...highFlags, ...otherFlags].map((flag, i) => (
            <FlagRow key={i} flag={flag} />
          ))}
        </div>

        {hasCritical && (
          <div className="pt-1 border-t border-red-200 flex items-center gap-2">
            <AlertTriangle size={12} className="text-red-600 shrink-0" />
            <p className="text-xs font-semibold text-red-700">
              Escalate to higher facility — do not delay referral
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function FlagRow({ flag }) {
  const s = {
    critical: { dot: 'bg-red-500',    text: 'text-red-800',    sub: 'text-red-600'  },
    high:     { dot: 'bg-orange-500', text: 'text-orange-800', sub: 'text-orange-600' },
    medium:   { dot: 'bg-amber-500',  text: 'text-amber-800',  sub: 'text-amber-600' },
  }[flag.severity] || { dot: 'bg-slate-400', text: 'text-foreground', sub: 'text-muted-foreground' };

  return (
    <div className="flex items-start gap-2.5">
      <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${s.dot}`} />
      <div>
        <p className={`text-xs font-semibold ${s.text}`}>{flag.message}</p>
        {flag.action && <p className={`text-[11px] mt-0.5 ${s.sub}`}>{flag.action}</p>}
      </div>
    </div>
  );
}
