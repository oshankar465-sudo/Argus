import React, { useState, useEffect } from 'react';
import { useArgus } from '../context/ArgusContext';
import { CandidateType } from '../types';
import { X, UserPlus, Save, Calendar, Mail, Bell } from 'lucide-react';

export const CandidateModal: React.FC = () => {
  const {
    isAddCandidateOpen,
    setIsAddCandidateOpen,
    candidateToEdit,
    setCandidateToEdit,
    addCandidate,
    updateCandidate,
  } = useArgus();

  const [name, setName] = useState('');
  const [type, setType] = useState<CandidateType>('Technical');
  const [email, setEmail] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const isEditing = !!candidateToEdit;

  useEffect(() => {
    if (candidateToEdit) {
      setName(candidateToEdit.name);
      setType(candidateToEdit.type);
      setEmail(candidateToEdit.email || '');
      setStartDate(candidateToEdit.startDate || candidateToEdit.createdAt.split('T')[0] || '');
      setNotes(candidateToEdit.notes || '');
    } else {
      setName('');
      setType('Technical');
      setEmail('');
      setStartDate(new Date().toISOString().split('T')[0]);
      setNotes('');
    }
    setError('');
  }, [candidateToEdit, isAddCandidateOpen]);

  if (!isAddCandidateOpen && !candidateToEdit) return null;

  const handleClose = () => {
    setIsAddCandidateOpen(false);
    setCandidateToEdit(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Candidate full name is required.');
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email address is required so calendar alerts and reminders can be delivered.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please provide a valid email address (e.g. name@company.com).');
      return;
    }

    if (isEditing && candidateToEdit) {
      updateCandidate(candidateToEdit.id, {
        name,
        type,
        email: trimmedEmail,
        startDate: startDate || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addCandidate({
        name,
        type,
        email: trimmedEmail,
        startDate: startDate || new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      });
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[94vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shrink-0 shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
                {isEditing ? 'Edit Candidate Profile' : 'Register Candidate'}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                {isEditing
                  ? 'Update candidate record, contact email, and profile notes.'
                  : 'Register a new candidate to assign tasks and route calendar alerts.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-candidate-modal-btn"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-lg">
              {error}
            </div>
          )}

          {/* Candidate Name */}
          <div>
            <label htmlFor="candidate-name" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Candidate Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="candidate-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g. Om Shankar"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 transition-colors placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Candidate Email - Mandatory for alerts */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="candidate-email" className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium inline-flex items-center gap-1">
                <Bell className="w-3 h-3" />
                Calendar & Task Alerts
              </span>
            </div>
            <div className="relative">
              <input
                type="email"
                id="candidate-email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="name@company.com"
                className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 transition-colors placeholder:text-slate-400"
                required
              />
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
              All calendar invitations, task reminders, and 72-hour inactivity alerts will be sent to this email.
            </p>
          </div>

          {/* Candidate Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Candidate Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="type-technical-btn"
                onClick={() => setType('Technical')}
                className={`flex items-center justify-center px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                  type === 'Technical'
                    ? 'border-slate-900 dark:border-blue-500 bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                Technical
              </button>
              <button
                type="button"
                id="type-nontechnical-btn"
                onClick={() => setType('Non-Technical')}
                className={`flex items-center justify-center px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                  type === 'Non-Technical'
                    ? 'border-slate-900 dark:border-blue-500 bg-slate-900 dark:bg-blue-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                }`}
              >
                Non-Technical
              </button>
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="candidate-start-date" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Start Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="candidate-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 transition-colors"
              />
              <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label htmlFor="candidate-notes" className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Notes <span className="text-slate-400 dark:text-slate-500 font-normal">(Optional)</span>
            </label>
            <textarea
              id="candidate-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Candidate background, screening remarks, or focus areas..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:focus:ring-blue-500 transition-colors placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              id="cancel-candidate-btn"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-candidate-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save Changes' : 'Register Candidate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
