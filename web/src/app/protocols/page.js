'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppShell } from '@/components/layout/AppShell';
import { RightPanel } from '@/components/layout/RightPanel';
import { Input } from '@/components/ui/input';
import { getProtocols, getProtocol, searchProtocols } from '@/lib/api';
import { BookOpen, Search, X, ChevronDown, ChevronUp, Wifi, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ProtocolsPage() {
  const [docs, setDocs] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProtocols()
      .then(setDocs)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = useCallback(async (q) => {
    if (!q.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const results = await searchProtocols(q, 6);
      setSearchResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => handleSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  async function handleSelectDoc(docId) {
    if (selectedDoc?.id === docId) { setSelectedDoc(null); return; }
    try {
      const doc = await getProtocol(docId);
      setSelectedDoc(doc);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AppShell rightPanel={<RightPanel />}>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 lg:px-8 py-8 space-y-6">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <BookOpen size={18} className="text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">Protocol Library</h1>
                <p className="text-sm text-muted-foreground">
                  {docs.length} documents · Available offline
                </p>
              </div>
            </div>
          </motion.div>

          {/* Offline badge */}
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 border border-emerald-100 w-fit">
            <Wifi size={13} className="text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">All protocols stored locally — no internet needed</span>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search protocols… fever, dehydration, maternal, referral"
              className="pl-10 pr-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {searching
                  ? <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin block" />
                  : <X size={14} />
                }
              </button>
            )}
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">{error}</div>
          )}

          {/* Results */}
          <AnimatePresence mode="wait">
            {searchResults !== null ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {searchResults.length} match{searchResults.length !== 1 ? 'es' : ''} for "{searchQuery}"
                </p>
                {searchResults.length === 0 ? (
                  <div className="afya-card p-8 text-center">
                    <FileText size={24} className="mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No matching sections found</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Try a different search term</p>
                  </div>
                ) : (
                  searchResults.map((chunk, i) => (
                    <motion.div
                      key={chunk.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="afya-card p-4 space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-bold text-primary">{chunk.doc_title}</p>
                          {chunk.section && (
                            <p className="text-[11px] text-muted-foreground mt-0.5">{chunk.section}</p>
                          )}
                        </div>
                        <span className={cn(
                          'text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0',
                          chunk.score >= 0.7 ? 'bg-emerald-100 text-emerald-700' :
                          chunk.score >= 0.4 ? 'bg-amber-100 text-amber-700' :
                                              'bg-secondary text-muted-foreground',
                        )}>
                          {Math.round(chunk.score * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                        {chunk.content}
                      </p>
                    </motion.div>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="docs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2.5"
              >
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => <div key={i} className="afya-card h-20 skeleton" />)}
                  </div>
                ) : (
                  docs.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <DocCard
                        doc={doc}
                        expanded={selectedDoc?.id === doc.id}
                        expandedData={selectedDoc?.id === doc.id ? selectedDoc : null}
                        onToggle={() => handleSelectDoc(doc.id)}
                      />
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppShell>
  );
}

function DocCard({ doc, expanded, expandedData, onToggle }) {
  return (
    <div className="afya-card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3.5 p-4 text-left hover:bg-secondary/40 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <BookOpen size={16} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{doc.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {doc.chunk_count} sections · Local document
          </p>
        </div>
        <div className="shrink-0 text-muted-foreground">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && expandedData && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-border divide-y divide-border/60">
              {expandedData.sections.map(section => (
                <div key={section.id} className="px-5 py-4 space-y-2">
                  {section.section && (
                    <p className="text-[11px] font-bold text-primary uppercase tracking-wide">{section.section}</p>
                  )}
                  <p className="text-sm text-foreground leading-relaxed">{section.content}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
