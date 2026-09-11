import React from 'react';
import { useArgus } from '../context/ArgusContext';
import { Mail } from 'lucide-react';

interface ClickToEmailButtonProps {
  email?: string;
  candidateName?: string;
  taskName?: string;
  variant?: 'inline' | 'button' | 'icon-only';
  className?: string;
  label?: string;
}

export const ClickToEmailButton: React.FC<ClickToEmailButtonProps> = ({
  email,
  candidateName = 'Candidate',
  taskName,
  variant = 'inline',
  className = '',
  label,
}) => {
  const { openEmailModal } = useArgus();

  if (!email) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openEmailModal({
      recipientEmail: email,
      recipientName: candidateName,
      subject: taskName
        ? `[GEOMETRA - ARGUS] Update on: ${taskName}`
        : `[GEOMETRA - ARGUS] Candidate Follow-up: ${candidateName}`,
      body: `Dear ${candidateName},\n\nWe are reaching out regarding your progress in GEOMETRA - ARGUS${
        taskName ? ` for "${taskName}"` : ''
      }.\n\nPlease let us know if you have any questions or require support.\n\nBest regards,\nGEOMETRA - ARGUS Administration`,
      taskName,
    });
  };

  if (variant === 'icon-only') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors cursor-pointer ${className}`}
        title={`Click to email ${email}`}
      >
        <Mail className="w-3.5 h-3.5" />
      </button>
    );
  }

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg transition-colors cursor-pointer shadow-2xs ${className}`}
        title={`Click to email ${email}`}
      >
        <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
        <span>{label || 'Email'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer group underline-offset-2 hover:underline ${className}`}
      title={`Click to email ${email}`}
    >
      <Mail className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 shrink-0" />
      <span className="truncate">{label || email}</span>
    </button>
  );
};
