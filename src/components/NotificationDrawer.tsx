import React from 'react';
import { useArgus } from '../context/ArgusContext';
import { formatTimestamp } from '../utils/formatters';
import { X, Activity, Clock } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { recentActivities, candidates, navigateToCandidateTask } = useArgus();

  if (!isOpen) return null;

  const getCandidateName = (candId: string) => {
    const cand = candidates.find((c) => c.id === candId);
    return cand ? cand.name : 'Candidate';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-2 sm:pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900">System Activity Stream</h2>
                <p className="text-[11px] sm:text-xs text-slate-500">Live automatic activity history log</p>
              </div>
            </div>
            <button
              type="button"
              id="close-notifications-drawer-btn"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Timeline Feed */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No activity recorded yet.</p>
              </div>
            ) : (
              <div className="relative pl-6 space-y-5 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {recentActivities.map((log) => {
                  const candName = getCandidateName(log.candidateId);
                  return (
                    <div
                      key={log.id}
                      onClick={() => {
                        navigateToCandidateTask(log.candidateId, log.taskId);
                        onClose();
                      }}
                      className="relative group cursor-pointer"
                    >
                      <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-400 group-hover:bg-slate-900 ring-4 ring-white transition-colors" />
                      <div className="p-2.5 rounded-lg bg-slate-50 group-hover:bg-slate-100/80 border border-slate-200/70 transition-colors">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] font-semibold text-slate-900 truncate">
                            {candName}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatTimestamp(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed">{log.action}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 text-center">
            Click any entry to jump directly to the relevant candidate profile
          </div>
        </div>
      </div>
    </div>
  );
};
