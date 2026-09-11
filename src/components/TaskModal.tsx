import React, { useState, useEffect } from 'react';
import { useArgus } from '../context/ArgusContext';
import { StatusType } from '../types';
import {
  X,
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  Users,
  User,
  AlertCircle,
  FileText,
  Clock
} from 'lucide-react';

const STATUS_OPTIONS: StatusType[] = [
  'No Status',
  'Started',
  'In Progress',
  'Completed',
];

interface InitialSubtaskItem {
  name: string;
  status: StatusType;
  startDate?: string;
  endDate: string;
  isCollaborative: boolean;
  collaboratorIds: string[];
}

export const TaskModal: React.FC = () => {
  const {
    isTaskModalOpen,
    setIsTaskModalOpen,
    taskModalData,
    candidates,
    addTask,
    updateTask,
    addSubtask,
    addNote,
  } = useArgus();

  // Task Details
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<StatusType>('No Status');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [initialNote, setInitialNote] = useState('');
  const [authorName, setAuthorName] = useState('Admin Lead');

  // Initial Subtasks (When creating)
  const [initialSubtasks, setInitialSubtasks] = useState<InitialSubtaskItem[]>([]);
  const [newSubtaskName, setNewSubtaskName] = useState('');
  const [newSubtaskStatus, setNewSubtaskStatus] = useState<StatusType>('No Status');
  const [newSubtaskStartDate, setNewSubtaskStartDate] = useState('');
  const [newSubtaskDeadline, setNewSubtaskDeadline] = useState('');
  const [newSubtaskIsCollab, setNewSubtaskIsCollab] = useState(false);
  const [newSubtaskCollabIds, setNewSubtaskCollabIds] = useState<string[]>([]);
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);

  // Assignment & Collaboration (Task Level)
  const [isCollaborative, setIsCollaborative] = useState(false);
  const [candidateId, setCandidateId] = useState('');
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([]);

  const [error, setError] = useState('');

  const isEditing = !!taskModalData?.taskToEdit;

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];

    if (taskModalData?.taskToEdit) {
      const t = taskModalData.taskToEdit;
      setName(t.name);
      setDescription(t.description || '');
      setStatus(t.status);
      setStartDate(t.startDate || t.createdAt.split('T')[0] || todayStr);
      setEndDate(t.endDate || '');
      setInitialNote('');
      setInitialSubtasks([]);

      if (t.isCollaborative && t.collaboratorIds && t.collaboratorIds.length >= 2) {
        setIsCollaborative(true);
        setCollaboratorIds(t.collaboratorIds);
        setCandidateId(t.collaboratorIds[0]);
      } else {
        setIsCollaborative(false);
        setCandidateId(taskModalData.candidateId || t.candidateId);
        setCollaboratorIds([taskModalData.candidateId || t.candidateId]);
      }
    } else {
      setName('');
      setDescription('');
      setStatus('No Status');
      setStartDate(todayStr);
      setEndDate('');
      setInitialNote('');
      setInitialSubtasks([]);
      setIsCollaborative(false);

      const defaultCandidate = taskModalData?.candidateId || (candidates.length > 0 ? candidates[0].id : '');
      setCandidateId(defaultCandidate);
      setCollaboratorIds(defaultCandidate ? [defaultCandidate] : []);
    }

    setNewSubtaskName('');
    setNewSubtaskStatus('No Status');
    setNewSubtaskStartDate(todayStr);
    setNewSubtaskDeadline('');
    setNewSubtaskIsCollab(false);
    setNewSubtaskCollabIds([]);
    setShowSubtaskForm(false);
    setError('');
  }, [taskModalData, isTaskModalOpen, candidates]);

  if (!isTaskModalOpen) return null;

  const handleClose = () => {
    setIsTaskModalOpen(false);
  };

  const handleAddSubtaskItem = () => {
    if (!newSubtaskName.trim()) {
      setError('Subtask title is required.');
      return;
    }
    if (!newSubtaskDeadline) {
      setError('All subtasks must have a deadline date.');
      return;
    }
    if (newSubtaskIsCollab && newSubtaskCollabIds.length < 2) {
      setError('Collaborative subtasks require at least 2 team members.');
      return;
    }

    setInitialSubtasks((prev) => [
      ...prev,
      {
        name: newSubtaskName.trim(),
        status: newSubtaskStatus,
        startDate: newSubtaskStartDate || new Date().toISOString().split('T')[0],
        endDate: newSubtaskDeadline,
        isCollaborative: newSubtaskIsCollab,
        collaboratorIds: newSubtaskIsCollab ? newSubtaskCollabIds : [],
      },
    ]);

    setNewSubtaskName('');
    setNewSubtaskStatus('No Status');
    setNewSubtaskDeadline('');
    setNewSubtaskIsCollab(false);
    setNewSubtaskCollabIds([]);
    setShowSubtaskForm(false);
    setError('');
  };

  const handleRemoveSubtaskItem = (index: number) => {
    setInitialSubtasks(initialSubtasks.filter((_, idx) => idx !== index));
  };

  const toggleCollaborator = (id: string) => {
    if (collaboratorIds.includes(id)) {
      setCollaboratorIds(collaboratorIds.filter((cId) => cId !== id));
    } else {
      setCollaboratorIds([...collaboratorIds, id]);
    }
    if (error) setError('');
  };

  const toggleSubtaskCollaborator = (id: string) => {
    if (newSubtaskCollabIds.includes(id)) {
      setNewSubtaskCollabIds(newSubtaskCollabIds.filter((cId) => cId !== id));
    } else {
      setNewSubtaskCollabIds([...newSubtaskCollabIds, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate Task Details
    if (!name.trim()) {
      setError('Please enter a task name.');
      return;
    }

    // Validate Assignment
    if (candidates.length === 0) {
      setError('Please add at least one candidate profile before creating tasks.');
      return;
    }

    if (isCollaborative) {
      if (collaboratorIds.length < 2) {
        setError('A collaborative task requires at least 2 candidates. Please select 2 or more people.');
        return;
      }
    } else {
      if (!candidateId) {
        setError('Please select who is getting assigned to this task.');
        return;
      }
    }

    const primaryId = isCollaborative ? collaboratorIds[0] : candidateId;

    if (isEditing && taskModalData?.taskToEdit) {
      updateTask(primaryId, taskModalData.taskToEdit.id, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        isCollaborative,
        collaboratorIds: isCollaborative ? collaboratorIds : [primaryId],
      });
    } else {
      const created = addTask(primaryId, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        startDate: startDate || new Date().toISOString().split('T')[0],
        endDate: endDate || undefined,
        isCollaborative,
        collaboratorIds: isCollaborative ? collaboratorIds : [primaryId],
      });

      // Add pre-created subtasks with deadlines, start dates, and collaborative flags
      initialSubtasks.forEach((sub) => {
        addSubtask(primaryId, created.id, {
          name: sub.name,
          status: sub.status,
          startDate: sub.startDate,
          endDate: sub.endDate,
          isCollaborative: sub.isCollaborative,
          collaboratorIds: sub.collaboratorIds,
        });
      });

      // Add initial authored note if provided
      if (initialNote.trim()) {
        addNote(
          primaryId,
          created.id,
          undefined,
          initialNote.trim(),
          authorName.trim() || 'Admin Lead',
          'Lead Reviewer'
        );
      }
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? 'Edit Task' : 'Create New Task'}
              </h2>
              <p className="text-xs text-slate-500">
                Set start date, deadline, scope, and individual or collaborative assignees.
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-task-modal-btn"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: TASK INFORMATION & DATES */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">1</span>
                <span>Task Information & Schedule</span>
              </span>
              <span className="text-[11px] text-slate-400">Step 1 of 2</span>
            </div>

            {/* Task Name */}
            <div>
              <label htmlFor="task-name" className="block text-xs font-medium text-slate-700 mb-1">
                Task Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                id="task-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. Design Architectural Elevation & System Model"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors placeholder:text-slate-400"
                autoFocus
              />
            </div>

            {/* Start Date & Deadline (All with start dates and deadlines) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="task-start-date" className="block text-xs font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="task-start-date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="task-end-date" className="block text-xs font-medium text-slate-700 mb-1">
                  Target Deadline
                </label>
                <div className="relative">
                  <input
                    type="date"
                    id="task-end-date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="task-status-select" className="block text-xs font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  id="task-status-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StatusType)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="task-desc" className="block text-xs font-medium text-slate-700 mb-1">
                Description <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="task-desc"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide instructions, rubric guidelines, or background notes..."
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors placeholder:text-slate-400 resize-none"
              />
            </div>

            {/* Initial Note with Author */}
            {!isEditing && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Initial Task Note with Author</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Your name / title"
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                      title="Author name for the note"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={initialNote}
                      onChange={(e) => setInitialNote(e.target.value)}
                      placeholder="Add an initial evaluation note or instruction..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Subtasks with Deadlines & Collaborative capability */}
            {!isEditing && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-700">
                    Subtasks ({initialSubtasks.length})
                  </label>
                  {!showSubtaskForm && (
                    <button
                      type="button"
                      onClick={() => setShowSubtaskForm(true)}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Subtask</span>
                    </button>
                  )}
                </div>

                {initialSubtasks.length > 0 && (
                  <div className="space-y-1.5 mb-2.5">
                    {initialSubtasks.map((sub, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg gap-1.5"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-slate-900">• {sub.name}</span>
                          {sub.isCollaborative && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-50 text-indigo-700 font-medium border border-indigo-200">
                              Collaborative ({sub.collaboratorIds.length} members)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 text-[11px] text-slate-500">
                          <span>Deadline: {sub.endDate}</span>
                          <span className="px-1.5 py-0.2 rounded bg-white border border-slate-200 font-medium">
                            {sub.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveSubtaskItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Remove subtask"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {showSubtaskForm && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                    <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                      <span>New Subtask Configuration</span>
                      <button
                        type="button"
                        onClick={() => setShowSubtaskForm(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs"
                      >
                        Cancel
                      </button>
                    </div>

                    <input
                      type="text"
                      value={newSubtaskName}
                      onChange={(e) => setNewSubtaskName(e.target.value)}
                      placeholder="Subtask name (e.g. Foundation structural calculation)..."
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-md bg-white"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Start Date</label>
                        <input
                          type="date"
                          value={newSubtaskStartDate}
                          onChange={(e) => setNewSubtaskStartDate(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Deadline (Required) *</label>
                        <input
                          type="date"
                          value={newSubtaskDeadline}
                          onChange={(e) => setNewSubtaskDeadline(e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-rose-300 bg-white rounded-md focus:ring-1 focus:ring-rose-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-0.5">Initial Status</label>
                        <select
                          value={newSubtaskStatus}
                          onChange={(e) => setNewSubtaskStatus(e.target.value as StatusType)}
                          className="w-full px-2 py-1 text-xs border border-slate-300 rounded-md bg-white"
                        >
                          <option value="No Status">No Status</option>
                          <option value="Started">Started</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                    </div>

                    {/* Collaborative Subtask Option */}
                    <div className="pt-1.5 border-t border-slate-200">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newSubtaskIsCollab}
                          onChange={(e) => {
                            setNewSubtaskIsCollab(e.target.checked);
                            if (e.target.checked && newSubtaskCollabIds.length === 0 && candidates.length >= 2) {
                              setNewSubtaskCollabIds(candidates.slice(0, 2).map((c) => c.id));
                            }
                          }}
                          className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                        />
                        <span className="text-xs font-medium text-slate-800">
                          Make this subtask collaborative (independent of parent task)
                        </span>
                      </label>

                      {newSubtaskIsCollab && (
                        <div className="mt-2 p-2 bg-white rounded border border-slate-200 space-y-1.5">
                          <p className="text-[11px] text-slate-500">
                            Select 2 or more candidates to collaborate on this subtask:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                            {candidates.map((cand) => (
                              <label
                                key={cand.id}
                                className="flex items-center gap-2 p-1 rounded hover:bg-slate-50 cursor-pointer text-xs"
                              >
                                <input
                                  type="checkbox"
                                  checked={newSubtaskCollabIds.includes(cand.id)}
                                  onChange={() => toggleSubtaskCollaborator(cand.id)}
                                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                                />
                                <span className="truncate text-slate-800">{cand.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={handleAddSubtaskItem}
                        className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md"
                      >
                        Confirm Subtask
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* STEP 2: TASK-LEVEL ASSIGNMENT */}
          <div className="space-y-3.5 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] flex items-center justify-center font-mono">2</span>
                <span>Task Assignment Mode</span>
              </span>
              <span className="text-[11px] text-slate-400">Step 2 of 2</span>
            </div>

            {/* Assignment Mode Toggle */}
            <div className="grid grid-cols-2 gap-2.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
              <button
                type="button"
                id="mode-individual-btn"
                onClick={() => {
                  setIsCollaborative(false);
                  if (!candidateId && candidates.length > 0) {
                    setCandidateId(candidates[0].id);
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  !isCollaborative
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Single Assignee</span>
              </button>

              <button
                type="button"
                id="mode-collaborative-btn"
                onClick={() => {
                  setIsCollaborative(true);
                  if (collaboratorIds.length < 2 && candidates.length >= 2) {
                    setCollaboratorIds(candidates.slice(0, 2).map((c) => c.id));
                  }
                }}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                  isCollaborative
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Collaborative Task</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${isCollaborative ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                  2+
                </span>
              </button>
            </div>

            {/* Single Assignee Mode */}
            {!isCollaborative && (
              <div>
                <label htmlFor="task-candidate-select" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Assigned Candidate <span className="text-rose-500">*</span>
                </label>
                <select
                  id="task-candidate-select"
                  value={candidateId}
                  onChange={(e) => {
                    setCandidateId(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                >
                  {candidates.length === 0 ? (
                    <option value="">No candidates available — add a candidate first</option>
                  ) : (
                    candidates.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.type})
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  You can keep this task single while adding collaborative subtasks with different team members.
                </p>
              </div>
            )}

            {/* Collaborative Mode */}
            {isCollaborative && (
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Select Collaborators <span className="text-rose-500">*</span> (Select 2 or more)
                </label>
                <div className="border border-slate-300 rounded-lg p-3 max-h-40 overflow-y-auto space-y-1.5 bg-slate-50/50">
                  {candidates.length < 2 ? (
                    <p className="text-xs text-amber-700 py-2 text-center">
                      Need at least 2 candidates created to form a collaborative group.
                    </p>
                  ) : (
                    candidates.map((cand) => {
                      const isSelected = collaboratorIds.includes(cand.id);
                      return (
                        <div
                          key={cand.id}
                          onClick={() => toggleCollaborator(cand.id)}
                          className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer border transition-colors ${
                            isSelected
                              ? 'bg-white border-slate-900 font-semibold text-slate-900 shadow-2xs'
                              : 'border-transparent text-slate-600 hover:bg-white/80'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                            />
                            <span>{cand.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {cand.type}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              id="cancel-task-btn"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-task-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <CheckSquare className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save Changes' : 'Create Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
