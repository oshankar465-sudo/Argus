import React, { useState, useMemo } from 'react';
import { useArgus } from '../context/ArgusContext';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../utils/formatters';
import { StatusType, CandidateType } from '../types';
import { generateAuditTaskReport, generateSingleTaskReport } from '../utils/pdfGenerator';
import {
  CheckCircle2,
  Clock,
  CircleDashed,
  ListTodo,
  ArrowUpDown,
  Filter,
  Search,
  Plus,
  Paperclip,
  ChevronRight,
  UserCheck,
  Users,
  ShieldCheck,
  FileDown,
  AlertTriangle,
  Calendar
} from 'lucide-react';

export const GlobalDashboard: React.FC = () => {
  const {
    candidates,
    allTasks,
    stats,
    navigateToCandidateTask,
    openCreateTaskModal,
    setIsAddCandidateOpen,
    stagnant72hTasks,
    setIsCalendarModalOpen,
  } = useArgus();

  // Filters & Sorting state
  const [isGeneratingAuditPdf, setIsGeneratingAuditPdf] = useState(false);
  const [selectedCardFilter, setSelectedCardFilter] = useState<'All' | 'Completed' | 'In Progress' | 'Not Started'>('All');
  const [candidateTypeFilter, setCandidateTypeFilter] = useState<'All' | CandidateType>('All');
  const [statusDropdownFilter, setStatusDropdownFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'endDate' | 'candidate' | 'status' | 'name'>('endDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // Handle card click
  const handleCardClick = (cardType: 'All' | 'Completed' | 'In Progress' | 'Not Started') => {
    if (selectedCardFilter === cardType) {
      setSelectedCardFilter('All');
    } else {
      setSelectedCardFilter(cardType);
    }
  };

  // Filtered and sorted tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      // Card filter
      if (selectedCardFilter === 'Completed' && t.status !== 'Completed') return false;
      if (selectedCardFilter === 'In Progress' && t.status !== 'In Progress') return false;
      if (selectedCardFilter === 'Not Started' && t.status !== 'No Status') return false;

      // Status dropdown filter
      if (statusDropdownFilter !== 'All' && t.status !== statusDropdownFilter) return false;

      // Candidate type filter
      if (candidateTypeFilter !== 'All' && t.candidateType !== candidateTypeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = t.name.toLowerCase().includes(q);
        const matchesCand = t.candidateName.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesCand && !matchesDesc) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortField === 'endDate') {
        if (!a.endDate) return sortOrder === 'asc' ? 1 : -1;
        if (!b.endDate) return sortOrder === 'asc' ? -1 : 1;
        const comp = a.endDate.localeCompare(b.endDate);
        return sortOrder === 'asc' ? comp : -comp;
      }
      if (sortField === 'candidate') {
        const comp = a.candidateName.localeCompare(b.candidateName);
        return sortOrder === 'asc' ? comp : -comp;
      }
      if (sortField === 'status') {
        const comp = a.status.localeCompare(b.status);
        return sortOrder === 'asc' ? comp : -comp;
      }
      if (sortField === 'name') {
        const comp = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? comp : -comp;
      }
      return 0;
    });
  }, [allTasks, selectedCardFilter, statusDropdownFilter, candidateTypeFilter, searchQuery, sortField, sortOrder]);

  const toggleSort = (field: 'endDate' | 'candidate' | 'status' | 'name') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearAllFilters = () => {
    setSelectedCardFilter('All');
    setCandidateTypeFilter('All');
    setStatusDropdownFilter('All');
    setSearchQuery('');
  };

  const hasActiveFilters = selectedCardFilter !== 'All' || candidateTypeFilter !== 'All' || statusDropdownFilter !== 'All' || searchQuery !== '';

  return (
    <div className="space-y-7">
      {/* Overview Greeting & Scope Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active tracking across all {candidates.length} candidate portfolios and {stats.totalTasks} tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="dashboard-audit-report-btn"
            onClick={handleDownloadAuditReport}
            disabled={isGeneratingAuditPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            title="Download comprehensive task and subtask audit report"
          >
            <ShieldCheck className={`w-3.5 h-3.5 text-slate-700 ${isGeneratingAuditPdf ? 'animate-bounce' : ''}`} />
            <span>{isGeneratingAuditPdf ? 'Compiling Audit...' : 'Audit Task Report (PDF)'}</span>
          </button>
          <button
            type="button"
            id="quick-add-task-btn"
            onClick={() => openCreateTaskModal()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Task</span>
          </button>
          <button
            type="button"
            id="quick-add-cand-btn"
            onClick={() => setIsAddCandidateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* 72-Hour Inactivity Notification Alert Banner */}
      {stagnant72hTasks.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                  72-Hour Inactivity Alerts Active
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100">
                  {stagnant72hTasks.length} {stagnant72hTasks.length === 1 ? 'task' : 'tasks'}
                </span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300/90 mt-0.5">
                Tasks without status changes for 72+ hours dispatch recurring reminders to Google Calendar & Google Tasks until marked Completed.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setIsCalendarModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-100 bg-amber-200/70 dark:bg-amber-800/70 hover:bg-amber-300/80 rounded-lg transition-colors cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Review Reminders</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 5: EXACT FOUR SUMMARY CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Tasks */}
        <div
          onClick={() => handleCardClick('All')}
          id="summary-card-total"
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer select-none ${
            selectedCardFilter === 'All'
              ? 'bg-white dark:bg-slate-850 border-slate-900 dark:border-blue-500 ring-2 ring-slate-900/10 dark:ring-blue-500/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Tasks</span>
            <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <ListTodo className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
              {stats.totalTasks}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">all active</span>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div
          onClick={() => handleCardClick('Completed')}
          id="summary-card-completed"
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer select-none ${
            selectedCardFilter === 'Completed'
              ? 'bg-emerald-50/40 dark:bg-emerald-950/30 border-emerald-600 dark:border-emerald-500 ring-2 ring-emerald-600/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-900 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Completed</span>
            <div className="w-6 h-6 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400 font-mono">
              {stats.completedTasks}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
              {stats.totalTasks > 0 ? `${Math.round((stats.completedTasks / stats.totalTasks) * 100)}% rate` : '0%'}
            </span>
          </div>
        </div>

        {/* Card 3: In Progress */}
        <div
          onClick={() => handleCardClick('In Progress')}
          id="summary-card-inprogress"
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer select-none ${
            selectedCardFilter === 'In Progress'
              ? 'bg-amber-50/40 dark:bg-amber-950/30 border-amber-600 dark:border-amber-500 ring-2 ring-amber-600/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">In Progress</span>
            <div className="w-6 h-6 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-amber-700 dark:text-amber-400 font-mono">
              {stats.inProgressTasks}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">pipeline</span>
          </div>
        </div>

        {/* Card 4: Not Started */}
        <div
          onClick={() => handleCardClick('Not Started')}
          id="summary-card-notstarted"
          className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer select-none ${
            selectedCardFilter === 'Not Started'
              ? 'bg-zinc-100 dark:bg-slate-800 border-zinc-500 dark:border-slate-400 ring-2 ring-zinc-500/20 shadow-xs'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50/50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Not Started</span>
            <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-300 flex items-center justify-center">
              <CircleDashed className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 sm:mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-700 dark:text-zinc-300 font-mono">
              {stats.notStartedTasks}
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">pending</span>
          </div>
        </div>
      </div>

      {/* SECTION 6: GLOBAL TASK LIST */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Table Controls Header */}
        <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Global Tasks</h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({filteredTasks.length}/{allTasks.length})
              </span>
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Reset
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Table Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                id="task-table-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex gap-2">
              {/* Candidate Type Filter */}
              <select
                id="dashboard-type-filter"
                value={candidateTypeFilter}
                onChange={(e) => setCandidateTypeFilter(e.target.value as any)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="All">All Types</option>
                <option value="Technical">Technical</option>
                <option value="Non-Technical">Non-Technical</option>
              </select>

              {/* Status Filter */}
              <select
                id="dashboard-status-filter"
                value={statusDropdownFilter}
                onChange={(e) => setStatusDropdownFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
              >
                <option value="All">All Statuses</option>
                <option value="No Status">No Status</option>
                <option value="Started">Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mobile Task Cards List (< md viewports) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTasks.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400">
              <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {candidates.length === 0 ? 'No candidates or tasks registered yet' : 'No tasks match the filter criteria.'}
              </p>
              {candidates.length === 0 && (
                <button
                  type="button"
                  onClick={() => setIsAddCandidateOpen(true)}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-blue-600 rounded-lg shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Candidate</span>
                </button>
              )}
            </div>
          ) : (
            filteredTasks.map((t) => {
              const completedSubtasks = t.subtasks.filter((s) => s.status === 'Completed').length;
              const totalSubtasks = t.subtasks.length;
              const totalResources = t.resources.length;

              return (
                <div
                  key={`mobile-${t.id}`}
                  onClick={() => navigateToCandidateTask(t.candidateId, t.id)}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer space-y-2.5"
                >
                  {/* Top Row: Task Name, Collab, Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 line-clamp-1">
                          {t.name}
                        </span>
                        {t.isCollaborative && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Users className="w-2.5 h-2.5" />
                            <span>Collab</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                          {t.candidateName}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                          {t.candidateType}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <StatusBadge status={t.status} size="sm" />
                    </div>
                  </div>

                  {/* Middle Row: Progress and Resources */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-3">
                      {/* Subtasks */}
                      {totalSubtasks > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-slate-700 dark:bg-blue-500 rounded-full"
                              style={{ width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono">{completedSubtasks}/{totalSubtasks} subtasks</span>
                        </div>
                      ) : (
                        <span className="text-[10px]">No subtasks</span>
                      )}

                      {/* Resources */}
                      {totalResources > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>{totalResources}</span>
                        </span>
                      )}
                    </div>

                    {/* Deadline and Action */}
                    <div className="flex items-center gap-2">
                      {t.endDate && (
                        <span className="text-[10px] font-mono text-slate-600 dark:text-slate-400">
                          Due {formatDate(t.endDate)}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateSingleTaskReport(t, candidates);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
                        title="Download Task PDF"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Global Task Table (Desktop md: and above) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th
                  onClick={() => toggleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Task</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('candidate')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Candidate</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Type</th>
                <th
                  onClick={() => toggleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('endDate')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>End Date</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Subtasks</th>
                <th className="py-3 px-4">Resources</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <ListTodo className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-slate-700">
                      {candidates.length === 0 ? 'No candidates or tasks registered yet' : 'No tasks match the filter criteria.'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {candidates.length === 0
                        ? 'Get started by adding your first candidate profile.'
                        : 'Adjust your filters or create a new task to track progress.'}
                    </p>
                    {candidates.length === 0 && (
                      <button
                        type="button"
                        onClick={() => setIsAddCandidateOpen(true)}
                        className="mt-3.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Candidate</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const completedSubtasks = t.subtasks.filter((s) => s.status === 'Completed').length;
                  const totalSubtasks = t.subtasks.length;
                  const totalResources = t.resources.length;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => navigateToCandidateTask(t.candidateId, t.id)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      title="Click to open individual candidate profile"
                    >
                      {/* Task Name */}
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="group-hover:text-slate-950 font-semibold">{t.name}</span>
                          {t.isCollaborative && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200"
                              title="Collaborative Task"
                            >
                              <Users className="w-3 h-3" />
                              <span>Collaborative</span>
                            </span>
                          )}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {t.description}
                          </div>
                        )}
                      </td>

                      {/* Candidate */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <span className="hover:underline text-slate-900">{t.candidateName}</span>
                      </td>

                      {/* Candidate Type */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                            t.candidateType === 'Technical'
                              ? 'bg-slate-100 text-slate-800 border border-slate-200'
                              : 'bg-zinc-100 text-zinc-700 border border-zinc-200'
                          }`}
                        >
                          {t.candidateType}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} size="sm" />
                      </td>

                      {/* End Date */}
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {formatDate(t.endDate)}
                      </td>

                      {/* Subtask Progress */}
                      <td className="py-3.5 px-4">
                        {totalSubtasks > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-slate-700 rounded-full"
                                style={{
                                  width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {completedSubtasks}/{totalSubtasks}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Resources */}
                      <td className="py-3.5 px-4">
                        {totalResources > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Paperclip className="w-3 h-3" />
                            <span>{totalResources}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>

                      {/* Action Arrow & PDF */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              generateSingleTaskReport(t, candidates);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded transition-colors"
                            title="Download complete task report with candidates (PDF)"
                          >
                            <FileDown className="w-3 h-3 text-slate-500" />
                            <span className="hidden sm:inline">PDF</span>
                          </button>
                          <div className="inline-flex items-center text-slate-400 group-hover:text-slate-800 transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-50/60 border-t border-slate-200 text-slate-500 text-[11px] flex items-center justify-between">
          <span>Clicking any task opens the candidate profile and reveals nested subtasks and resources.</span>
          <span className="font-mono">Sorted by {sortField} ({sortOrder})</span>
        </div>
      </div>
    </div>
  );
};
