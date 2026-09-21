import React, { useState } from 'react';
import { useArgus } from '../context/ArgusContext';
import { configInfo } from '../lib/firebase';
import {
  X,
  Database,
  CheckCircle2,
  ShieldCheck,
  Cloud,
  RefreshCw,
  Server,
  Activity,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';

export const GoogleDatabaseModal: React.FC = () => {
  const {
    isDatabaseModalOpen,
    setIsDatabaseModalOpen,
    databaseStatus,
    databaseMessage,
    checkDatabaseConnection,
    syncToGoogleDatabase,
    candidates,
    allTasks,
  } = useArgus();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  if (!isDatabaseModalOpen) return null;

  const handleCheckConnection = async () => {
    setIsChecking(true);
    try {
      await checkDatabaseConnection();
    } finally {
      setIsChecking(false);
    }
  };

  const handleSyncData = async () => {
    setIsSyncing(true);
    try {
      await syncToGoogleDatabase();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs shrink-0">
              <Database className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">Google Cloud Database</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">Google Firestore & Cloud Persistence</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDatabaseModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Status Box */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
              databaseStatus === 'connected'
                ? 'border-emerald-200 bg-emerald-50/60'
                : databaseStatus === 'connecting'
                ? 'border-blue-200 bg-blue-50/60'
                : databaseStatus === 'error'
                ? 'border-rose-200 bg-rose-50/60'
                : 'border-amber-200 bg-amber-50/60'
            }`}
          >
            {databaseStatus === 'connected' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : databaseStatus === 'connecting' ? (
              <RefreshCw className="w-5 h-5 text-blue-600 shrink-0 mt-0.5 animate-spin" />
            ) : databaseStatus === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <Cloud className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs min-w-0 flex-1">
              <div className="font-semibold text-slate-900 flex items-center justify-between gap-2">
                <span>Database Engine: Google Cloud Firestore</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                    databaseStatus === 'connected'
                      ? 'bg-emerald-100 text-emerald-800'
                      : databaseStatus === 'connecting'
                      ? 'bg-blue-100 text-blue-800'
                      : databaseStatus === 'error'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {databaseStatus === 'connected' ? 'Connected (Live)' : databaseStatus}
                </span>
              </div>
              <p
                className={`mt-1 text-[11px] leading-relaxed break-words ${
                  databaseStatus === 'connected'
                    ? 'text-emerald-800'
                    : databaseStatus === 'error'
                    ? 'text-rose-800'
                    : 'text-slate-600'
                }`}
              >
                {databaseMessage}
              </p>
            </div>
          </div>

          {/* Connection Configuration Details */}
          <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-2">
            <div className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Google Cloud Configuration</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 font-sans">Project ID</div>
                <div className="text-slate-800 text-[11px] truncate font-medium mt-0.5">
                  {configInfo.projectId}
                </div>
              </div>
              <div className="p-2 bg-white rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-400 font-sans">Firestore Database ID</div>
                <div className="text-slate-800 text-[11px] truncate font-medium mt-0.5" title={configInfo.databaseId}>
                  {configInfo.databaseId}
                </div>
              </div>
            </div>
          </div>

          {/* Current System Records */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
            <h3 className="text-xs font-semibold text-slate-800 mb-2.5 flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-500" />
              Active System Records
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[11px]">Candidates</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{candidates.length}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[11px]">Total Tasks</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">{allTasks.length}</div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                <div className="text-slate-500 text-[11px]">Subtasks</div>
                <div className="text-lg font-bold text-slate-900 mt-0.5">
                  {candidates.reduce((acc, c) => acc + c.tasks.reduce((tAcc, t) => tAcc + t.subtasks.length, 0), 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Database Operations */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCheckConnection}
              disabled={isChecking}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isChecking ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              onClick={handleSyncData}
              disabled={isSyncing || candidates.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg transition-colors shadow-2xs disabled:opacity-50"
            >
              <ArrowUpRight className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce text-blue-600' : 'text-blue-600'}`} />
              <span>{isSyncing ? 'Syncing...' : 'Push Local Data to Cloud'}</span>
            </button>
          </div>

          {/* Features note */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2 text-slate-800 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Trust Enterprise Persistence</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-500 pl-1 text-[11px] leading-relaxed">
              <li>Automatic background bi-directional real-time syncing via Firestore SDK.</li>
              <li>Local cache fallback prevents data loss during offline or interrupted sessions.</li>
              <li>Collaborative subtasks, author-attributed notes, and strict deadlines persisted seamlessly.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={() => setIsDatabaseModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
