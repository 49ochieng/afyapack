'use client';
import { motion } from 'framer-motion';
import { Sparkles, AlertTriangle, CheckCircle2, BookOpen, Package, FileText, Image } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatMessage({ message, index }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex justify-end"
      >
        <div className="max-w-[82%] space-y-1.5">
          {/* Attachments */}
          {message.attachments?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 justify-end">
              {message.attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                  {a.type?.startsWith('image/') && a.dataUrl ? (
                    <img src={a.dataUrl} alt={a.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : a.type?.startsWith('image/') ? (
                    <Image size={12} className="text-primary" />
                  ) : (
                    <FileText size={12} className="text-primary" />
                  )}
                  <span className="text-[11px] font-medium text-primary max-w-[120px] truncate">{a.name}</span>
                </div>
              ))}
            </div>
          )}
          <div className="chat-message-user">
            <p className="leading-relaxed">{message.content}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex items-start gap-3"
    >
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
        message.isError ? 'bg-red-100' : 'bg-primary/10',
      )}>
        <Sparkles size={14} className={message.isError ? 'text-red-500' : 'text-primary'} />
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className={cn(
          'chat-message-ai',
          message.isError && 'border-red-200 bg-red-50',
        )}>
          {/* Tool badge */}
          {message.tool_used && (
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-border">
              <ToolBadge tool={message.tool_used} />
            </div>
          )}

          {/* Escalation banner */}
          {message.escalation && (
            <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl bg-red-50 border border-red-200">
              <AlertTriangle size={13} className="text-red-600 shrink-0" />
              <p className="text-xs font-semibold text-red-700">Escalation recommended — consider urgent referral</p>
            </div>
          )}

          {/* Content */}
          <AssistantContent text={message.content} />
        </div>

        {/* Citations */}
        {message.citations?.length > 0 && (
          <CitationRow citations={message.citations} />
        )}
      </div>
    </motion.div>
  );
}

function AssistantContent({ text }) {
  if (!text) return null;

  // Parse simple markdown: **bold**, numbered lists, bullet lists, sections
  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    if (!line) { i++; continue; }

    // Section heading (** at start and end or just bold heading)
    if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
      const heading = line.slice(2, -2);
      elements.push(
        <p key={i} className="text-xs font-bold text-foreground uppercase tracking-wide mt-4 mb-1.5 first:mt-0">
          {heading}
        </p>
      );
      i++; continue;
    }

    // Numbered list item
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
        <ol key={`ol-${i}`} className="list-decimal list-inside space-y-1.5 my-1.5 pl-0.5">
          {items.map((item, j) => (
            <li key={j} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: boldify(item) }} />
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list item
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const items = [];
      while (i < lines.length) {
        const l = lines[i].trim();
        if (!l.startsWith('- ') && !l.startsWith('• ')) break;
        items.push(l.slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-inside space-y-1.5 my-1.5 pl-0.5">
          {items.map((item, j) => (
            <li key={j} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: boldify(item) }} />
          ))}
        </ul>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={i} className="text-sm leading-relaxed"
        dangerouslySetInnerHTML={{ __html: boldify(line) }} />
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

function boldify(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/⚠️/g, '<span class="text-amber-600">⚠️</span>');
}

function ToolBadge({ tool }) {
  const badges = {
    protocol_search: { icon: BookOpen, label: 'Protocol search', color: 'text-blue-600 bg-blue-50' },
    stock_check:     { icon: Package, label: 'Stock checked', color: 'text-amber-600 bg-amber-50' },
    referral:        { icon: FileText, label: 'Referral generated', color: 'text-purple-600 bg-purple-50' },
    screening:       { icon: AlertTriangle, label: 'Red flag screening', color: 'text-red-600 bg-red-50' },
    grounded:        { icon: CheckCircle2, label: 'Protocol-grounded', color: 'text-emerald-600 bg-emerald-50' },
  };
  const b = badges[tool] || { icon: Sparkles, label: tool, color: 'text-primary bg-primary-light' };
  const Icon = b.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${b.color}`}>
      <Icon size={10} />
      {b.label}
    </span>
  );
}

function CitationRow({ citations }) {
  return (
    <div className="flex gap-2 flex-wrap pl-0">
      {citations.slice(0, 3).map((c, i) => (
        <div key={c.id || i}
          className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-full bg-primary-light border border-primary/20 text-primary">
          <BookOpen size={9} />
          <span className="max-w-[140px] truncate">{c.title || c.doc_title}</span>
          {c.score !== undefined && (
            <span className="text-primary/50">{Math.round(c.score * 100)}%</span>
          )}
        </div>
      ))}
      {citations.length > 3 && (
        <span className="text-[10px] text-muted-foreground px-1 py-1">+{citations.length - 3} more</span>
      )}
    </div>
  );
}
