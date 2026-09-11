import React, { useState } from 'react';
import { useArgus } from '../context/ArgusContext';
import {
  X,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Send,
  LogOut,
  Bell,
  ListTodo,
} from 'lucide-react';

export const GoogleCalendarModal: React.FC = () => {
  const {
    isCalendarModalOpen,
    setIsCalendarModalOpen,
    workspaceUser,
    isWorkspaceAuthenticated,
    connectGoogleWorkspace,
    disconnectGoogleWorkspace,
    syncTaskToGoogleCalendar,
    dispatch72HourNotification,
    simulate72HourInactivity,
    stagnant72hTasks,
    allTasks,
    candidates,
    autoSyncCalendar,
    setAutoSyncCalendar,
  } = useArgus();

  const [isConnecting, setIsConnecting] = useState(false);
  const [syncingTaskId, setSyncingTaskId] = useState<string | null>(null);
  const [remindingTaskId, setRemindingTaskId] = useState<string | null>(null);

  if (!isCalendarModalOpen) return null;

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await connectGoogleWorkspace();
    } catch (e) {
      console.error('Connection error:', e);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncTask = async (candidateId: string, taskId: string) => {
    setSyncingTaskId(taskId);
    try {
      await syncTaskToGoogleCalendar(candidateId, taskId);
    } finally {
      setSyncingTaskId(null);
    }
  };

  const handleDispatchReminder = async (candidateId: string, taskId: string) => {
    setRemindingTaskId(taskId);
    try {
      await dispatch72HourNotification(candidateId, taskId);
    } finally {
      setRemindingTaskId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Google Calendar & Tasks Synchronization
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Automatic project scheduling and 72-hour status inactivity monitoring
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCalendarModalOpen(false)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Connection Status Box */}
          <div
            className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isWorkspaceAuthenticated
                ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  isWorkspaceAuthenticated
                    ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                }`}
              >
                {workspaceUser?.photoURL ? (
                  <img
                    src={workspaceUser.photoURL}
                    alt="Google Avatar"
                    className="w-10 h-10 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <Calendar className="w-5 h-5" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                    {isWorkspaceAuthenticated ? 'Connected to Google Calendar' : 'Google Account Standby'}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      isWorkspaceAuthenticated
                        ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isWorkspaceAuthenticated ? 'Active' : 'Offline'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {workspaceUser?.email ||
                    'Connect your Google account to automatically schedule assignments into Calendar and Google Tasks.'}
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {isWorkspaceAuthenticated ? (
                <button
                  type="button"
                  onClick={disconnectGoogleWorkspace}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isConnecting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>{isConnecting ? 'Connecting...' : 'Sign in with Google'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Configuration / Automation Toggles */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50/50 dark:bg-slate-800/40 space-y-3">
            <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Automation Preferences</span>
            </h4>
            <div className="flex items-center justify-between gap-4 py-1">
              <div>
                <div className="font-medium text-slate-800 dark:text-slate-200">
                  Auto-create Google Calendar event upon project assignment
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Immediately schedules project milestones and deadline alarms with 72-hour reminders.
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={autoSyncCalendar}
                  onChange={(e) => setAutoSyncCalendar(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* 72-Hour Inactivity Alerts Section */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-800/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  72-Hour Stagnant Status Alerts ({stagnant72hTasks.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Requires status update every 72 hours until completed
              </span>
            </div>

            {stagnant72hTasks.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-1.5 text-emerald-500/80" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  All active assignments have updated statuses within the last 72 hours.
                </p>
                <p className="text-[11px] mt-0.5">
                  No stagnant reminders currently pending dispatch.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {stagnant72hTasks.map(({ task, candidate, hoursStagnant }) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {task.name}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                          {Math.floor(hoursStagnant)}h Unchanged
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>Candidate: {candidate?.name || 'Assigned'}</span>
                        <span>•</span>
                        <span>Status: {task.status}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDispatchReminder(candidate?.id || '', task.id)}
                        disabled={remindingTaskId === task.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
                      >
                        <Send className="w-3 h-3" />
                        <span>{remindingTaskId === task.id ? 'Sending...' : 'Send 72h Reminder'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Simulation / Testing Tool */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-600 dark:text-slate-300 space-y-2">
            <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>Developer & Verification Fast-Forward:</span>
            </div>
            <p>
              To test the 72-hour stagnant status rule without waiting 3 real days, click below to simulate 72+ hours of inactivity on any active task:
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {allTasks
                .filter((t) => t.status !== 'Completed')
                .slice(0, 3)
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => simulate72HourInactivity(t.id)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-slate-700 dark:text-slate-300"
                  >
                    Simulate 72h on "{t.name.slice(0, 18)}..."
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Events and reminders created with permission via Google Calendar API.
          </span>
          <button
            type="button"
            onClick={() => setIsCalendarModalOpen(false)}
            className="px-4 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
