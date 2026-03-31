'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { RightPanel } from '@/components/layout/RightPanel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateReferral, getReferral, updateReferral, getEncounter } from '@/lib/api';
import { describePatient, formatDateTime } from '@/lib/utils';
import { ArrowLeft, Save, Copy, Check, FileText, AlertTriangle, Sparkles } from 'lucide-react';

export default function ReferralPage() {
  const { id } = useParams();
  const [encounter, setEncounter] = useState(null);
  const [referral, setReferral] = useState(null);
  const [editedSummary, setEditedSummary] = useState('');
  const [facility, setFacility] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const enc = await getEncounter(id);
        setEncounter(enc);
        try {
          const existing = await getReferral(id);
          setReferral(existing);
          setEditedSummary(existing.summary);
          setFacility(existing.facility || '');
        } catch {
          const generated = await generateReferral(id);
          setReferral(generated);
          setEditedSummary(generated.summary);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await updateReferral(referral.id, { summary: editedSummary, facility, saved: true });
      setReferral(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(editedSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const isUrgent = referral?.urgency === 'urgent';

  return (
    <AppShell rightPanel={<RightPanel encounter={encounter} />}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 lg:px-8 py-8 space-y-6">

          {/* Back */}
          <Link href={`/guidance/${id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} />
            Back to guidance
          </Link>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-start gap-3 justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground tracking-tight">Referral Summary</h1>
                  {encounter && (
                    <p className="text-sm text-muted-foreground mt-0.5">{describePatient(encounter)}</p>
                  )}
                </div>
              </div>
              {referral && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
                  isUrgent ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {isUrgent && <AlertTriangle size={10} />}
                  {isUrgent ? 'Urgent Referral' : 'Routine Referral'}
                </span>
              )}
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
              <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="afya-card p-10 flex flex-col items-center gap-5 text-center">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles size={20} className="text-primary" />
                </div>
              </div>
              <p className="text-sm font-semibold text-foreground">Generating referral summary…</p>
            </div>
          )}

          {referral && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Urgency alert */}
              {isUrgent && (
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200">
                  <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Urgent Referral</p>
                    <p className="text-xs text-red-700 mt-0.5">
                      Contact receiving facility before transport. Ensure patient is stable for transfer.
                    </p>
                  </div>
                </div>
              )}

              {/* Editor card */}
              <div className="afya-card overflow-hidden">
                <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border bg-purple-50/50">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                    <FileText size={14} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">Referral Note</p>
                    {referral.created_at && (
                      <p className="text-[11px] text-muted-foreground">{formatDateTime(referral.created_at)}</p>
                    )}
                  </div>
                  {referral.saved && (
                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Saved locally
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="facility">Referring to (facility name)</Label>
                    <Input
                      id="facility"
                      placeholder="e.g. Kisumu District Hospital"
                      value={facility}
                      onChange={e => setFacility(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="summary">Referral note (editable)</Label>
                      <span className="text-[11px] text-muted-foreground">Review before use</span>
                    </div>
                    <Textarea
                      id="summary"
                      rows={14}
                      className="font-mono text-xs leading-relaxed"
                      value={editedSummary}
                      onChange={e => setEditedSummary(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1" onClick={handleCopy}>
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
                  {copied ? 'Copied!' : 'Copy text'}
                </Button>
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving
                    ? <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    : <Save size={16} />
                  }
                  {saving ? 'Saving…' : 'Save locally'}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                Review this summary before use · AI-generated content may require editing · Does not constitute a medical record
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
