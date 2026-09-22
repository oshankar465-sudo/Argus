import React, { useState } from 'react';
import { useArgus } from '../context/ArgusContext';
import { isUnauthorizedDomainError, getCurrentDeploymentDomain } from '../lib/googleWorkspace';
import {
  Mail,
  Calendar,
  Bell,
  Database,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  UserCheck,
  LogOut,
  RefreshCw,
  ArrowRight,
  Clock,
  Download,
  Copy,
} from 'lucide-react';

export const CandidateLoginModal: React.FC = () => {
  const {
    candidates,
    candidateSession,
    loggedInCandidate,
    isCandidateLoginModalOpen,
    setIsCandidateLoginModalOpen,
    loginCandidateWithGmail,
    logoutCandidateSession,
    verifyMainDatabaseSync,
    dbSyncCheckResult,
    syncLoggedInCandidateTasks,
    databaseStatus,
    databaseMessage,
    openCandidatePortal,
  } = useArgus();

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifyingDb, setIsVerifyingDb] = useState(false);
  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncSuccessInfo, setSyncSuccessInfo] = useState<string | null>(null);

  if (!isCandidateLoginModalOpen) return null;

  const handleGmailLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setSyncSuccessInfo(null);
    try {
      const res = await loginCandidateWithGmail();
      if (res.success && res.candidate) {
        setSyncSuccessInfo(
          `Successfully authenticated ${res.candidate.name}! Google Calendar, Tasks alerts & Firestore main database are in sync.`
        );
      } else if (!res.cancelled && res.error) {
        setErrorMessage(res.error);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualDbVerification = async () => {
    setIsVerifyingDb(true);
    try {
      await verifyMainDatabaseSync();
    } finally {
      setIsVerifyingDb(false);
    }
  };

  const handleSyncTasksNow = async () => {
    setIsSyncingTasks(true);
    setErrorMessage(null);
    try {
      const res = await syncLoggedInCandidateTasks();
      setSyncSuccessInfo(
        `Synchronized ${res.syncedTasks} task(s) and ${res.syncedSubtasks} subtask milestone(s) to personal Google Calendar & Tasks!`
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Task sync failed';
      setErrorMessage(msg);
    } finally {
      setIsSyncingTasks(false);
    }
  };

  const handleSelectCandidateQuick = (candidateId: string) => {
    openCandidatePortal(candidateId);
    setIsCandidateLoginModalOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="candidate-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fadeIn"
      onClick={() => setIsCandidateLoginModalOpen(false)}
    >
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="candidate-login-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight"
              >
                Candidate Google Workspace Login
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in with Gmail • Calendar & Tasks Sync • Main Database Check
              </p>
            </div>
          </div>
          <button
            type="button"
            id="candidate-login-close-btn"
            onClick={() => setIsCandidateLoginModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-200">
          {/* Active Logged In Candidate Card */}
          {loggedInCandidate && candidateSession ? (
            <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs overflow-hidden">
                    {candidateSession.photoURL ? (
                      <img
                        src={candidateSession.photoURL}
                        alt={candidateSession.candidateName}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      candidateSession.candidateName.substring(0, 2).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {candidateSession.candidateName}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Signed In
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-mono">
                      {candidateSession.candidateEmail}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  id="candidate-logout-btn"
                  onClick={logoutCandidateSession}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-lg border border-rose-200 dark:border-rose-900 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>

              {/* Status Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-emerald-200/60 dark:border-emerald-800/40 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Calendar Access: Active</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <Bell className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Tasks & 72h Alerts: Active</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Main DB: In Sync</span>
                </div>
              </div>

              {/* Action Buttons for Logged in user */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  id="open-my-candidate-portal-btn"
                  onClick={() => {
                    openCandidatePortal(loggedInCandidate.id);
                    setIsCandidateLoginModalOpen(false);
                  }}
                  className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Enter My Candidate Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  id="sync-candidate-tasks-now-btn"
                  onClick={handleSyncTasksNow}
                  disabled={isSyncingTasks}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl shadow-2xs transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {isSyncingTasks ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>Re-Sync Calendar & Alerts</span>
                </button>
              </div>
            </div>
          ) : (
            /* Primary Gmail Sign-In Call to Action */
            <div className="text-center p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-blue-50/50 to-indigo-50/20 dark:from-slate-800/60 dark:to-slate-800/30 border border-blue-100 dark:border-slate-700/60">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto mb-3.5">
                {/* Google SVG Logo */}
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                Log In with Google Workspace
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
                Connect your candidate Gmail account to automatically grant Google Calendar and Google Tasks access, schedule real-time milestone alerts, and verify instant sync with the main Firestore database.
              </p>

              <button
                type="button"
                id="gmail-login-submit-btn"
                onClick={handleGmailLogin}
                disabled={isLoading}
                className="mt-4 w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting Gmail & Syncing...</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>Sign In with Gmail (Google Workspace)</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Success / Error Banners */}
          {syncSuccessInfo && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-semibold block">Synchronization Verified</span>
                <span>{syncSuccessInfo}</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="space-y-2">
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 flex-1">
                  <span className="font-semibold block">Authentication Notice</span>
                  <span className="leading-relaxed">{errorMessage}</span>
                </div>
              </div>

              {/* Special Guidance if domain is not authorized on Netlify / custom domain */}
              {isUnauthorizedDomainError(errorMessage) && (
                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Netlify / Deployed Domain Configuration Step</span>
                  </div>
                  <p className="leading-relaxed">
                    Firebase OAuth requires all deployed domains (such as your Netlify site) to be added to Authorized Domains for security.
                  </p>
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-amber-100/70 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 font-mono text-[11px]">
                    <span className="truncate">{getCurrentDeploymentDomain()}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(getCurrentDeploymentDomain());
                        alert(`Copied "${getCurrentDeploymentDomain()}" to clipboard!`);
                      }}
                      className="px-2 py-0.5 text-[10px] font-sans font-medium bg-amber-200 dark:bg-amber-800 hover:bg-amber-300 dark:hover:bg-amber-700 rounded transition-colors cursor-pointer shrink-0"
                    >
                      Copy Domain
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Go to <strong>Firebase Console &gt; Authentication &gt; Settings &gt; Authorized Domains</strong> and click <strong>Add Domain</strong>.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* What Happens During Login Card */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Automated Permissions & Synchronization
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Feature 1: Calendar */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold text-xs">
                  <Calendar className="w-4 h-4" />
                  <span>Calendar Access</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Automatically posts your interview dates, technical milestone deadlines, and task invites directly to Google Calendar.
                </p>
              </div>

              {/* Feature 2: Tasks & Alerts */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs">
                  <Bell className="w-4 h-4" />
                  <span>Tasks & 72h Alerts</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Creates Google Tasks entries and dispatches automatic reminders and inactivity alerts (72-hour and 24-hour milestones).
                </p>
              </div>

              {/* Feature 3: Main DB Sync */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                  <Database className="w-4 h-4" />
                  <span>Main DB Sync</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Validates live connection with Google Cloud Firestore, syncing status updates and collaborative subtasks instantly.
                </p>
              </div>
            </div>
          </div>

          {/* Main Database Sync Health Check Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Main Database (Firestore) Verification
                </span>
              </div>

              <button
                type="button"
                id="verify-db-sync-btn"
                onClick={handleManualDbVerification}
                disabled={isVerifyingDb}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
              >
                <RefreshCw className={`w-3 h-3 ${isVerifyingDb ? 'animate-spin text-blue-600' : ''}`} />
                <span>{isVerifyingDb ? 'Verifying...' : 'Check DB Sync'}</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 dark:text-slate-400">Status:</span>
                <span
                  className={`font-semibold inline-flex items-center gap-1 ${
                    databaseStatus === 'connected'
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : databaseStatus === 'connecting'
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      databaseStatus === 'connected'
                        ? 'bg-emerald-500'
                        : databaseStatus === 'connecting'
                        ? 'bg-amber-500 animate-pulse'
                        : 'bg-slate-400'
                    }`}
                  />
                  {databaseStatus === 'connected'
                    ? 'Connected & Synchronized'
                    : databaseStatus === 'connecting'
                    ? 'Checking Connection...'
                    : 'Local / Standby'}
                </span>
              </div>

              {dbSyncCheckResult?.latencyMs !== undefined && (
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <span>Latency:</span>
                  <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                    {dbSyncCheckResult.latencyMs}ms
                  </span>
                </div>
              )}

              <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <span>Candidates Synced:</span>
                <span className="font-mono font-semibold text-slate-700 dark:text-slate-200">
                  {candidates.length} records
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
              {databaseMessage}
            </p>
          </div>

          {/* Quick-Select Demo Candidates */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Candidate Access
              </span>
              <span className="text-[11px] text-slate-400">
                {candidates.length} registered candidate profile(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {candidates.map((cand) => {
                const isCurrent = loggedInCandidate?.id === cand.id;
                return (
                  <button
                    key={cand.id}
                    type="button"
                    onClick={() => handleSelectCandidateQuick(cand.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-blue-50/70 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-1 ring-blue-400'
                        : 'bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {cand.name}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {cand.email || 'No email registered'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {cand.tasks.length} tasks
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/60 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Encrypted OAuth 2.0 token transmission</span>
          </div>

          <button
            type="button"
            onClick={() => setIsCandidateLoginModalOpen(false)}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
