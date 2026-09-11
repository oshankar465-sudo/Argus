import { StatusType, ResourceType } from '../types';

export function formatDate(dateString?: string): string {
  if (!dateString) return '—';
  try {
    const parts = dateString.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return dateString;
  }
}

export function formatTimestamp(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${datePart} — ${timePart}`;
  } catch {
    return isoString;
  }
}

export interface StatusStyle {
  label: StatusType;
  badgeClass: string;
  dotClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
}

export function getStatusStyle(status: StatusType): StatusStyle {
  switch (status) {
    case 'No Status':
      return {
        label: 'No Status',
        badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        dotClass: 'bg-zinc-400',
        borderClass: 'border-zinc-200',
        bgClass: 'bg-zinc-50',
        textClass: 'text-zinc-600',
      };
    case 'Started':
      return {
        label: 'Started',
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        dotClass: 'bg-sky-500',
        borderClass: 'border-sky-200',
        bgClass: 'bg-sky-50/50',
        textClass: 'text-sky-700',
      };
    case 'In Progress':
      return {
        label: 'In Progress',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotClass: 'bg-amber-500',
        borderClass: 'border-amber-200',
        bgClass: 'bg-amber-50/50',
        textClass: 'text-amber-800',
      };
    case 'Completed':
      return {
        label: 'Completed',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-500',
        borderClass: 'border-emerald-200',
        bgClass: 'bg-emerald-50/50',
        textClass: 'text-emerald-800',
      };
    default:
      return {
        label: 'No Status',
        badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
        dotClass: 'bg-zinc-400',
        borderClass: 'border-zinc-200',
        bgClass: 'bg-zinc-50',
        textClass: 'text-zinc-600',
      };
  }
}

export function detectResourceType(fileNameOrUrl: string): ResourceType {
  const lower = fileNameOrUrl.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) return 'link';
  if (lower.endsWith('.pdf')) return 'pdf';
  if (lower.endsWith('.xlsx') || lower.endsWith('.xls') || lower.endsWith('.csv')) return 'excel';
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'word';
  if (lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.svg') || lower.endsWith('.webp')) return 'image';
  return 'file';
}
