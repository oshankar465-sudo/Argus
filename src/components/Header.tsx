import React, { useState, useRef, useEffect } from 'react';
import { useArgus } from '../context/ArgusContext';
import { generateOverallReport, generateAuditTaskReport } from '../utils/pdfGenerator';
import { GeometraLogo } from './GeometraLogo';
import {
  Search,
  Bell,
  Plus,
  FileDown,
  LayoutDashboard,
  Users,
  CheckSquare,
  Trash2,
  User,
  ChevronDown,
  ShieldCheck,
  FileText,
  Database,
  Cloud,
  Calendar,
  Sun,
  Moon,
  AlertTriangle,
  Mail,
  UserCheck,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const {
    activeTab,
    setActiveTab,
    selectedCandidateId,
    setSelectedCandidateId,
    setIsAddCandidateOpen,
    setIsSearchOpen,
    candidates,
    allTasks,
    stats,
    clearAllData,
    recentActivities,
    setIsDatabaseModalOpen,
    databaseStatus,
    theme,
    toggleTheme,
    isWorkspaceAuthenticated,
    setIsCalendarModalOpen,
    stagnant72hTasks,
    candidateSession,
    loggedInCandidate,
    setIsCandidateLoginModalOpen,
    openCandidatePortal,
    logoutCandidateSession,
  } = useArgus();

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingAuditPdf, setIsGeneratingAuditPdf] = useState(false);
  const [isReportsMenuOpen, setIsReportsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const reportsMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (reportsMenuRef.current && !reportsMenuRef.current.contains(e.target as Node)) {
        setIsReportsMenuOpen(false);
      }
    };
    if (isUserMenuOpen || isReportsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isReportsMenuOpen]);

  const handleDownloadOverallReport = async () => {
    try {
      setIsGeneratingPdf(true);
      setIsReportsMenuOpen(false);
      setTimeout(() => {
        generateOverallReport(candidates, allTasks, stats);
        setIsGeneratingPdf(false);
      }, 200);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setIsGeneratingPdf(false);
    }
  };

  const handleDownloadAuditReport = async () => {
    try {
      setIsGeneratingAuditPdf(true);
      setIsReportsMenuOpen(false);
      setTimeout(() => {
        generateAuditTaskReport(candidates, allTasks, stats);
        setIsGeneratingAuditPdf(false);
      }, 200);
    } catch (err) {
      console.error('Failed to generate audit task report:', err);
      setIsGeneratingAuditPdf(false);
    }
  };

  const handleNavClick = (tab: 'dashboard' | 'candidates' | 'tasks') => {
    setActiveTab(tab);
    if (tab === 'dashboard' || tab === 'tasks') {
      setSelectedCandidateId(null);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-6">
            <button
              type="button"
              id="geometra-logo-btn"
              onClick={() => handleNavClick('dashboard')}
              className="flex items-center gap-3 text-left group focus:outline-none cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 transition-transform group-hover:scale-105">
                <GeometraLogo className="w-full h-full" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                  GEOMETRA - ARGUS
                </span>
                <span className="hidden lg:block text-[10px] text-slate-400 dark:text-slate-500 -mt-0.5 font-medium tracking-wide">
                  Assignment & Resource Guidance Utility System
                </span>
              </div>
            </button>

            {/* Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-5">
              <button
                type="button"
                id="nav-dashboard-btn"
                onClick={() => handleNavClick('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'dashboard' && !selectedCandidateId
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>

              <button
                type="button"
                id="nav-candidates-btn"
                onClick={() => handleNavClick('candidates')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'candidates'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Candidates</span>
                <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {candidates.length}
                </span>
              </button>

              <button
                type="button"
                id="nav-tasks-btn"
                onClick={() => handleNavClick('tasks')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeTab === 'tasks'
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Tasks</span>
                <span className="ml-0.5 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {allTasks.length}
                </span>
              </button>
            </nav>
          </div>

          {/* Search bar & Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick search trigger */}
            <button
              type="button"
              id="header-search-btn"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg transition-colors cursor-pointer w-auto sm:w-48 justify-between"
              title="Search system (⌘K)"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Search className="w-3.5 h-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline truncate">Search system...</span>
              </div>
              <kbd className="hidden sm:inline-block text-[10px] bg-white dark:bg-slate-750 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-400">
                ⌘K
              </kbd>
            </button>

            {/* Google Calendar & Tasks Sync Button */}
            <button
              type="button"
              id="header-google-calendar-btn"
              onClick={() => setIsCalendarModalOpen(true)}
              className={`inline-flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer shadow-2xs ${
                stagnant72hTasks.length > 0
                  ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100'
                  : isWorkspaceAuthenticated
                  ? 'border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
              }`}
              title="Google Calendar & Tasks Synchronization and 72h Inactivity Alerts"
            >
              <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden sm:inline">Calendar</span>
              {stagnant72hTasks.length > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                  {stagnant72hTasks.length}
                </span>
              ) : (
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isWorkspaceAuthenticated ? 'bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900' : 'bg-slate-400'
                  }`}
                />
              )}
            </button>

            {/* Google Database Button */}
            <button
              type="button"
              id="header-google-db-btn"
              onClick={() => setIsDatabaseModalOpen(true)}
              className="inline-flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-755 text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
              title={`Google Cloud Firestore: ${databaseStatus}`}
            >
              <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden sm:inline">DB</span>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  databaseStatus === 'connected'
                    ? 'bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-900'
                    : databaseStatus === 'connecting'
                    ? 'bg-blue-500 ring-2 ring-blue-100 animate-ping'
                    : databaseStatus === 'error'
                    ? 'bg-rose-500 ring-2 ring-rose-100'
                    : 'bg-amber-500 ring-2 ring-amber-100'
                }`}
              />
            </button>

            {/* Candidate Gmail Login & Portal Button */}
            <button
              type="button"
              id="header-candidate-login-btn"
              onClick={() => {
                if (loggedInCandidate) {
                  openCandidatePortal(loggedInCandidate.id);
                } else {
                  setIsCandidateLoginModalOpen(true);
                }
              }}
              className={`inline-flex items-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer shadow-2xs ${
                loggedInCandidate
                  ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
              }`}
              title={
                loggedInCandidate
                  ? `Candidate Portal: ${loggedInCandidate.name} (Signed in with Gmail)`
                  : 'Candidate Login with Gmail, Calendar & Task Alerts Sync'
              }
            >
              <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="hidden md:inline">
                {loggedInCandidate ? loggedInCandidate.name.split(' ')[0] : 'Candidate Login'}
              </span>
              <span
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  loggedInCandidate
                    ? 'bg-emerald-500 ring-2 ring-emerald-200 dark:ring-emerald-800 animate-pulse'
                    : 'bg-blue-500'
                }`}
              />
            </button>

            {/* Light / Dark Theme Toggle Button */}
            <button
              type="button"
              id="header-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            {/* Notifications Button */}
            <button
              type="button"
              id="header-notifications-btn"
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Activity log feed"
            >
              <Bell className="w-4 h-4" />
              {recentActivities.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-slate-900 dark:bg-blue-400 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            {/* Reports Dropdown Menu (Available on sm+ screens, mobile accesses via bottom nav / menu) */}
            <div className="relative hidden sm:block" ref={reportsMenuRef}>
              <button
                type="button"
                id="header-reports-dropdown-btn"
                onClick={() => setIsReportsMenuOpen(!isReportsMenuOpen)}
                disabled={isGeneratingPdf || isGeneratingAuditPdf}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg transition-all shadow-2xs hover:shadow-xs disabled:opacity-50 cursor-pointer"
                title="Download professional PDF reports"
              >
                <FileDown className={`w-3.5 h-3.5 ${isGeneratingPdf || isGeneratingAuditPdf ? 'animate-bounce' : ''}`} />
                <span>
                  {isGeneratingAuditPdf ? 'Generating...' : isGeneratingPdf ? 'Compiling...' : 'Reports'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5" />
              </button>

              {isReportsMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Select PDF Report
                    </span>
                  </div>

                  <button
                    type="button"
                    id="menu-download-audit-task-btn"
                    onClick={handleDownloadAuditReport}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-3 transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-900 dark:group-hover:bg-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <ShieldCheck className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover:text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <span>Audit Task Report</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono border border-indigo-200 dark:border-indigo-800">
                          Audit Trail
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Independent subtask statuses, multi-assignee tracking, and chronological audit logs.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    id="menu-download-overall-btn"
                    onClick={handleDownloadOverallReport}
                    className="w-full text-left px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-start gap-3 transition-colors group cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-900 dark:group-hover:bg-slate-700 group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300 group-hover:text-white" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        Overall Executive Report
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
                        Portfolio summary, progress metrics, and complete resource allocations.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Add Candidate Button */}
            <button
              type="button"
              id="header-add-candidate-btn"
              onClick={() => setIsAddCandidateOpen(true)}
              className="inline-flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-700 rounded-lg transition-all shadow-xs cursor-pointer shrink-0"
              title="Add New Candidate"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Candidate</span>
            </button>

            {/* User Profile / System Menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                id="header-user-menu-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                title="System settings & demo controls"
              >
                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <User className="w-3.5 h-3.5" />
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">GEOMETRA - ARGUS</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">oshankar465@gmail.com</p>
                  </div>

                  <div className="p-1">
                    {/* Candidate Portal / Switcher option */}
                    <button
                      type="button"
                      id="menu-candidate-login-btn"
                      onClick={() => {
                        setIsCandidateLoginModalOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Candidate Gmail Login</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono">
                        {loggedInCandidate ? 'Connected' : 'OAuth'}
                      </span>
                    </button>

                    {loggedInCandidate && (
                      <button
                        type="button"
                        id="menu-my-candidate-dossier-btn"
                        onClick={() => {
                          openCandidatePortal(loggedInCandidate.id);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span className="truncate">My Dossier ({loggedInCandidate.name.split(' ')[0]})</span>
                        </div>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 font-mono">
                          Portal
                        </span>
                      </button>
                    )}

                    <button
                      type="button"
                      id="menu-open-calendar-btn"
                      onClick={() => {
                        setIsCalendarModalOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Google Calendar & Tasks</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono">
                        {isWorkspaceAuthenticated ? 'Active' : 'Setup'}
                      </span>
                    </button>

                    <button
                      type="button"
                      id="menu-open-google-db-btn"
                      onClick={() => {
                        setIsDatabaseModalOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Google Database</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono">
                        Ready
                      </span>
                    </button>

                    <button
                      type="button"
                      id="clear-all-data-btn"
                      onClick={() => {
                        clearAllData();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-left transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>Clear All Data</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

