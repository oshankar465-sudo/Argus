import React, { useState, useEffect, useRef } from 'react';
import { useArgus } from '../context/ArgusContext';
import { Candidate, Task, Subtask, StatusType, Resource } from '../types';
import { StatusBadge } from './StatusBadge';
import { ResourceItem } from './ResourceItem';
import { NotesSection } from './NotesSection';
import { ClickToEmailButton } from './ClickToEmailButton';
import { formatDate, formatTimestamp } from '../utils/formatters';
import { generateCandidateDossierReport, generateAuditTaskReport, generateSingleTaskReport } from '../utils/pdfGenerator';
import {
  ArrowLeft,
  FileDown,
  Plus,
  Paperclip,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  ListTodo,
  History,
  FileText,
  User,
  Users,
  Mail,
  ExternalLink,
  ShieldCheck,
  MessageSquare,
  AlertCircle,
  BellRing,
  Bell,
  Database,
  RefreshCw,
  Loader2,
  LogOut,
  CheckCircle2,
} from 'lucide-react';

export const CandidateProfile: React.FC = () => {
  const {
    candidates,
    selectedCandidateId,
    setSelectedCandidateId,
    highlightedTaskId,
    setHighlightedTaskId,
    openCreateTaskModal,
    openEditTaskModal,
    openAddResourceModal,
    setCandidateToEdit,
    deleteCandidate,
    updateTaskStatus,
    deleteTask,
    addSubtask,
    updateSubtaskStatus,
    deleteSubtask,
    deleteResource,
    allTasks,
    stats,
    syncTaskToGoogleCalendar,
    syncSubtaskToGoogleCalendar,
    dispatch72HourNotification,
    stagnant72hTasks,
    candidateSession,
    loggedInCandidate,
    setIsCandidateLoginModalOpen,
    loginCandidateWithGmail,
    logoutCandidateSession,
    syncLoggedInCandidateTasks,
    verifyMainDatabaseSync,
    databaseStatus,
    dbSyncCheckResult,
  } = useArgus();

  const candidate = candidates.find((c) => c.id === selectedCandidateId);

  // View tabs inside candidate profile
  const [activeTab, setActiveTab] = useState<'tasks' | 'resources' | 'history'>('tasks');

  // Expanded task IDs
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Expanded subtask notes IDs
  const [expandedSubtaskNotesIds, setExpandedSubtaskNotesIds] = useState<Record<string, boolean>>({});

  // Subtask quick creation state per task
  const [addingSubtaskForTaskId, setAddingSubtaskForTaskId] = useState<string | null>(null);
  const [newSubtaskNameByTaskId, setNewSubtaskNameByTaskId] = useState<Record<string, string>>({});
  const [newSubtaskStatusByTaskId, setNewSubtaskStatusByTaskId] = useState<Record<string, StatusType>>({});
  const [newSubtaskStartDateByTaskId, setNewSubtaskStartDateByTaskId] = useState<Record<string, string>>({});
  const [newSubtaskDeadlineByTaskId, setNewSubtaskDeadlineByTaskId] = useState<Record<string, string>>({});
  const [newSubtaskIsCollabByTaskId, setNewSubtaskIsCollabByTaskId] = useState<Record<string, boolean>>({});
  const [newSubtaskCollabIdsByTaskId, setNewSubtaskCollabIdsByTaskId] = useState<Record<string, string[]>>({});
  const [newSubtaskErrorByTaskId, setNewSubtaskErrorByTaskId] = useState<Record<string, string>>({});

  const [isGeneratingAuditPdf, setIsGeneratingAuditPdf] = useState(false);

  // Auto-expand highlighted task if set
  const highlightedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedTaskId && candidate) {
      setExpandedTaskIds((prev) => ({ ...prev, [highlightedTaskId]: true }));
      setActiveTab('tasks');
      setTimeout(() => {
        highlightedRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [highlightedTaskId, candidate]);

  if (!candidate) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <User className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-sm font-semibold text-slate-800">Candidate Not Found</h3>
        <p className="text-xs text-slate-500 mt-1">
          The candidate profile you are trying to access does not exist or has been deleted.
        </p>
        <button
          type="button"
          onClick={() => setSelectedCandidateId(null)}
          className="mt-4 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Calculate dynamic candidate metrics
  const totalTasks = candidate.tasks.length;
  const completedTasks = candidate.tasks.filter((t) => t.status === 'Completed').length;
  const inProgressTasks = candidate.tasks.filter((t) => t.status === 'In Progress').length;
  const startedTasks = candidate.tasks.filter((t) => t.status === 'Started').length;
  const notStartedTasks = candidate.tasks.filter((t) => t.status === 'No Status').length;
  const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Aggregate all candidate-related resources for unified tab
  const allCandidateResources: Array<Resource & { locationLabel: string }> = [
    ...candidate.resources.map((r) => ({ ...r, locationLabel: 'Candidate Level' })),
  ];
  candidate.tasks.forEach((t) => {
    t.resources.forEach((r) => {
      allCandidateResources.push({ ...r, locationLabel: `Task: ${t.name}` });
    });
    t.subtasks.forEach((s) => {
      s.resources.forEach((r) => {
        allCandidateResources.push({ ...r, locationLabel: `Subtask: ${s.name} (${t.name})` });
      });
    });
  });

  const toggleTaskExpand = (taskId: string) => {
    setExpandedTaskIds((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const toggleSubtaskNotes = (subtaskId: string) => {
    setExpandedSubtaskNotesIds((prev) => ({
      ...prev,
      [subtaskId]: !prev[subtaskId],
    }));
  };

  const openSubtaskCreation = (taskId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    setAddingSubtaskForTaskId(taskId);
    setNewSubtaskNameByTaskId((prev) => ({ ...prev, [taskId]: '' }));
    setNewSubtaskStatusByTaskId((prev) => ({ ...prev, [taskId]: 'No Status' }));
    setNewSubtaskStartDateByTaskId((prev) => ({ ...prev, [taskId]: todayStr }));
    setNewSubtaskDeadlineByTaskId((prev) => ({ ...prev, [taskId]: '' }));
    setNewSubtaskIsCollabByTaskId((prev) => ({ ...prev, [taskId]: false }));
    setNewSubtaskCollabIdsByTaskId((prev) => ({ ...prev, [taskId]: [candidate.id] }));
    setNewSubtaskErrorByTaskId((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleAddSubtask = (taskId: string) => {
    const name = newSubtaskNameByTaskId[taskId]?.trim();
    const status = newSubtaskStatusByTaskId[taskId] || 'No Status';
    const startDate = newSubtaskStartDateByTaskId[taskId] || new Date().toISOString().split('T')[0];
    const deadline = newSubtaskDeadlineByTaskId[taskId]?.trim();
    const isCollab = !!newSubtaskIsCollabByTaskId[taskId];
    const collabIds = newSubtaskCollabIdsByTaskId[taskId] || [candidate.id];

    if (!name) {
      setNewSubtaskErrorByTaskId((prev) => ({ ...prev, [taskId]: 'Subtask name is required.' }));
      return;
    }
    if (!deadline) {
      setNewSubtaskErrorByTaskId((prev) => ({ ...prev, [taskId]: 'Subtask deadline is required.' }));
      return;
    }
    if (isCollab && collabIds.length < 2) {
      setNewSubtaskErrorByTaskId((prev) => ({ ...prev, [taskId]: 'Collaborative subtasks require at least 2 team members.' }));
      return;
    }

    addSubtask(candidate.id, taskId, {
      name,
      status,
      startDate,
      endDate: deadline,
      isCollaborative: isCollab,
      collaboratorIds: isCollab ? collabIds : undefined,
    });

    setAddingSubtaskForTaskId(null);
  };

  const toggleSubtaskCollaboratorSelection = (taskId: string, targetCandidateId: string) => {
    const current = newSubtaskCollabIdsByTaskId[taskId] || [candidate.id];
    let updated: string[];
    if (current.includes(targetCandidateId)) {
      updated = current.filter((id) => id !== targetCandidateId);
    } else {
      updated = [...current, targetCandidateId];
    }
    setNewSubtaskCollabIdsByTaskId((prev) => ({ ...prev, [taskId]: updated }));
    setNewSubtaskErrorByTaskId((prev) => ({ ...prev, [taskId]: '' }));
  };

  const handleDeleteCandidateConfirm = () => {
    if (window.confirm(`Are you sure you want to delete ${candidate.name}'s profile? All associated tasks, subtasks, resources, and history will be permanently deleted.`)) {
      deleteCandidate(candidate.id);
    }
  };

  const handleDownloadDossier = () => {
    generateCandidateDossierReport(candidate);
  };

  const [isSyncingTasks, setIsSyncingTasks] = useState(false);
  const [isCheckingDb, setIsCheckingDb] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const isCurrentCandidateLoggedIn = candidateSession?.candidateId === candidate.id;

  const handleCandidateSyncAll = async () => {
    try {
      setIsSyncingTasks(true);
      setSyncFeedback(null);
      const res = await syncLoggedInCandidateTasks();
      setSyncFeedback(`Successfully synchronized ${res.syncedTasks} task(s) and ${res.syncedSubtasks} subtask milestone(s) to personal Google Calendar & Google Tasks alerts.`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync operation encountered an issue.';
      setSyncFeedback(msg);
    } finally {
      setIsSyncingTasks(false);
    }
  };

  const handleVerifyDb = async () => {
    try {
      setIsCheckingDb(true);
      await verifyMainDatabaseSync();
    } finally {
      setIsCheckingDb(false);
    }
  };

  const handleDownloadAuditReport = async () => {
    try {
      setIsGeneratingAuditPdf(true);
      setTimeout(() => {
        generateAuditTaskReport(candidates, allTasks, stats);
        setIsGeneratingAuditPdf(false);
      }, 200);
    } catch (err) {
      console.error('Failed to generate audit report:', err);
      setIsGeneratingAuditPdf(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* CANDIDATE HEADER */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        {/* Back navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <button
            type="button"
            id="back-to-candidates-btn"
            onClick={() => {
              setSelectedCandidateId(null);
              setHighlightedTaskId(null);
            }}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Candidates</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            {candidate.email && (
              <ClickToEmailButton
                recipientEmail={candidate.email}
                recipientName={candidate.name}
                candidateId={candidate.id}
                variant="button"
                label="Email Candidate"
              />
            )}

            <button
              type="button"
              id="download-candidate-audit-pdf-btn"
              onClick={handleDownloadAuditReport}
              disabled={isGeneratingAuditPdf}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              title="Download full candidate audit trail report (PDF)"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>{isGeneratingAuditPdf ? 'Compiling Audit...' : 'Audit PDF'}</span>
            </button>

            <button
              type="button"
              id="download-dossier-pdf-btn"
              onClick={handleDownloadDossier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Download complete candidate dossier (PDF)"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Candidate Dossier (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => setCandidateToEdit(candidate)}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Edit candidate profile"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleDeleteCandidateConfirm}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              title="Delete candidate profile"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Candidate Identity and Progress Overview */}
        <div className="pt-5 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{candidate.name}</h1>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider ${
                  candidate.type === 'Technical'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
                }`}
              >
                {candidate.type}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
              {candidate.startDate && (
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Start Date: {formatDate(candidate.startDate)}</span>
                </div>
              )}
              {candidate.email && (
                <ClickToEmailButton
                  recipientEmail={candidate.email}
                  recipientName={candidate.name}
                  candidateId={candidate.id}
                  variant="badge"
                />
              )}
              <span>Created {formatDate(candidate.createdAt.split('T')[0])}</span>
            </div>

            {candidate.notes && (
              <p className="text-xs text-slate-600 mt-2.5 max-w-2xl bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic leading-relaxed">
                "{candidate.notes}"
              </p>
            )}
          </div>

          {/* Progress Indicator */}
          <div className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-4 min-w-[200px]">
            <div className="flex items-baseline justify-between gap-2 mb-1.5">
              <span className="text-xs font-medium text-slate-500">Overall Progress</span>
              <span className="text-xl font-bold text-slate-900 font-mono">{overallProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-slate-900 rounded-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex justify-between">
              <span>{completedTasks} completed</span>
              <span>{totalTasks} total tasks</span>
            </div>
          </div>
        </div>
      </div>

      {/* CANDIDATE GMAIL AUTH, CALENDAR & DATABASE SYNC PANEL (ALL-SCREEN RESPONSIVE) */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isCurrentCandidateLoggedIn
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
                  : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
              }`}
            >
              <Mail className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {isCurrentCandidateLoggedIn
                    ? 'Candidate Gmail Session Active'
                    : `Connect ${candidate.name}'s Gmail`}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                    isCurrentCandidateLoggedIn
                      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isCurrentCandidateLoggedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                    }`}
                  />
                  {isCurrentCandidateLoggedIn ? 'Google Workspace Synced' : 'Action Needed'}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                {isCurrentCandidateLoggedIn ? (
                  <>
                    Logged in as <strong className="text-slate-800 dark:text-slate-200">{candidateSession?.gmailEmail}</strong>. Full Google Calendar access, 72h task alerts, and Google Cloud Firestore database sync active.
                  </>
                ) : (
                  <>
                    Log in with Gmail to give this candidate direct Google Calendar event scheduling, Google Tasks real-time alerts, and verify live synchronization with the main database.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {isCurrentCandidateLoggedIn ? (
              <>
                <button
                  type="button"
                  id="candidate-sync-tasks-btn"
                  onClick={handleCandidateSyncAll}
                  disabled={isSyncingTasks}
                  className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg shadow-2xs transition-all cursor-pointer disabled:opacity-50 min-h-[40px]"
                >
                  {isSyncingTasks ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Syncing Calendar & Tasks...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sync Tasks to Calendar & Alerts</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="candidate-verify-db-btn"
                  onClick={handleVerifyDb}
                  disabled={isCheckingDb}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-2xs transition-all cursor-pointer min-h-[40px]"
                  title="Verify main database synchronization and ping latency"
                >
                  <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {isCheckingDb
                      ? 'Checking DB...'
                      : dbSyncCheckResult
                      ? `DB Synced (${dbSyncCheckResult.latencyMs}ms)`
                      : 'Check DB Sync'}
                  </span>
                </button>

                <button
                  type="button"
                  id="candidate-logout-btn"
                  onClick={logoutCandidateSession}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Sign out candidate Gmail session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                id="candidate-start-login-btn"
                onClick={() => setIsCandidateLoginModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg shadow-xs transition-all cursor-pointer min-h-[44px]"
              >
                <Mail className="w-4 h-4" />
                <span>Log In via Gmail & Take Access</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync feedback notification banner */}
        {syncFeedback && (
          <div className="mt-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncFeedback(null)}
              className="text-xs text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Real-time synchronization indicators row */}
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="truncate">
              Google Calendar: {isCurrentCandidateLoggedIn ? 'Two-Way Event Scheduling' : 'Not Connected'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="truncate">
              Google Tasks Alerts: {isCurrentCandidateLoggedIn ? '72h Inactivity Alerts Enabled' : 'Disabled'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <Database className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">
              Main DB Sync: {databaseStatus === 'connected' ? 'Firestore Live Sync' : databaseStatus}
            </span>
          </div>
        </div>
      </div>

      {/* INDIVIDUAL CANDIDATE DASHBOARD STATS */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 truncate">Total Tasks</div>
          <div className="text-lg font-bold text-slate-900 font-mono mt-1">{totalTasks}</div>
        </div>
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 truncate">Completed</div>
          <div className="text-lg font-bold text-emerald-700 font-mono mt-1">{completedTasks}</div>
        </div>
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 truncate">In Progress</div>
          <div className="text-lg font-bold text-amber-700 font-mono mt-1">{inProgressTasks}</div>
        </div>
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
          <div className="text-[11px] font-medium text-slate-500 truncate">Started</div>
          <div className="text-lg font-bold text-sky-700 font-mono mt-1">{startedTasks}</div>
        </div>
        <div className="p-3 bg-white rounded-lg border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-medium text-slate-500 truncate">Not Started</div>
          <div className="text-lg font-bold text-zinc-600 font-mono mt-1">{notStartedTasks}</div>
        </div>
      </div>

      {/* Profile Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar py-0.5">
        <button
          type="button"
          id="tab-tasks-btn"
          onClick={() => setActiveTab('tasks')}
          className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'tasks'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>Tasks & Subtasks</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-white">
            {totalTasks}
          </span>
        </button>

        <button
          type="button"
          id="tab-resources-btn"
          onClick={() => setActiveTab('resources')}
          className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'resources'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span>Resources</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
            {allCandidateResources.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-history-btn"
          onClick={() => setActiveTab('history')}
          className={`shrink-0 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Candidate History</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
            {candidate.history.length}
          </span>
        </button>
      </div>

      {/* TAB CONTENT: TASKS & SUBTASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Assigned Tasks ({totalTasks})</h3>
            <button
              type="button"
              onClick={() => openCreateTaskModal(candidate.id)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Task</span>
            </button>
          </div>

          {candidate.tasks.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
              <ListTodo className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-800">No tasks assigned yet</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Create the candidate's first task to track their interview, assignment, or review progress.
              </p>
              <button
                type="button"
                onClick={() => openCreateTaskModal(candidate.id)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create Task</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {candidate.tasks.map((task) => {
                const isExpanded = !!expandedTaskIds[task.id];
                const isHighlighted = highlightedTaskId === task.id;
                const totalSubtasks = task.subtasks.length;
                const completedSubtasks = task.subtasks.filter((s) => s.status === 'Completed').length;
                const subProgress = totalSubtasks > 0 ? `${completedSubtasks} / ${totalSubtasks} subtasks completed` : 'No subtasks';
                const taskNotesCount = task.notesList?.length || 0;

                return (
                  <div
                    key={task.id}
                    ref={isHighlighted ? highlightedRef : null}
                    className={`bg-white rounded-xl border transition-all ${
                      isHighlighted
                        ? 'border-slate-900 ring-2 ring-slate-900/15 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Task Card Header */}
                    <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div
                        onClick={() => toggleTaskExpand(task.id)}
                        className="flex-1 cursor-pointer min-w-0"
                      >
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h4 className="text-sm font-semibold text-slate-900 hover:text-slate-950 transition-colors">
                            {task.name}
                          </h4>
                          {task.isCollaborative && (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                              title="Collaborative Task"
                            >
                              <Users className="w-3 h-3" />
                              <span>
                                Collaborative Task with{' '}
                                {candidates
                                  .filter((c) => task.collaboratorIds?.includes(c.id) && c.id !== candidate.id)
                                  .map((c) => c.name)
                                  .join(', ') || 'Team'}
                              </span>
                            </span>
                          )}
                          <span className="text-[11px] text-slate-500 font-mono">
                            {totalSubtasks > 0 ? `(${completedSubtasks}/${totalSubtasks})` : ''}
                          </span>
                        </div>

                        {task.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                          <span className="text-slate-600 font-medium">{subProgress}</span>

                          {task.startDate && (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              Start: {formatDate(task.startDate)}
                            </span>
                          )}

                          {task.endDate && (
                            <span className="flex items-center gap-1 font-mono text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                              <Clock className="w-3 h-3 text-slate-500" />
                              Deadline: {formatDate(task.endDate)}
                            </span>
                          )}

                          {taskNotesCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-blue-700 font-medium bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                              <MessageSquare className="w-3 h-3 text-blue-600" />
                              {taskNotesCount} {taskNotesCount === 1 ? 'note' : 'notes'}
                            </span>
                          )}

                          {task.resources.length > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400">
                              <Paperclip className="w-3 h-3 text-slate-400" />
                              Resources: {task.resources.length}
                            </span>
                          )}

                          {/* Google Calendar Link */}
                          {task.calendarHtmlLink && (
                            <a
                              href={task.calendarHtmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800 transition-colors"
                              title="Open event in Google Calendar"
                            >
                              <Calendar className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                              <span>Google Cal</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}

                          {/* 72-Hour Inactivity Warning */}
                          {task.status !== 'Completed' &&
                            (Date.now() - new Date(task.lastStatusUpdate || task.createdAt).getTime()) >= 72 * 3600 * 1000 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dispatch72HourNotification(candidate.id, task.id);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 border border-amber-300 dark:border-amber-700 px-2 py-0.5 rounded transition-colors cursor-pointer"
                                title="No status update for 72+ hours! Click to send alert to Google Calendar & Task notification queue"
                              >
                                <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-pulse" />
                                <span>72h Inactivity</span>
                                <BellRing className="w-3 h-3 text-amber-700 dark:text-amber-300 ml-0.5" />
                              </button>
                            )}
                        </div>
                      </div>

                      {/* Status & Actions */}
                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <StatusBadge
                          status={task.status}
                          onChange={(newSt) => updateTaskStatus(candidate.id, task.id, newSt)}
                          interactive={true}
                        />

                        {/* Google Calendar Sync Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            syncTaskToGoogleCalendar(candidate.id, task.id);
                          }}
                          className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                            task.calendarEventId
                              ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                          title={task.calendarEventId ? 'Resync with Google Calendar & Tasks' : 'Add to Google Calendar & Tasks'}
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>

                        {/* Download Task Dossier PDF including candidates */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            generateSingleTaskReport(task, candidates);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 hover:text-slate-900 rounded-md transition-colors shadow-2xs cursor-pointer"
                          title="Download complete task report (PDF)"
                        >
                          <FileDown className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                          <span className="hidden sm:inline">Task PDF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditTaskModal(candidate.id, task)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title="Edit task properties"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete task "${task.name}"?`)) {
                              deleteTask(candidate.id, task.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleTaskExpand(task.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                          title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* EXPANDED CONTENT: Nested Subtasks, Resources & Notes */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/40 p-4 sm:p-5 space-y-6">
                        {/* SUBTASKS LIST */}
                        <div>
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                                Subtasks ({totalSubtasks})
                              </h5>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-600 font-mono">
                                With Deadlines & Collaboration
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => openSubtaskCreation(task.id)}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add Subtask</span>
                            </button>
                          </div>

                          {/* Inline Subtask Creation Form */}
                          {addingSubtaskForTaskId === task.id && (
                            <div className="mb-4 p-3.5 bg-white rounded-xl border border-slate-300 shadow-sm space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                                <span className="text-xs font-semibold text-slate-900">New Subtask Milestone</span>
                                <button
                                  type="button"
                                  onClick={() => setAddingSubtaskForTaskId(null)}
                                  className="text-xs text-slate-400 hover:text-slate-600"
                                >
                                  Cancel
                                </button>
                              </div>

                              {newSubtaskErrorByTaskId[task.id] && (
                                <div className="p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded flex items-center gap-1.5">
                                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span>{newSubtaskErrorByTaskId[task.id]}</span>
                                </div>
                              )}

                              <div>
                                <label className="block text-[11px] font-medium text-slate-700 mb-1">
                                  Subtask Title <span className="text-rose-500">*</span>
                                </label>
                                <input
                                  type="text"
                                  value={newSubtaskNameByTaskId[task.id] || ''}
                                  onChange={(e) =>
                                    setNewSubtaskNameByTaskId((prev) => ({
                                      ...prev,
                                      [task.id]: e.target.value,
                                    }))
                                  }
                                  placeholder="Subtask name (e.g., Run load test & review metrics)..."
                                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                                  autoFocus
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                <div>
                                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                                    Start Date
                                  </label>
                                  <input
                                    type="date"
                                    value={newSubtaskStartDateByTaskId[task.id] || ''}
                                    onChange={(e) =>
                                      setNewSubtaskStartDateByTaskId((prev) => ({
                                        ...prev,
                                        [task.id]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                                    Deadline <span className="text-rose-500">*</span>
                                  </label>
                                  <input
                                    type="date"
                                    value={newSubtaskDeadlineByTaskId[task.id] || ''}
                                    onChange={(e) =>
                                      setNewSubtaskDeadlineByTaskId((prev) => ({
                                        ...prev,
                                        [task.id]: e.target.value,
                                      }))
                                    }
                                    className="w-full px-2.5 py-1 text-xs border border-rose-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500"
                                    required
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                                    Status
                                  </label>
                                  <select
                                    value={newSubtaskStatusByTaskId[task.id] || 'No Status'}
                                    onChange={(e) =>
                                      setNewSubtaskStatusByTaskId((prev) => ({
                                        ...prev,
                                        [task.id]: e.target.value as StatusType,
                                      }))
                                    }
                                    className="w-full px-2.5 py-1 text-xs border border-slate-300 rounded-lg bg-white"
                                  >
                                    <option value="No Status">No Status</option>
                                    <option value="Started">Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Completed">Completed</option>
                                  </select>
                                </div>
                              </div>

                              {/* Collaborative Subtask Toggle (single task with collaborative subtask) */}
                              <div className="pt-2 border-t border-slate-100">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={!!newSubtaskIsCollabByTaskId[task.id]}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setNewSubtaskIsCollabByTaskId((prev) => ({
                                        ...prev,
                                        [task.id]: checked,
                                      }));
                                      if (checked && candidates.length >= 2) {
                                        setNewSubtaskCollabIdsByTaskId((prev) => ({
                                          ...prev,
                                          [task.id]: candidates.slice(0, 2).map((c) => c.id),
                                        }));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                  />
                                  <span className="text-xs font-medium text-slate-800">
                                    Collaborative Subtask (Assign multiple candidates to this subtask)
                                  </span>
                                </label>

                                {newSubtaskIsCollabByTaskId[task.id] && (
                                  <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <p className="text-[11px] text-slate-500 mb-1.5">
                                      Select team members working together on this subtask:
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                                      {candidates.map((cand) => {
                                        const selected = (newSubtaskCollabIdsByTaskId[task.id] || []).includes(cand.id);
                                        return (
                                          <label
                                            key={cand.id}
                                            className="flex items-center gap-2 p-1.5 rounded hover:bg-white cursor-pointer text-xs"
                                          >
                                            <input
                                              type="checkbox"
                                              checked={selected}
                                              onChange={() => toggleSubtaskCollaboratorSelection(task.id, cand.id)}
                                              className="rounded border-slate-300 text-slate-900"
                                            />
                                            <span className="truncate text-slate-800">{cand.name}</span>
                                            {cand.id === candidate.id && (
                                              <span className="text-[10px] text-slate-400">(Current)</span>
                                            )}
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                <button
                                  type="button"
                                  onClick={() => setAddingSubtaskForTaskId(null)}
                                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleAddSubtask(task.id)}
                                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
                                >
                                  Add Subtask
                                </button>
                              </div>
                            </div>
                          )}

                          {task.subtasks.length === 0 ? (
                            <div className="text-xs text-slate-400 bg-white p-3.5 rounded-lg border border-slate-200/80 text-center">
                              No subtasks yet. Click "Add Subtask" to track incremental milestones with deadlines and collaboration.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {task.subtasks.map((sub) => {
                                const subNotesCount = sub.notesList?.length || 0;
                                const isNotesExpanded = !!expandedSubtaskNotesIds[sub.id];

                                return (
                                  <div
                                    key={sub.id}
                                    className="bg-white rounded-lg border border-slate-200/90 p-3 shadow-2xs space-y-2"
                                  >
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <span className="font-semibold text-xs text-slate-900">
                                            {sub.name}
                                          </span>

                                          {/* Collaborative subtask indicator */}
                                          {sub.isCollaborative && (
                                            <span
                                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                                              title="Collaborative Subtask"
                                            >
                                              <Users className="w-3 h-3 text-indigo-600" />
                                              <span>
                                                Collaborative: {candidates
                                                  .filter((c) => sub.collaboratorIds?.includes(c.id))
                                                  .map((c) => c.name)
                                                  .join(', ') || 'Team'}
                                              </span>
                                            </span>
                                          )}
                                        </div>

                                        {/* Subtask Schedule Badges (Start Date & Deadline) */}
                                        <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 mt-1.5">
                                          {sub.startDate && (
                                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                              <Calendar className="w-3 h-3 text-slate-400" />
                                              Start: {formatDate(sub.startDate)}
                                            </span>
                                          )}
                                          {sub.endDate && (
                                            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 px-1.5 py-0.2 rounded text-[10px]">
                                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                              Deadline: {formatDate(sub.endDate)}
                                            </span>
                                          )}

                                          {/* Subtask Google Calendar Link */}
                                          {sub.calendarHtmlLink && (
                                            <a
                                              href={sub.calendarHtmlLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={(e) => e.stopPropagation()}
                                              className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 px-1.5 py-0.2 rounded border border-blue-200 dark:border-blue-800 transition-colors"
                                              title="Open subtask milestone event in Google Calendar"
                                            >
                                              <Calendar className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                              <span>Cal Event</span>
                                              <ExternalLink className="w-2 h-2" />
                                            </a>
                                          )}
                                        </div>

                                        {sub.description && (
                                          <p className="text-[11px] text-slate-500 mt-1">
                                            {sub.description}
                                          </p>
                                        )}

                                        {/* Subtask Resources list */}
                                        {sub.resources.length > 0 && (
                                          <div className="flex flex-wrap gap-1.5 mt-2">
                                            {sub.resources.map((res) => (
                                              <ResourceItem
                                                key={res.id}
                                                resource={res}
                                                compact={true}
                                                onDelete={() =>
                                                  deleteResource(
                                                    res.id,
                                                    'subtask',
                                                    candidate.id,
                                                    task.id,
                                                    sub.id
                                                  )
                                                }
                                              />
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Subtask Controls */}
                                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                                        <StatusBadge
                                          status={sub.status}
                                          onChange={(newSt) =>
                                            updateSubtaskStatus(candidate.id, task.id, sub.id, newSt)
                                          }
                                          interactive={true}
                                          size="sm"
                                        />

                                        {/* Subtask Google Calendar Sync Button */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            syncSubtaskToGoogleCalendar(candidate.id, task.id, sub.id);
                                          }}
                                          className={`p-1 rounded transition-colors cursor-pointer ${
                                            sub.calendarEventId
                                              ? 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800'
                                              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                          }`}
                                          title={
                                            sub.calendarEventId
                                              ? 'Milestone synced with Google Calendar. Click to update & re-alert team.'
                                              : 'Sync subtask milestone & deadline to Google Calendar with alerts'
                                          }
                                        >
                                          <Calendar className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Subtask Notes Toggle Button */}
                                        <button
                                          type="button"
                                          onClick={() => toggleSubtaskNotes(sub.id)}
                                          className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                                            subNotesCount > 0
                                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                          }`}
                                          title="View and write notes with author tracking"
                                        >
                                          <MessageSquare className="w-3 h-3" />
                                          <span>Notes ({subNotesCount})</span>
                                        </button>

                                        {/* Add subtask resource button */}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openAddResourceModal({
                                              level: 'subtask',
                                              candidateId: candidate.id,
                                              taskId: task.id,
                                              subtaskId: sub.id,
                                              targetName: sub.name,
                                            })
                                          }
                                          className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                                          title="Attach resource to this subtask"
                                        >
                                          <Paperclip className="w-3.5 h-3.5" />
                                        </button>

                                        {/* Delete subtask */}
                                        <button
                                          type="button"
                                          onClick={() => deleteSubtask(candidate.id, task.id, sub.id)}
                                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                                          title="Delete subtask"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Subtask Authored Notes (Expandable) */}
                                    {isNotesExpanded && (
                                      <div className="pt-2 border-t border-slate-100">
                                        <NotesSection
                                          candidateId={candidate.id}
                                          taskId={task.id}
                                          subtaskId={sub.id}
                                          notes={sub.notesList || []}
                                          title="Subtask Notes"
                                        />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* TASK-LEVEL NOTES WITH AUTHOR TRACKING */}
                        <div>
                          <NotesSection
                            candidateId={candidate.id}
                            taskId={task.id}
                            notes={task.notesList || []}
                            title="Task Discussion & Reviewer Notes"
                          />
                        </div>

                        {/* TASK-LEVEL RESOURCES */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                              Task Resources ({task.resources.length})
                            </h5>
                            <button
                              type="button"
                              onClick={() =>
                                openAddResourceModal({
                                  level: 'task',
                                  candidateId: candidate.id,
                                  taskId: task.id,
                                  targetName: task.name,
                                })
                              }
                              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 font-medium cursor-pointer"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>Attach Resource</span>
                            </button>
                          </div>

                          {task.resources.length === 0 ? (
                            <div className="text-xs text-slate-400 bg-white p-3 rounded-lg border border-slate-200/80 text-center">
                              No resources attached to this task. Add question rubrics, spreadsheets, or technical documentation.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {task.resources.map((res) => (
                                <ResourceItem
                                  key={res.id}
                                  resource={res}
                                  onDelete={() =>
                                    deleteResource(res.id, 'task', candidate.id, task.id)
                                  }
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* TASK HISTORY LOG */}
                        {task.history.length > 0 && (
                          <div className="pt-2 border-t border-slate-200/80">
                            <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                              Task History Audit Trail
                            </h5>
                            <div className="bg-white rounded-lg border border-slate-200 p-3 space-y-2 text-xs">
                              {task.history.map((th) => (
                                <div key={th.id} className="flex items-center justify-between gap-2 text-slate-600">
                                  <span>• {th.action}</span>
                                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                                    {formatTimestamp(th.timestamp)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: CANDIDATE & TASK RESOURCES */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Candidate Level Resources */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Candidate-Level Resources</h3>
                <p className="text-xs text-slate-500">
                  Global candidate files such as resumes, portfolios, and external profile links.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  openAddResourceModal({
                    level: 'candidate',
                    candidateId: candidate.id,
                  })
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Resource</span>
              </button>
            </div>

            {candidate.resources.length === 0 ? (
              <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Paperclip className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs font-medium text-slate-700">No candidate resources yet</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Attach a resume, portfolio, or portfolio link.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {candidate.resources.map((res) => (
                  <ResourceItem
                    key={res.id}
                    resource={res}
                    onDelete={() => deleteResource(res.id, 'candidate', candidate.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Unified Resource Hierarchy View */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              All Associated Resources ({allCandidateResources.length})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Consolidated view across candidate, task, and subtask tiers.
            </p>

            <div className="space-y-2">
              {allCandidateResources.map((res) => (
                <div
                  key={res.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-white transition-all text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-semibold text-slate-900 truncate">{res.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 uppercase font-medium">
                      {res.type}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate hidden sm:inline">
                      [{res.locationLabel}]
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(res.createdAt.split('T')[0])}
                    </span>
                    {res.type === 'link' ? (
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 text-slate-500 hover:text-slate-900"
                        title="Open external link"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: CANDIDATE HISTORY AUDIT LOG */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Candidate Activity Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Automatic chronological log of all candidate modifications, task updates, and resource changes.
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {candidate.history.length} logged events
            </span>
          </div>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {candidate.history.map((log) => (
              <div key={log.id} className="relative">
                <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-900 ring-4 ring-white" />
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <span className="font-medium text-slate-800 leading-relaxed">{log.action}</span>
                  <span className="text-[11px] text-slate-400 font-mono shrink-0">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
