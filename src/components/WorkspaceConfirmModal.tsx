import React from 'react';
import { Calendar, AlertCircle, X, Check } from 'lucide-react';

interface WorkspaceConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  actionLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const WorkspaceConfirmModal: React.FC<WorkspaceConfirmModalProps> = ({
  isOpen,
  title,
  description,
  actionLabel = 'Confirm & Sync',
  isDestructive = false,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isDestructive
                  ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                  : 'bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              }`}
            >
              {isDestructive ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Calendar className="w-4 h-4" />
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <p>{description}</p>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 text-blue-800 dark:text-blue-300 flex items-start gap-2.5 text-[11px]">
            <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <span>
              This operation updates your Google Calendar and Google Tasks with permission.
            </span>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Processing...' : actionLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
