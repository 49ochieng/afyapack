'use client';
import { cn } from '@/lib/utils';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Renders AI guidance markdown text as structured sections.
 */
export function GuidanceDisplay({ text, className }) {
  if (!text) return null;

  // Parse the structured markdown
  const sections = parseGuidance(text);

  return (
    <div className={cn('space-y-4', className)}>
      {sections.map((section, i) => (
        <GuidanceSection key={i} section={section} />
      ))}
    </div>
  );
}

function GuidanceSection({ section }) {
  if (section.type === 'safety') {
    return (
      <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <p className="text-sm text-amber-800">{section.content}</p>
      </div>
    );
  }

  if (section.type === 'escalation') {
    return (
      <div className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle size={16} className="text-red-600 mt-0.5 shrink-0" />
        <div>
          {section.heading && (
            <p className="text-sm font-semibold text-red-800 mb-1">{section.heading}</p>
          )}
          <div className="text-sm text-red-800 space-y-0.5">
            {renderContent(section.content)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {section.heading && (
        <h3 className="text-sm font-semibold text-foreground">{section.heading}</h3>
      )}
      <div className="text-sm text-foreground leading-relaxed space-y-1">
        {renderContent(section.content)}
      </div>
    </div>
  );
}

function renderContent(content) {
  if (!content) return null;

  const lines = content.split('\n').filter(l => l.trim());

  return lines.map((line, i) => {
    // Numbered list item
    if (/^\d+\./.test(line.trim())) {
      return (
        <div key={i} className="flex gap-2">
          <span className="text-primary font-medium shrink-0">{line.match(/^\d+/)[0]}.</span>
          <span>{formatInline(line.replace(/^\d+\.\s*/, ''))}</span>
        </div>
      );
    }
    // Bullet
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      return (
        <div key={i} className="flex gap-2">
          <span className="text-muted-foreground shrink-0 mt-0.5">•</span>
          <span>{formatInline(line.replace(/^[-*]\s*/, ''))}</span>
        </div>
      );
    }
    return <p key={i}>{formatInline(line)}</p>;
  });
}

function formatInline(text) {
  // Handle **bold**
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="font-semibold text-foreground">{part}</strong> : part
  );
}

function parseGuidance(text) {
  const sections = [];
  const rawSections = text.split(/(?=\*\*[^*]+\*\*)/);

  rawSections.forEach(raw => {
    if (!raw.trim()) return;

    const headingMatch = raw.match(/^\*\*([^*]+)\*\*\n?([\s\S]*)/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      const content = headingMatch[2].trim();

      const type = heading.toLowerCase().includes('safety')
        ? 'safety'
        : heading.toLowerCase().includes('refer') || heading.toLowerCase().includes('escalat')
        ? 'escalation'
        : 'default';

      sections.push({ type, heading, content });
    } else {
      sections.push({ type: 'default', heading: null, content: raw.trim() });
    }
  });

  return sections.filter(s => s.content);
}
