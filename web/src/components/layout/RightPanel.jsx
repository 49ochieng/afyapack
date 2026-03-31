'use client';
import { cn } from '@/lib/utils';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { Badge } from '@/components/ui/badge';
import { Cpu, Database, Wifi, WifiOff, Package, ShieldCheck, AlertTriangle, ExternalLink } from 'lucide-react';

export function RightPanel({ encounter, citations, children }) {
  const { modelReady, modelName, mockMode, protocolCount, stockAlerts } = useSystemStatus();
  const isOnline = useOfflineStatus();

  return (
    <aside className="hidden xl:flex flex-col w-64 shrink-0 sticky top-0 h-screen overflow-y-auto border-l border-border">
      <div className="flex-1 p-4 space-y-4">

        {/* System Status */}
        <div className="space-y-2">
          <p className="afya-label mb-3">System Status</p>

          <StatusRow
            icon={isOnline ? Wifi : WifiOff}
            label="Network"
            value={isOnline ? 'Connected' : 'Offline'}
            status={isOnline ? 'ok' : 'warn'}
          />
          <StatusRow
            icon={Cpu}
            label="Local AI"
            value={modelReady ? modelName?.split('/').pop() : mockMode ? 'Demo mode' : 'Not loaded'}
            status={modelReady ? 'ok' : mockMode ? 'warn' : 'error'}
          />
          <StatusRow
            icon={Database}
            label="Protocols"
            value={protocolCount ? `${protocolCount} docs` : 'Loading…'}
            status={protocolCount ? 'ok' : 'warn'}
          />
          {stockAlerts > 0 && (
            <StatusRow
              icon={Package}
              label="Stock alerts"
              value={`${stockAlerts} items low`}
              status="warn"
            />
          )}
        </div>

        {/* Patient summary */}
        {encounter && (
          <div className="pt-4 border-t border-border space-y-2">
            <p className="afya-label mb-3">Current Patient</p>
            <div className="space-y-1.5">
              <PatientRow label="Age" value={encounter.age ? `${encounter.age} yrs` : '—'} />
              <PatientRow label="Sex" value={encounter.sex || '—'} />
              {encounter.pregnant && (
                <PatientRow label="Pregnant" value="Yes" highlight />
              )}
              {encounter.temperature && (
                <PatientRow
                  label="Temp"
                  value={`${encounter.temperature}°C`}
                  highlight={encounter.temperature >= 38.5}
                />
              )}
              {encounter.pulse && (
                <PatientRow
                  label="Pulse"
                  value={`${encounter.pulse} bpm`}
                  highlight={encounter.pulse > 110}
                />
              )}
            </div>
          </div>
        )}

        {/* Citations */}
        {citations && citations.length > 0 && (
          <div className="pt-4 border-t border-border space-y-2">
            <p className="afya-label mb-3">Protocol Sources</p>
            <div className="space-y-2.5">
              {citations.map((c, i) => (
                <CitationItem key={c.id || i} citation={c} index={i} />
              ))}
            </div>
          </div>
        )}

        {children}
      </div>

      {/* Footer disclaimer */}
      <div className="p-4 border-t border-border">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
          <ShieldCheck size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-700 leading-relaxed">
            Decision support only. Not a diagnosis. Always apply clinical judgement.
          </p>
        </div>
      </div>
    </aside>
  );
}

function StatusRow({ icon: Icon, label, value, status }) {
  const dot = {
    ok:    'bg-emerald-500',
    warn:  'bg-amber-500',
    error: 'bg-red-500',
  }[status] || 'bg-slate-400';

  return (
    <div className="flex items-center gap-2.5 py-0.5">
      <Icon size={13} className="text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[10px] text-muted-foreground font-medium">{label}</div>
        <div className="text-xs font-semibold text-foreground truncate">{value}</div>
      </div>
      <div className={cn('w-2 h-2 rounded-full shrink-0', dot, status !== 'error' && 'animate-pulse-soft')} />
    </div>
  );
}

function PatientRow({ label, value, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn(
        'text-xs font-semibold',
        highlight ? 'text-amber-600' : 'text-foreground',
      )}>
        {value}
      </span>
    </div>
  );
}

function CitationItem({ citation, index }) {
  const score = citation.score !== undefined ? Math.round(citation.score * 100) : null;
  return (
    <div className="p-2.5 rounded-xl bg-primary-light border border-primary/20 space-y-0.5">
      <div className="flex items-start justify-between gap-1">
        <p className="text-[11px] font-semibold text-primary leading-snug flex-1">
          {index + 1}. {citation.title}
        </p>
        {score !== null && (
          <span className="text-[9px] font-bold text-primary/60 shrink-0">{score}%</span>
        )}
      </div>
      {citation.section && (
        <p className="text-[10px] text-primary/60">{citation.section}</p>
      )}
    </div>
  );
}
