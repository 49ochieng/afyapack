'use client';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { RightPanel } from '@/components/layout/RightPanel';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import {
  Cpu, Database, Wifi, WifiOff, Shield, Info,
  BookOpen, Package, Activity, CheckCircle2, AlertTriangle, XCircle, Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

const FADE = (delay) => ({ initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay } });

export default function SettingsPage() {
  const { apiReady, modelReady, mockMode, modelName, protocolCount, loading } = useSystemStatus();
  const isOnline = useOfflineStatus();

  return (
    <AppShell rightPanel={<RightPanel />}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 lg:px-8 py-8 space-y-8">

          {/* Header */}
          <motion.div {...FADE(0)}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center">
                <Activity size={18} className="text-slate-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Settings</h1>
                <p className="text-sm text-muted-foreground">System status and app information</p>
              </div>
            </div>
          </motion.div>

          {/* System status */}
          <motion.section {...FADE(0.08)} className="space-y-3">
            <p className="afya-label">System Status</p>
            <div className="afya-card divide-y divide-border overflow-hidden">
              <StatusItem
                icon={isOnline ? Wifi : WifiOff}
                label="Network"
                value={isOnline ? 'Connected' : 'Offline — running locally'}
                status={isOnline ? 'ok' : 'warn'}
                detail="App works fully offline after initial setup"
              />
              <StatusItem
                icon={Activity}
                label="API Server"
                value={loading ? 'Checking…' : apiReady ? 'Running on :3001' : 'Not reachable'}
                status={loading ? 'loading' : apiReady ? 'ok' : 'error'}
                detail="Local Express API · port 3001"
              />
              <StatusItem
                icon={Cpu}
                label="Local AI"
                value={loading ? 'Checking…' : modelReady ? modelName : mockMode ? 'Demo mode' : 'Not loaded'}
                status={loading ? 'loading' : modelReady ? 'ok' : mockMode ? 'warn' : 'error'}
                detail={mockMode
                  ? 'Foundry Local not detected. Using template guidance. Retrieval still active.'
                  : 'Foundry Local or Ollama · OpenAI-compatible API'}
              />
              <StatusItem
                icon={BookOpen}
                label="Protocol Pack"
                value={loading ? 'Loading…' : protocolCount ? `${protocolCount} documents indexed` : 'Not loaded'}
                status={loading ? 'loading' : protocolCount ? 'ok' : 'error'}
                detail="TF-IDF cosine similarity · Local SQLite"
              />
            </div>
          </motion.section>

          {/* AI setup (if not ready) */}
          {!modelReady && (
            <motion.section {...FADE(0.16)} className="space-y-3">
              <p className="afya-label">Set Up Local AI</p>
              <div className="afya-card p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <Terminal size={15} className="text-blue-600" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-bold text-foreground">Enable local AI inference</p>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                        Install Foundry Local — run <code className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded-md ml-1">foundry model run qwen2.5-0.5b</code>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                        Or install Ollama — run <code className="text-xs font-mono bg-secondary px-1.5 py-0.5 rounded-md ml-1">ollama run mistral</code>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                        Restart the AfyaPack API server
                      </li>
                    </ol>
                    <p className="text-xs text-muted-foreground pt-1">
                      The app works in demo mode without local AI — retrieval and UI are fully functional.
                    </p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* About */}
          <motion.section {...FADE(0.2)} className="space-y-3">
            <p className="afya-label">About AfyaPack</p>
            <div className="afya-card overflow-hidden">
              <div className="flex items-center gap-3 p-5 border-b border-border">
                <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
                  <Activity size={22} className="text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-base">AfyaPack</p>
                  <p className="text-xs text-muted-foreground">Offline-first AI health decision support · v1.0</p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary-light text-primary border border-primary/20">
                  JS AI Build-a-thon
                </span>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Frontend', value: 'Next.js 14 · Tailwind CSS · Framer Motion' },
                  { label: 'Backend',  value: 'Node.js · Express · SQLite (sql.js)' },
                  { label: 'Local AI', value: 'Foundry Local · Ollama · OpenAI-compat API' },
                  { label: 'Retrieval', value: 'TF-IDF + cosine similarity · 28 chunks · 5 protocols' },
                  { label: 'Storage',  value: 'SQLite (local) · IndexedDB (browser)' },
                  { label: 'Language', value: 'English · Swahili (Kiswahili) · multilingual' },
                ].map(row => <InfoRow key={row.label} {...row} />)}
              </div>
            </div>
          </motion.section>

          {/* Responsible AI */}
          <motion.section {...FADE(0.28)} className="space-y-3">
            <p className="afya-label">Responsible AI Principles</p>
            <div className="afya-card p-5 space-y-3">
              {[
                'Clinical decision support only — does not diagnose',
                'All guidance grounded in local protocol documents',
                'Citations shown for every AI-generated response',
                'Always apply independent clinical judgement',
                'Refer and escalate when uncertain',
                'All patient data stored locally — no external transmission',
                'Transparent about insufficient evidence',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <Shield size={13} className="text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-foreground">{item}</span>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>
    </AppShell>
  );
}

function StatusItem({ icon: Icon, label, value, status, detail }) {
  const cfg = {
    ok:      { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50',  icolor: 'text-emerald-600' },
    warn:    { icon: AlertTriangle, color: 'text-amber-600',  bg: 'bg-amber-50',    icolor: 'text-amber-600' },
    error:   { icon: XCircle,       color: 'text-red-600',    bg: 'bg-red-50',      icolor: 'text-red-600' },
    loading: { icon: null,           color: 'text-muted-foreground', bg: 'bg-secondary', icolor: 'text-muted-foreground' },
  }[status] || {};

  const StatusIcon = cfg.icon;

  return (
    <div className="flex items-start gap-3.5 p-4">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', cfg.bg)}>
        <Icon size={17} className={cfg.icolor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {StatusIcon && status !== 'loading' && (
            <StatusIcon size={14} className={cn(cfg.color, 'shrink-0')} />
          )}
          {status === 'loading' && (
            <span className="w-3.5 h-3.5 border-2 border-muted-foreground/40 border-t-muted-foreground rounded-full animate-spin shrink-0" />
          )}
        </div>
        <p className="text-sm text-foreground mt-0.5">{value}</p>
        {detail && <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs font-semibold text-muted-foreground shrink-0">{label}</span>
      <span className="text-xs text-foreground text-right">{value}</span>
    </div>
  );
}
