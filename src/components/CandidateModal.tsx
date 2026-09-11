import React, { useState, useEffect } from 'react';
import { useArgus } from '../context/ArgusContext';
import { CandidateType } from '../types';
import { X, UserPlus, Save, Calendar } from 'lucide-react';

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
      setError('Candidate name is required.');
      return;
    }

    if (isEditing && candidateToEdit) {
      updateCandidate(candidateToEdit.id, {
        name,
        type,
        email: email.trim() || undefined,
        startDate: startDate || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addCandidate({
        name,
        type,
        email: email.trim() || undefined,
        startDate: startDate || new Date().toISOString().split('T')[0],
        notes: notes.trim() || undefined,
      });
    }

    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-semibold">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {isEditing ? 'Edit Candidate Profile' : 'Add New Candidate'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing
                  ? 'Update candidate record details and profile notes.'
                  : 'Maintain candidate profiles and assign initial tasks.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            id="close-candidate-modal-btn"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Candidate Name */}
          <div>
            <label htmlFor="candidate-name" className="block text-xs font-medium text-slate-700 mb-1.5">
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
              placeholder="Candidate full name"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors placeholder:text-slate-400"
              autoFocus
            />
          </div>

          {/* Candidate Type */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Candidate Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="type-technical-btn"
                onClick={() => setType('Technical')}
                className={`flex items-center justify-center px-4 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                  type === 'Technical'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
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
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                Non-Technical
              </button>
            </div>
          </div>

          {/* Start Date & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="candidate-start-date" className="block text-xs font-medium text-slate-700 mb-1.5">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="candidate-start-date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors text-slate-800"
                />
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label htmlFor="candidate-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Email Address <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="email"
                id="candidate-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Notes (Optional) */}
          <div>
            <label htmlFor="candidate-notes" className="block text-xs font-medium text-slate-700 mb-1.5">
              Notes <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="candidate-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Candidate background, screening remarks, or focus areas..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-colors placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              id="cancel-candidate-btn"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-candidate-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Save Changes' : 'Create Candidate'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
