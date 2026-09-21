import React, { useState, useEffect } from 'react';
import { useArgus } from '../context/ArgusContext';
import {
  X,
  Mail,
  ExternalLink,
  Copy,
  Check,
  Send,
  Sparkles,
  Clock,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

export const EmailModal: React.FC = () => {
  const { isEmailModalOpen, setIsEmailModalOpen, emailModalData } = useArgus();

  const [toEmail, setToEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (emailModalData) {
      setToEmail(emailModalData.recipientEmail || '');
      setRecipientName(emailModalData.recipientName || 'Candidate');
      setSubject(emailModalData.subject || '[GEOMETRA - ARGUS] Project Update');
      setBody(emailModalData.body || '');
    }
  }, [emailModalData]);

  if (!isEmailModalOpen || !emailModalData) return null;

  const handleTemplateSelect = (templateType: '72h' | 'assigned' | 'deadline' | 'status') => {
    const taskName = emailModalData.taskName || 'Assigned Project';
    const name = recipientName || 'Candidate';

    if (templateType === '72h') {
      setSubject(`[GEOMETRA - ARGUS] 72-Hour Status Reminder: ${taskName}`);
      setBody(
        `Dear ${name},\n\nThis is an automated 72-hour reminder regarding your assignment "${taskName}".\n\nOur system detected that the assignment status has not been updated in over 72 hours. To maintain continuous progress tracking in GEOMETRA - ARGUS, please review your progress and update the status accordingly.\n\nIf you have encountered any roadblocks or require additional resources, please let us know immediately.\n\nBest regards,\nGEOMETRA - ARGUS Project Administration`
      );
    } else if (templateType === 'assigned') {
      setSubject(`[GEOMETRA - ARGUS] New Assignment: ${taskName}`);
      setBody(
        `Dear ${name},\n\nYou have been officially assigned to "${taskName}" in the GEOMETRA - ARGUS tracking system.\n\nPlease log in to view project milestones, deadline schedules, and associated technical resources.\n\nBest regards,\nGEOMETRA - ARGUS Administration`
      );
    } else if (templateType === 'deadline') {
      setSubject(`[GEOMETRA - ARGUS] Upcoming Deadline: ${taskName}`);
      setBody(
        `Dear ${name},\n\nThis is a notification regarding the upcoming deadline for "${taskName}". Please ensure all deliverables and subtasks are marked as Completed before the deadline.\n\nBest regards,\nGEOMETRA - ARGUS Administration`
      );
    } else {
      setSubject(`[GEOMETRA - ARGUS] Status Check: ${taskName}`);
      setBody(
        `Dear ${name},\n\nCould you please provide a brief update on your current progress for "${taskName}"?\n\nThank you,\nGEOMETRA - ARGUS Administration`
      );
    }
  };

  const handleOpenMailto = () => {
    const mailtoUrl = `mailto:${encodeURIComponent(toEmail)}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  const handleOpenGmail = () => {
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      toEmail
    )}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
  };

  const handleCopy = async () => {
    const textToCopy = `To: ${toEmail}\nSubject: ${subject}\n\n${body}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Click-to-Email Dispatcher
              </h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                Compose or dispatch pre-configured emails to candidates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 text-xs">
          {/* Quick Template Selector */}
          <div>
            <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Quick Templates:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleTemplateSelect('72h')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>72h Stagnant</span>
              </button>
              <button
                type="button"
                onClick={() => handleTemplateSelect('assigned')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
              >
                <Calendar className="w-3 h-3" />
                <span>Assignment</span>
              </button>
              <button
                type="button"
                onClick={() => handleTemplateSelect('deadline')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
              >
                <Clock className="w-3 h-3" />
                <span>Deadline</span>
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Recipient Email
              </label>
              <input
                type="email"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                placeholder="candidate@example.com"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Message Body
              </label>
              <textarea
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none font-sans leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-3.5 sm:px-6 sm:py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied!' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenGmail}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Open draft directly in Gmail Web"
            >
              <ExternalLink className="w-3.5 h-3.5 text-red-500" />
              <span>Gmail Web</span>
            </button>

            <button
              type="button"
              onClick={handleOpenMailto}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Email</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
