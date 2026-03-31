'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { RightPanel } from '@/components/layout/RightPanel';
import { RedFlagBanner } from '@/components/RedFlagBanner';
import { CitationList } from '@/components/CitationCard';
import { Button } from '@/components/ui/button';
import { getEncounter, generateGuidance, getGuidance } from '@/lib/api';
import { describePatient } from '@/lib/utils';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Sparkles, FileText, RefreshCw, AlertTriangle,
  CheckCircle2, Plus, BookOpen, Shield
} from 'lucide-react';

export default function GuidancePage() {
  const { id } = useParams();
  const router = useRouter();
  const [encounter, setEncounter] = useState(null);
  const [guidance, setGuidance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const enc = await getEncounter(id);
        setEncounter(enc);
        try {
          const existing = await getGuidance(id);
          setGuidance(existing);
          setLoading(false);
        } catch {
          await generate(enc);
        }
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function generate(enc) {
    setGenerating(true);
    setError(null);
    try {
      const result = await generateGuidance(id);
      setGuidance(result);
      if (!encounter && enc) setEncounter(enc);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  }

  const redFlags = encounter?.red_flags || [];
  const hasCritical = redFlags.some(f => f.severity === 'critical');

  return (
    <AppShell rightPanel={<RightPanel encounter={encounter} citations={guidance?.citations} />}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 lg:px-8 py-8 space-y-6">

          {/* Nav */}
          <div className="flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft size={15} />
              Dashboard
            </Link>
            {guidance && !loading && !generating && (
              <button
                onClick={() => generate(encounter)}
                disabled={generating}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw size={14} className={generating ? 'animate-spin' : ''} />
                Regenerate
              </button>
            )}
          </div>

          {/* Patient header */}
          {encounter && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">Clinical Guidance</h1>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {describePatient(encounter)}
                    {encounter.duration ? ` · ${encounter.duration}` : ''}
                  </p>
                </div>
                {hasCritical && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200 shrink-0">
                    <AlertTriangle size={11} />
                    Urgent
                  </span>
                )}
              </div>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200"
            >
              <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Error generating guidance</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
              </div>
            </motion.div>
          )}

          {/* Red flags */}
          {redFlags.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
              <RedFlagBanner flags={redFlags} />
            </motion.div>
          )}

          {/* Loading state */}
          {(loading || generating) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="afya-card p-10 flex flex-col items-center gap-5 text-center"
            >
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={20} className="text-primary" />
                </div>
              </div>
              <div>
                <p className="font-bold text-foreground text-base">
                  {generating ? 'Generating clinical guidance…' : 'Loading…'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Retrieving protocol chunks · Running local AI inference
                </p>
              </div>
            </motion.div>
          )}

          {/* Guidance result */}
          {guidance && !loading && !generating && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-5"
            >
              {/* Escalation banner */}
              {guidance.escalation_needed && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
                  <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Escalation Recommended</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      This patient requires referral to a higher facility. Prepare documentation now.
                    </p>
                  </div>
                </div>
              )}

              {/* AI guidance card */}
              <div className="afya-card overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-primary-light/50">
                  <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                    <Sparkles size={15} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">Protocol-Based Guidance</p>
                    <p className="text-[11px] text-muted-foreground">Generated by local AI · Grounded in clinical protocols</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                    Local AI
                  </span>
                </div>
                {/* Content */}
                <div className="px-5 py-5 guidance-prose">
                  <GuidanceSections text={guidance.guidance_text} />
                </div>
              </div>

              {/* Citations */}
              {guidance.citations?.length > 0 && (
                <div className="afya-card p-5">
                  <CitationList citations={guidance.citations} />
                </div>
              )}

              {/* Safety note */}
              {guidance.safety_note && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-100">
                  <Shield size={14} className="text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">{guidance.safety_note}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <Button className="flex-1" size="lg" onClick={() => router.push(`/referral/${id}`)}>
                  <FileText size={16} />
                  Generate Referral
                </Button>
                <Button variant="outline" className="flex-1" size="lg" onClick={() => router.push('/encounter')}>
                  <Plus size={16} />
                  New Encounter
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Protocol-based decision support only · Not a diagnosis · Always apply clinical judgement
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function GuidanceSections({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      const heading = line.slice(2, -2);
      elements.push(<h2 key={i}>{heading}</h2>);
      i++; continue;
    }

    const numMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (numMatch) {
      const items = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        const m = l.match(/^(\d+)\.\s+(.+)$/);
        if (!m) break;
        items.push(m[2]);
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`}>
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: boldify(item) }} />
          ))}
        </ol>
      );
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('• ')) {
      const items = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        if (!l.startsWith('- ') && !l.startsWith('• ')) break;
        items.push(l.slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`}>
          {items.map((item, j) => (
            <li key={j} dangerouslySetInnerHTML={{ __html: boldify(item) }} />
          ))}
        </ul>
      );
      continue;
    }

    elements.push(
      <p key={i} dangerouslySetInnerHTML={{ __html: boldify(line) }} />
    );
    i++;
  }

  return <>{elements}</>;
}

function boldify(text) {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
