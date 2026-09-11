import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useArgus } from '../context/ArgusContext';
import { Search, X, User, CheckSquare, ListCheck, Paperclip, ArrowRight } from 'lucide-react';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    candidates,
    navigateToCandidateTask,
  } = useArgus();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isSearchOpen]);

  // Handle global Cmd+K or / keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA')) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  // Aggregate and search
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        candidates: candidates.slice(0, 4),
        tasks: [],
        subtasks: [],
        resources: [],
      };
    }

    const matchedCandidates = candidates.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.email && c.email.toLowerCase().includes(q))
    );

    const matchedTasks: Array<{ taskName: string; taskId: string; candidateId: string; candidateName: string; status: string }> = [];
    const matchedSubtasks: Array<{ subName: string; subId: string; taskId: string; candidateId: string; candidateName: string; status: string }> = [];
    const matchedResources: Array<{ resName: string; resType: string; candidateId: string; taskId?: string; level: string; candidateName: string }> = [];

    candidates.forEach((c) => {
      // Candidate level resources
      c.resources.forEach((r) => {
        if (r.name.toLowerCase().includes(q)) {
          matchedResources.push({
            resName: r.name,
            resType: r.type,
            candidateId: c.id,
            level: 'Candidate',
            candidateName: c.name,
          });
        }
      });

      c.tasks.forEach((t) => {
        if (t.name.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))) {
          matchedTasks.push({
            taskName: t.name,
            taskId: t.id,
            candidateId: c.id,
            candidateName: c.name,
            status: t.status,
          });
        }

        // Task level resources
        t.resources.forEach((r) => {
          if (r.name.toLowerCase().includes(q)) {
            matchedResources.push({
              resName: r.name,
              resType: r.type,
              candidateId: c.id,
              taskId: t.id,
              level: 'Task',
              candidateName: c.name,
            });
          }
        });

        t.subtasks.forEach((s) => {
          if (s.name.toLowerCase().includes(q)) {
            matchedSubtasks.push({
              subName: s.name,
              subId: s.id,
              taskId: t.id,
              candidateId: c.id,
              candidateName: c.name,
              status: s.status,
            });
          }

          // Subtask level resources
          s.resources.forEach((r) => {
            if (r.name.toLowerCase().includes(q)) {
              matchedResources.push({
                resName: r.name,
                resType: r.type,
                candidateId: c.id,
                taskId: t.id,
                level: 'Subtask',
                candidateName: c.name,
              });
            }
          });
        });
      });
    });

    return {
      candidates: matchedCandidates,
      tasks: matchedTasks,
      subtasks: matchedSubtasks,
      resources: matchedResources,
    };
  }, [query, candidates]);

  if (!isSearchOpen) return null;

  const totalHits = results.candidates.length + results.tasks.length + results.subtasks.length + results.resources.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-200">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            id="global-search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search candidates, tasks, subtasks, or attached resources... (Esc to close)"
            className="w-full text-sm text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-400 bg-slate-100 border border-slate-200 rounded">
            ESC
          </span>
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {totalHits === 0 && query ? (
            <div className="text-center py-10">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No results found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-0.5">Try searching candidate names, task topics, or documents.</p>
            </div>
          ) : null}

          {/* Candidates */}
          {results.candidates.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Candidates ({results.candidates.length})
              </div>
              <div className="space-y-1">
                {results.candidates.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      navigateToCandidateTask(c.id);
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{c.name}</div>
                        <div className="text-xs text-slate-400">{c.type} • {c.tasks.length} tasks</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tasks */}
          {results.tasks.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Tasks ({results.tasks.length})
              </div>
              <div className="space-y-1">
                {results.tasks.map((t) => (
                  <button
                    key={t.taskId}
                    type="button"
                    onClick={() => {
                      navigateToCandidateTask(t.candidateId, t.taskId);
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <CheckSquare className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{t.taskName}</div>
                        <div className="text-xs text-slate-400">
                          Candidate: <span className="text-slate-600">{t.candidateName}</span> • {t.status}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Subtasks */}
          {results.subtasks.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Subtasks ({results.subtasks.length})
              </div>
              <div className="space-y-1">
                {results.subtasks.map((s) => (
                  <button
                    key={s.subId}
                    type="button"
                    onClick={() => {
                      navigateToCandidateTask(s.candidateId, s.taskId);
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <ListCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{s.subName}</div>
                        <div className="text-xs text-slate-400">
                          Candidate: {s.candidateName} • Status: {s.status}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resources */}
          {results.resources.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Resources ({results.resources.length})
              </div>
              <div className="space-y-1">
                {results.resources.map((r, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      navigateToCandidateTask(r.candidateId, r.taskId);
                      setIsSearchOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-slate-900 truncate">{r.resName}</div>
                        <div className="text-xs text-slate-400">
                          {r.level} level • {r.candidateName}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-right text-[11px] text-slate-400">
          Navigation: Click any result to inspect candidate workspace
        </div>
      </div>
    </div>
  );
};
