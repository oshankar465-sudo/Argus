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
  ChevronRight
} from 'lucide-react';

export const CandidatesPage: React.FC = () => {
  const {
    candidates,
    navigateToCandidateTask,
    setIsAddCandidateOpen,
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

        <button
          type="button"
          id="candidates-add-btn"
          onClick={() => setIsAddCandidateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Candidate</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            id="candidate-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate name or email..."
            className="w-full pl-8.5 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-stretch sm:self-auto justify-center">
          <button
            type="button"
            id="filter-all-candidates-btn"
            onClick={() => setTypeFilter('All')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              typeFilter === 'All'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({candidates.length})
          </button>
          <button
            type="button"
            id="filter-tech-candidates-btn"
            onClick={() => setTypeFilter('Technical')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              typeFilter === 'Technical'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Technical ({candidates.filter((c) => c.type === 'Technical').length})
          </button>
          <button
            type="button"
            id="filter-nontech-candidates-btn"
            onClick={() => setTypeFilter('Non-Technical')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
              typeFilter === 'Non-Technical'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Non-Technical ({candidates.filter((c) => c.type === 'Non-Technical').length})
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
