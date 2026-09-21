import React, { useState, useRef, useEffect } from 'react';
import { useArgus } from '../context/ArgusContext';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Plus,
  Search,
  Calendar,
  Database,
  Moon,
  Sun,
  FileDown,
  X,
  UserCheck,
  ListTodo,
  ShieldCheck,
  FileText,
  Bell,
  MoreHorizontal,
  Mail,
} from 'lucide-react';
import { generateOverallReport, generateAuditTaskReport } from '../utils/pdfGenerator';

interface MobileBottomNavProps {
  onOpenNotifications: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenNotifications }) => {
  const {
    activeTab,
    setActiveTab,
    selectedCandidateId,
    setSelectedCandidateId,
    candidates,
    allTasks,
    stats,
    setIsAddCandidateOpen,
    openCreateTaskModal,
    setIsSearchOpen,
    setIsCalendarModalOpen,
    setIsDatabaseModalOpen,
    databaseStatus,
    theme,
    toggleTheme,
    isWorkspaceAuthenticated,
    stagnant72hTasks,
    recentActivities,
    candidateSession,
    loggedInCandidate,
    setIsCandidateLoginModalOpen,
    openCandidatePortal,
  } = useArgus();

  const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingAuditPdf, setIsGeneratingAuditPdf] = useState(false);

  const quickActionsRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickActionsRef.current && !quickActionsRef.current.contains(e.target as Node)) {
        setIsQuickActionsOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
    };
    if (isQuickActionsOpen || isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isQuickActionsOpen, isMoreMenuOpen]);

  const handleTabClick = (tab: 'dashboard' | 'candidates' | 'tasks') => {
    setActiveTab(tab);
    if (tab === 'dashboard' || tab === 'tasks') {
      setSelectedCandidateId(null);
    }
    setIsQuickActionsOpen(false);
    setIsMoreMenuOpen(false);
  };

  const handleDownloadOverallReport = () => {
    try {
      setIsGeneratingPdf(true);
      setIsMoreMenuOpen(false);
      setTimeout(() => {
        generateOverallReport(candidates, allTasks, stats);
        setIsGeneratingPdf(false);
      }, 200);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadAuditReport = () => {
    try {
      setIsGeneratingAuditPdf(true);
      setIsMoreMenuOpen(false);
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
    <>
      {/* Quick Actions Sheet Modal for Mobile */}
      {isQuickActionsOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            ref={quickActionsRef}
            className="w-full bg-white dark:bg-slate-900 rounded-t-2xl p-4 shadow-2xl border-t border-slate-200 dark:border-slate-800 space-y-3 pb-8 animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Quick Actions
              </span>
              <button
                type="button"
                onClick={() => setIsQuickActionsOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="mobile-quick-add-candidate-btn"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  setIsAddCandidateOpen(true);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Add Candidate</div>
                  <div className="text-[10px] text-slate-500">New profile</div>
                </div>
              </button>

              <button
                type="button"
                id="mobile-quick-create-task-btn"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  openCreateTaskModal();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-left transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Create Task</div>
                  <div className="text-[10px] text-slate-500">Assignment</div>
                </div>
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  setIsSearchOpen(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search System</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsQuickActionsOpen(false);
                  setIsCalendarModalOpen(true);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors border border-blue-200 dark:border-blue-900"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Calendar Sync</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile More Sheet */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex items-end justify-center bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            ref={moreMenuRef}
            className="w-full bg-white dark:bg-slate-900 rounded-t-2xl p-4 shadow-2xl border-t border-slate-200 dark:border-slate-800 space-y-3 pb-8 animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  System Hub & Reports
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Reports section */}
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                PDF Downloads
              </div>
              <button
                type="button"
                id="mobile-menu-audit-report-btn"
                onClick={handleDownloadAuditReport}
                disabled={isGeneratingAuditPdf}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Audit Task Report</div>
                    <div className="text-[10px] text-slate-500">Subtask statuses, history & audit trail</div>
                  </div>
                </div>
                <FileDown className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                id="mobile-menu-overall-report-btn"
                onClick={handleDownloadOverallReport}
                disabled={isGeneratingPdf}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">Executive Report</div>
                    <div className="text-[10px] text-slate-500">Portfolio summary & metrics</div>
                  </div>
                </div>
                <FileDown className="w-4 h-4 text-slate-400" />
              </button>

              {/* Integrations & Tools */}
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1 pt-2">
                Candidate & Workspace Auth
              </div>

              {/* Candidate Gmail Login Banner Button */}
              <button
                type="button"
                id="mobile-menu-candidate-portal-btn"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  if (loggedInCandidate) {
                    openCandidatePortal(loggedInCandidate.id);
                  } else {
                    setIsCandidateLoginModalOpen(true);
                  }
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-slate-800 dark:to-slate-800 border border-blue-200 dark:border-slate-700 text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {loggedInCandidate ? `Candidate: ${loggedInCandidate.name}` : 'Candidate Gmail Login'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {loggedInCandidate ? 'Google Calendar & Tasks in sync' : 'Take calendar & task alerts'}
                    </div>
                  </div>
                </div>
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    loggedInCandidate ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
                  }`}
                />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="mobile-menu-calendar-btn"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsCalendarModalOpen(true);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left"
                >
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">Google Cal</div>
                    <div className="text-[10px] text-slate-500">
                      {isWorkspaceAuthenticated ? 'Connected' : 'Setup'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  id="mobile-menu-db-btn"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    setIsDatabaseModalOpen(true);
                  }}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left"
                >
                  <Database className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">Firestore DB</div>
                    <div className="text-[10px] text-slate-500 capitalize">{databaseStatus}</div>
                  </div>
                </button>
              </div>

              {/* Theme & Notifications */}
              <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  id="mobile-menu-theme-btn"
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 transition-colors"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Light Theme</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-slate-600" />
                      <span>Dark Theme</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  id="mobile-menu-notifications-btn"
                  onClick={() => {
                    setIsMoreMenuOpen(false);
                    onOpenNotifications();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 transition-colors relative"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Activity</span>
                  {recentActivities.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar for Mobile Viewports */}
      <nav
        aria-label="Mobile Navigation"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 shadow-lg safe-area-bottom transition-colors"
      >
        <div className="flex items-center justify-around">
          {/* Dashboard Tab */}
          <button
            type="button"
            id="mobile-nav-dashboard-btn"
            onClick={() => handleTabClick('dashboard')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'dashboard' && !selectedCandidateId
                ? 'text-slate-900 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] leading-tight">Overview</span>
          </button>

          {/* Candidates Tab */}
          <button
            type="button"
            id="mobile-nav-candidates-btn"
            onClick={() => handleTabClick('candidates')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-lg transition-colors relative cursor-pointer ${
              activeTab === 'candidates' || selectedCandidateId
                ? 'text-slate-900 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <Users className="w-5 h-5 mb-0.5" />
              {candidates.length > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono">
                  {candidates.length}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight">Candidates</span>
          </button>

          {/* Center Action Button (+) */}
          <button
            type="button"
            id="mobile-nav-quick-add-btn"
            onClick={() => setIsQuickActionsOpen(!isQuickActionsOpen)}
            className="flex items-center justify-center w-11 h-11 -mt-3.5 rounded-full bg-slate-900 dark:bg-blue-600 text-white shadow-md hover:bg-slate-800 dark:hover:bg-blue-500 active:scale-95 transition-all cursor-pointer"
            aria-label="Create task or candidate"
            title="Create task or candidate"
          >
            <Plus className="w-5 h-5" />
          </button>

          {/* Tasks Tab */}
          <button
            type="button"
            id="mobile-nav-tasks-btn"
            onClick={() => handleTabClick('tasks')}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-lg transition-colors relative cursor-pointer ${
              activeTab === 'tasks' && !selectedCandidateId
                ? 'text-slate-900 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <CheckSquare className="w-5 h-5 mb-0.5" />
              {allTasks.length > 0 && (
                <span className="absolute -top-1 -right-2 text-[9px] font-bold px-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono">
                  {allTasks.length}
                </span>
              )}
            </div>
            <span className="text-[10px] leading-tight">Tasks</span>
          </button>

          {/* More Menu */}
          <button
            type="button"
            id="mobile-nav-more-btn"
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center min-w-[56px] py-1 px-1.5 rounded-lg transition-colors relative cursor-pointer ${
              isMoreMenuOpen
                ? 'text-slate-900 dark:text-blue-400 font-semibold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <div className="relative">
              <MoreHorizontal className="w-5 h-5 mb-0.5" />
              {(stagnant72hTasks.length > 0 || recentActivities.length > 0) && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </div>
            <span className="text-[10px] leading-tight">More</span>
          </button>
        </div>
      </nav>
    </>
  );
};
