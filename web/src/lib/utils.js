import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

export function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

export function getSeverityColor(severity) {
  switch (severity) {
    case 'critical': return 'text-red-700 bg-red-50 border-red-200';
    case 'high': return 'text-orange-700 bg-orange-50 border-orange-200';
    case 'medium': return 'text-amber-700 bg-amber-50 border-amber-200';
    default: return 'text-blue-700 bg-blue-50 border-blue-200';
  }
}

export function getSeverityDot(severity) {
  switch (severity) {
    case 'critical': return 'bg-red-500';
    case 'high': return 'bg-orange-500';
    case 'medium': return 'bg-amber-500';
    default: return 'bg-blue-500';
  }
}

export function getUrgencyColor(urgency) {
  return urgency === 'urgent'
    ? 'text-red-700 bg-red-50 border-red-200'
    : 'text-emerald-700 bg-emerald-50 border-emerald-200';
}

export function describePatient(encounter) {
  if (!encounter) return 'Unknown patient';
  const parts = [];
  if (encounter.age) parts.push(`${encounter.age}y`);
  if (encounter.sex) parts.push(encounter.sex);
  if (encounter.pregnant) parts.push('pregnant');
  return parts.join(' · ') || 'Unknown patient';
}

export function summariseSymptoms(symptoms, max = 3) {
  if (!Array.isArray(symptoms) || symptoms.length === 0) return 'No symptoms listed';
  const shown = symptoms.slice(0, max);
  const rest = symptoms.length - max;
  return rest > 0 ? `${shown.join(', ')} +${rest} more` : shown.join(', ');
}

/**
 * Render markdown-like bold (**text**) to plain text for display.
 * For full HTML rendering, use the renderGuidance function.
 */
export function stripMarkdownBold(text) {
  return text?.replace(/\*\*(.*?)\*\*/g, '$1') || '';
}

/**
 * Convert basic markdown to HTML for guidance display.
 * Only handles: **bold**, numbered lists, line breaks.
 */
export function renderGuidanceMarkdown(text) {
  if (!text) return '';
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^(\d+\.\s)/gm, '<br/>$1')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}
