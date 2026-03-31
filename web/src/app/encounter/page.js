'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { RightPanel } from '@/components/layout/RightPanel';
import { EncounterForm } from '@/components/EncounterForm';
import { createEncounter } from '@/lib/api';
import { ArrowLeft, ClipboardList, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function EncounterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(formData) {
    setLoading(true);
    setError(null);
    try {
      const encounter = await createEncounter(formData);
      router.push(`/guidance/${encounter.id}`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  return (
    <AppShell rightPanel={<RightPanel />}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-5 lg:px-8 py-8 space-y-6">

          {/* Back */}
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} />
            Dashboard
          </Link>

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <ClipboardList size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">New Encounter</h1>
                <p className="text-sm text-muted-foreground">Complete the assessment for protocol-based guidance</p>
              </div>
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-4 rounded-2xl bg-red-50 border border-red-200"
            >
              <AlertTriangle size={15} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800">Could not save encounter</p>
                <p className="text-xs text-red-700 mt-0.5">{error}</p>
                <p className="text-xs text-red-600/70 mt-1">Is the API server running on port 3001?</p>
              </div>
            </motion.div>
          )}

          {/* Form card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="afya-card p-6"
          >
            <EncounterForm onSubmit={handleSubmit} loading={loading} />
          </motion.div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center">
            Protocol-based decision support only · Does not diagnose · Always apply clinical judgement
          </p>
        </div>
      </div>
    </AppShell>
  );
}
