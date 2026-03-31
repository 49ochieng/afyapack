'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { RightPanel } from '@/components/layout/RightPanel';
import { Badge } from '@/components/ui/badge';
import { useSystemStatus } from '@/hooks/useSystemStatus';
import { useOfflineStatus } from '@/hooks/useOfflineStatus';
import { getEncounters, getStock } from '@/lib/api';
import { getRelativeTime, describePatient, summariseSymptoms } from '@/lib/utils';
import {
  MessageCircle, Plus, Package, BookOpen, ChevronRight,
  Cpu, Database, Wifi, WifiOff, AlertTriangle, ClipboardList,
  Sparkles, Activity, Shield
} from 'lucide-react';

const FADE = { hidden: { opacity: 0, y: 16 }, visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35 } }) };

const QUICK_PROMPTS = [
  'Child with fever and diarrhea',
  'Maternal warning signs',
  'ORS preparation steps',
  'When to refer urgently',
];

export default function DashboardPage() {
  const router = useRouter();
  const { apiReady, modelReady, mockMode, modelName, protocolCount, loading: statusLoading } = useSystemStatus();
  const isOnline = useOfflineStatus();
  const [encounters, setEncounters] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [encs, stock] = await Promise.all([getEncounters(), getStock()]);
        setEncounters(encs.slice(0, 4));
        setStockAlerts(stock.filter(s => s.is_low || s.is_out));
      } catch {}
      finally { setDataLoading(false); }
    }
    load();
  }, []);

  function handlePrompt(prompt) {
    router.push(`/chat?q=${encodeURIComponent(prompt)}`);
  }

  return (
    <AppShell rightPanel={<RightPanel />}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 lg:px-8 py-8 space-y-10">

          {/* ── Hero ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-4"
          >
            {/* Status badge */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                <span className={isOnline ? 'status-dot-green' : 'status-dot-amber'} />
                {isOnline ? 'Offline-ready' : 'Offline mode'}
              </span>
              {modelReady && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-light text-primary">
                  <Sparkles size={10} />
                  AI Ready
                </span>
              )}
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight leading-tight">
                Good day,<br />
                <span className="text-primary">AfyaPack</span> is ready.
              </h1>
              <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                Offline-first AI decision support for frontline health workers.
                {' '}Ask questions, assess patients, and access clinical protocols — without internet.
              </p>
            </div>

            {/* Chat CTA */}
            <Link href="/chat">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                className="afya-card p-4 cursor-pointer transition-all duration-200 hover:shadow-card-hover group"
                style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(171,80%,28%) 100%)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <MessageCircle size={20} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-bold text-base">Ask AfyaPack</div>
                    <div className="text-white/70 text-xs mt-0.5">
                      Ask in English, Swahili, or any language
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/50 group-hover:text-white transition-colors" />
                </div>

                {/* Quick prompts */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  {QUICK_PROMPTS.map(p => (
                    <button
                      key={p}
                      onClick={(e) => { e.preventDefault(); handlePrompt(p); }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/15 text-white/80 hover:bg-white/25 hover:text-white transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </motion.div>
            </Link>
          </motion.div>

          {/* ── Status Grid ───────────────────────────── */}
          <motion.div custom={0} variants={FADE} initial="hidden" animate="visible">
            <p className="afya-label mb-3">System Status</p>
            <div className="grid grid-cols-3 gap-3">
              <StatusCard
                icon={Cpu}
                label="AI Model"
                value={statusLoading ? 'Checking…' : modelReady ? 'Ready' : mockMode ? 'Demo' : 'Offline'}
                status={statusLoading ? 'loading' : modelReady ? 'ok' : mockMode ? 'warn' : 'error'}
                sub={modelReady ? modelName?.split('/').pop() : null}
              />
              <StatusCard
                icon={Database}
                label="Protocols"
                value={statusLoading ? '…' : protocolCount ? `${protocolCount}` : '0'}
                sub={protocolCount ? 'docs loaded' : 'not loaded'}
                status={statusLoading ? 'loading' : protocolCount ? 'ok' : 'warn'}
              />
              <StatusCard
                icon={Package}
                label="Stock"
                value={dataLoading ? '…' : stockAlerts.length > 0 ? `${stockAlerts.length}` : '✓'}
                sub={stockAlerts.length > 0 ? 'items low' : 'all stocked'}
                status={dataLoading ? 'loading' : stockAlerts.length > 0 ? 'warn' : 'ok'}
              />
            </div>
          </motion.div>

          {/* ── Quick Actions ─────────────────────────── */}
          <motion.div custom={1} variants={FADE} initial="hidden" animate="visible">
            <p className="afya-label mb-3">Quick Actions</p>
            <div className="grid grid-cols-2 gap-3">
              <ActionCard href="/encounter" icon={Plus} title="New Encounter"
                description="Start patient triage" color="teal" />
              <ActionCard href="/stock" icon={Package} title="Stock Tracker"
                description={stockAlerts.length > 0 ? `${stockAlerts.length} items need restocking` : 'Check supply levels'}
                color="amber" alert={stockAlerts.length > 0} />
              <ActionCard href="/protocols" icon={BookOpen} title="Protocol Library"
                description="Browse clinical guidelines" color="blue" />
              <ActionCard href="/chat" icon={MessageCircle} title="AI Chat"
                description="Ask questions freely" color="purple" />
            </div>
          </motion.div>

          {/* ── Recent Encounters ─────────────────────── */}
          <motion.div custom={2} variants={FADE} initial="hidden" animate="visible">
            <div className="flex items-center justify-between mb-3">
              <p className="afya-label">Recent Encounters</p>
              <Link href="/encounter"
                className="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1">
                New <Plus size={11} />
              </Link>
            </div>

            {dataLoading ? (
              <div className="space-y-2">
                {[1, 2].map(i => (
                  <div key={i} className="afya-card h-16 skeleton" />
                ))}
              </div>
            ) : encounters.length === 0 ? (
              <div className="afya-card p-8 text-center">
                <ClipboardList size={28} className="mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No encounters yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Start a new patient assessment above
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {encounters.map((enc, i) => (
                  <motion.div
                    key={enc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.06 }}
                  >
                    <EncounterRow encounter={enc} />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── Safety notice ─────────────────────────── */}
          <motion.div custom={3} variants={FADE} initial="hidden" animate="visible">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
              <Shield size={15} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>AfyaPack is clinical decision support only.</strong>{' '}
                It does not diagnose. Always apply clinical judgement.
                Refer when uncertain. All data is stored locally on this device.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}

function StatusCard({ icon: Icon, label, value, sub, status }) {
  const styles = {
    ok:      { bg: 'bg-emerald-50',  border: 'border-emerald-100', dot: 'bg-emerald-500', icon: 'text-emerald-600' },
    warn:    { bg: 'bg-amber-50',    border: 'border-amber-100',   dot: 'bg-amber-500',   icon: 'text-amber-600' },
    error:   { bg: 'bg-red-50',      border: 'border-red-100',     dot: 'bg-red-500',     icon: 'text-red-600' },
    loading: { bg: 'bg-secondary',   border: 'border-border',      dot: 'bg-slate-400',   icon: 'text-muted-foreground' },
  }[status] || { bg: 'bg-secondary', border: 'border-border', dot: 'bg-slate-400', icon: 'text-muted-foreground' };

  return (
    <div className={`afya-card p-3.5 ${styles.bg} ${styles.border}`}>
      <div className="flex items-center justify-between mb-2">
        <Icon size={14} className={styles.icon} />
        <div className={`w-2 h-2 rounded-full ${styles.dot} ${status !== 'error' && status !== 'loading' ? 'animate-pulse-soft' : ''}`} />
      </div>
      <div className="text-lg font-bold text-foreground leading-none">{value}</div>
      <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">{label}</div>
      {sub && <div className="text-[9px] text-muted-foreground/70 mt-0.5 truncate">{sub}</div>}
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, description, color, alert }) {
  const colors = {
    teal:   { bg: 'bg-teal-50',   border: 'border-teal-100',   icon: 'text-teal-600',   hover: 'hover:bg-teal-50' },
    amber:  { bg: 'bg-amber-50',  border: 'border-amber-100',  icon: 'text-amber-600',  hover: 'hover:bg-amber-50' },
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: 'text-blue-600',   hover: 'hover:bg-blue-50' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-100', icon: 'text-purple-600', hover: 'hover:bg-purple-50' },
  }[color] || {};

  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        className={`afya-card p-4 cursor-pointer transition-all duration-200 hover:shadow-card-hover relative ${colors.hover}`}
      >
        {alert && (
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-amber-500" />
        )}
        <div className={`w-8 h-8 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center mb-3`}>
          <Icon size={16} className={colors.icon} />
        </div>
        <div className="text-sm font-bold text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</div>
      </motion.div>
    </Link>
  );
}

function EncounterRow({ encounter }) {
  const hasCritical = encounter.red_flags?.some(f => f.severity === 'critical');
  const hasHigh = encounter.red_flags?.some(f => f.severity === 'high');

  return (
    <Link href={`/guidance/${encounter.id}`}>
      <div className="afya-card px-4 py-3.5 cursor-pointer hover:shadow-card-hover transition-all duration-150 group">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            hasCritical ? 'bg-red-500' : hasHigh ? 'bg-orange-400' : 'bg-emerald-500'
          }`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{describePatient(encounter)}</span>
              {hasCritical && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                  Urgent
                </span>
              )}
              {!hasCritical && hasHigh && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  Alert
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 truncate">
              {summariseSymptoms(encounter.symptoms)}
              {encounter.duration ? ` · ${encounter.duration}` : ''}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground">{getRelativeTime(encounter.created_at)}</span>
            <ChevronRight size={14} className="text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
        </div>
      </div>
    </Link>
  );
}
