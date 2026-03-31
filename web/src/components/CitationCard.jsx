import { BookOpen, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function CitationCard({ citation, index }) {
  const score = citation.score !== undefined ? Math.round(citation.score * 100) : null;
  const relevance = score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';

  return (
    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-primary-light border border-primary/15 hover:border-primary/30 transition-colors">
      {/* Index badge */}
      <div className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-primary">{index}</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-foreground leading-snug">{citation.title}</p>
        {citation.section && (
          <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{citation.section}</p>
        )}
      </div>

      {score !== null && (
        <div className="shrink-0 text-right">
          <span className={cn(
            'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
            relevance === 'high' ? 'bg-emerald-100 text-emerald-700' :
            relevance === 'mid'  ? 'bg-amber-100 text-amber-700' :
                                   'bg-slate-100 text-slate-600',
          )}>
            {score}%
          </span>
        </div>
      )}
    </div>
  );
}

export function CitationList({ citations = [] }) {
  if (!citations.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <BookOpen size={13} className="text-primary" />
        <span className="text-xs font-bold text-foreground">
          Protocol Sources ({citations.length})
        </span>
        <span className="ml-auto">
          <CheckCircle2 size={13} className="text-emerald-500" />
        </span>
      </div>
      <div className="space-y-2">
        {citations.map((c, i) => (
          <CitationCard key={c.id || i} citation={c} index={i + 1} />
        ))}
      </div>
    </div>
  );
}
