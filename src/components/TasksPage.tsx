import React, { useState, useMemo } from 'react';
import { useArgus } from '../context/ArgusContext';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '../utils/formatters';
import { StatusType, CandidateType } from '../types';
import { generateAuditTaskReport, generateSingleTaskReport } from '../utils/pdfGenerator';
import {
  CheckSquare,
  Search,
  Plus,
  ArrowUpDown,
  Paperclip,
  ChevronRight,
  Filter,
  Users,
  ShieldCheck,
  FileDown,
  AlertCircle,
  Calendar,
  ExternalLink
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const {
    candidates,
    allTasks,
    stats,
    navigateToCandidateTask,
    openCreateTaskModal,
  } = useArgus();

  const [isGeneratingAuditPdf, setIsGeneratingAuditPdf] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | CandidateType>('All');
  const [candidateFilter, setCandidateFilter] = useState<string>('All');
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

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (typeFilter !== 'All' && t.candidateType !== typeFilter) return false;
      if (candidateFilter !== 'All' && t.candidateId !== candidateFilter) return false;

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
  }, [allTasks, statusFilter, typeFilter, candidateFilter, searchQuery, sortField, sortOrder]);

  const toggleSort = (field: 'endDate' | 'candidate' | 'status' | 'name') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setStatusFilter('All');
    setTypeFilter('All');
    setCandidateFilter('All');
    setSearchQuery('');
  };

  const hasActiveFilters = statusFilter !== 'All' || typeFilter !== 'All' || candidateFilter !== 'All' || searchQuery !== '';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">All Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized registry across all candidate pipelines.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            id="tasks-page-download-audit-btn"
            onClick={handleDownloadAuditReport}
            disabled={isGeneratingAuditPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors disabled:opacity-50"
            title="Download full task and subtask audit report with independent status tracking and history"
          >
            <ShieldCheck className={`w-3.5 h-3.5 text-slate-700 ${isGeneratingAuditPdf ? 'animate-bounce' : ''}`} />
            <span>{isGeneratingAuditPdf ? 'Generating Audit PDF...' : 'Download Task Audit Report'}</span>
          </button>

          <button
            type="button"
            id="tasks-page-create-btn"
            onClick={() => openCreateTaskModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="tasks-page-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search task names, descriptions, or candidates..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Filter Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full md:w-auto">
            {/* Candidate Filter */}
            <select
              id="tasks-page-candidate-filter"
              value={candidateFilter}
              onChange={(e) => setCandidateFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="All">All Candidates</option>
              {candidates.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Type Filter */}
            <select
              id="tasks-page-type-filter"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="All">All Types</option>
              <option value="Technical">Technical</option>
              <option value="Non-Technical">Non-Technical</option>
            </select>

            {/* Status Filter */}
            <select
              id="tasks-page-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-900"
            >
              <option value="All">All Statuses</option>
              <option value="No Status">No Status</option>
              <option value="Started">Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="self-end md:self-auto px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Task Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Mobile Task Cards List (< md screens) */}
        <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTasks.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-400">
              <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No tasks matched your filter criteria.
              </p>
            </div>
          ) : (
            filteredTasks.map((t) => {
              const completedSubs = t.subtasks.filter((s) => s.status === 'Completed').length;
              const totalSubs = t.subtasks.length;
              const resCount = t.resources.length;
              const isStagnant =
                t.status !== 'Completed' &&
                (Date.now() - new Date(t.lastStatusUpdate || t.createdAt).getTime()) >= 72 * 3600 * 1000;

              return (
                <div
                  key={`m-task-${t.id}`}
                  onClick={() => navigateToCandidateTask(t.candidateId, t.id)}
                  className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer space-y-2.5"
                >
                  {/* Top: Title, Tags & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {t.name}
                        </span>
                        {t.isCollaborative && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Users className="w-2.5 h-2.5" />
                            <span>Collab</span>
                          </span>
                        )}
                        {isStagnant && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                            <AlertCircle className="w-2.5 h-2.5 text-amber-600 animate-pulse" />
                            <span>72h</span>
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

                  {/* Progress & Meta Bar */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <div className="flex items-center gap-3">
                      {totalSubs > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-slate-700 dark:bg-blue-500 rounded-full"
                              style={{ width: `${Math.round((completedSubs / totalSubs) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono">{completedSubs}/{totalSubs}</span>
                        </div>
                      ) : (
                        <span className="text-[10px]">No subtasks</span>
                      )}

                      {resCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>{resCount}</span>
                        </span>
                      )}
                    </div>

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

        {/* Desktop Task Table (md: and above) */}
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
                <th className="py-3 px-4">Subtask Progress</th>
                <th className="py-3 px-4">Resources</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium text-slate-700">No tasks matched your filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredTasks.map((t) => {
                  const completedSubs = t.subtasks.filter((s) => s.status === 'Completed').length;
                  const totalSubs = t.subtasks.length;
                  const resCount = t.resources.length;

                  return (
                    <tr
                      key={t.id}
                      onClick={() => navigateToCandidateTask(t.candidateId, t.id)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                      title="Click to open candidate workspace"
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="group-hover:text-blue-600 dark:group-hover:text-blue-400 font-semibold">{t.name}</span>
                          {t.isCollaborative && (
                            <span
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                              title="Collaborative Task"
                            >
                              <Users className="w-3 h-3" />
                              <span>Collaborative</span>
                            </span>
                          )}

                          {/* 72h Stagnant Inactivity Badge */}
                          {t.status !== 'Completed' &&
                            (Date.now() - new Date(t.lastStatusUpdate || t.createdAt).getTime()) >= 72 * 3600 * 1000 && (
                              <span
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                                title="Task has had no status change for 72+ hours! Google Calendar & Task reminders active"
                              >
                                <AlertCircle className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-pulse" />
                                <span>72h Inactivity</span>
                              </span>
                            )}

                          {/* Google Calendar Link */}
                          {t.calendarHtmlLink && (
                            <a
                              href={t.calendarHtmlLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
                              title="View event in Google Calendar"
                            >
                              <Calendar className="w-2.5 h-2.5" />
                              <span>Calendar</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                        {t.description && (
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-sm mt-0.5">
                            {t.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <span className="hover:underline">{t.candidateName}</span>
                      </td>
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
                      <td className="py-3.5 px-4">
                        <StatusBadge status={t.status} size="sm" />
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {formatDate(t.endDate)}
                      </td>
                      <td className="py-3.5 px-4">
                        {totalSubs > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full bg-slate-700 rounded-full"
                                style={{ width: `${Math.round((completedSubs / totalSubs) * 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {completedSubs}/{totalSubs}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {resCount > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Paperclip className="w-3 h-3" />
                            <span>{resCount}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">—</span>
                        )}
                      </td>
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
      </div>
    </div>
  );
};
