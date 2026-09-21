import React, { useState, useMemo } from 'react';
import { useArgus } from '../context/ArgusContext';
import { CandidateType } from '../types';
import { ClickToEmailButton } from './ClickToEmailButton';
import {
  Users,
  Search,
  Plus,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase,
  Mail,
  ChevronRight,
  Calendar,
  Database,
  UserCheck,
} from 'lucide-react';

export const CandidatesPage: React.FC = () => {
  const {
    candidates,
    navigateToCandidateTask,
    setIsAddCandidateOpen,
    candidateSession,
    setIsCandidateLoginModalOpen,
    openCandidatePortal,
  } = useArgus();

  const [typeFilter, setTypeFilter] = useState<'All' | CandidateType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (typeFilter !== 'All' && c.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesNotes = c.notes?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesNotes) return false;
      }
      return true;
    });
  }, [candidates, typeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Candidates</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Profiles, task assignments, resources, and candidate-level dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            id="candidates-gmail-login-btn"
            onClick={() => setIsCandidateLoginModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Candidate Gmail Login</span>
          </button>

          <button
            type="button"
            id="candidates-add-btn"
            onClick={() => setIsAddCandidateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="candidate-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or email..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-blue-500"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-auto text-center">
          <button
            type="button"
            id="filter-all-candidates-btn"
            onClick={() => setTypeFilter('All')}
            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all truncate cursor-pointer ${
              typeFilter === 'All'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({candidates.length})
          </button>
          <button
            type="button"
            id="filter-tech-candidates-btn"
            onClick={() => setTypeFilter('Technical')}
            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all truncate cursor-pointer ${
              typeFilter === 'Technical'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="sm:hidden">Tech</span>
            <span className="hidden sm:inline">Technical</span> ({candidates.filter((c) => c.type === 'Technical').length})
          </button>
          <button
            type="button"
            id="filter-nontech-candidates-btn"
            onClick={() => setTypeFilter('Non-Technical')}
            className={`px-2.5 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-all truncate cursor-pointer ${
              typeFilter === 'Non-Technical'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <span className="sm:hidden">Non-Tech</span>
            <span className="hidden sm:inline">Non-Technical</span> ({candidates.filter((c) => c.type === 'Non-Technical').length})
          </button>
        </div>
      </div>

      {/* Candidates Cards Grid */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No candidates found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery ? `No candidates matched "${searchQuery}".` : 'Add your first candidate to start tracking tasks and resources.'}
          </p>
          <button
            type="button"
            onClick={() => setIsAddCandidateOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Candidate</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((cand) => {
            const totalTasks = cand.tasks.length;
            const completedTasks = cand.tasks.filter((t) => t.status === 'Completed').length;
            const activeTasks = cand.tasks.filter((t) => t.status === 'In Progress' || t.status === 'Started').length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return (
              <div
                key={cand.id}
                onClick={() => navigateToCandidateTask(cand.id)}
                className="group bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400/80 dark:hover:border-slate-700 p-5 shadow-2xs hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {cand.name}
                      </h3>
                      {cand.email ? (
                        <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                          <ClickToEmailButton
                            recipientEmail={cand.email}
                            recipientName={cand.name}
                            taskName={cand.tasks[0]?.name}
                            candidateId={cand.id}
                            variant="badge"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 mt-0.5 inline-block">No email provided</span>
                      )}
                      {cand.startDate && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 font-mono flex items-center gap-1">
                          <span>Start: {cand.startDate}</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                        cand.type === 'Technical'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {cand.type}
                    </span>
                  </div>

                  {/* Notes snippet */}
                  {cand.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 leading-relaxed italic">
                      "{cand.notes}"
                    </p>
                  )}

                  {/* Candidate Gmail & Google Sync Badge */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    {candidateSession?.candidateId === cand.id ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Gmail & Cal Alerts Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Google Sync Available</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCandidatePortal(cand.id);
                      }}
                      className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      {candidateSession?.candidateId === cand.id ? 'My Dossier' : 'View Profile'}
                    </button>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Overall Progress</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono">{progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-slate-900 dark:bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Metrics Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4 text-slate-600">
                    <div className="flex items-center gap-1" title="Total tasks assigned">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>{totalTasks} tasks</span>
                    </div>
                    <div className="flex items-center gap-1" title="Completed tasks">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{completedTasks}</span>
                    </div>
                    <div className="flex items-center gap-1" title="Active / in progress tasks">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{activeTasks}</span>
                    </div>
                  </div>

                  <div className="inline-flex items-center text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
