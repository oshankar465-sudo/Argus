import React, { useState } from 'react';
import { Note } from '../types';
import { formatTimestamp } from '../utils/formatters';
import { MessageSquare, Send, Trash2, User, Clock, Shield } from 'lucide-react';

interface NotesSectionProps {
  notes?: Note[];
  onAddNote: (note: { content: string; authorName: string; authorRole?: string }) => void;
  onDeleteNote?: (noteId: string) => void;
  title?: string;
  itemType?: 'task' | 'subtask';
}

export const NotesSection: React.FC<NotesSectionProps> = ({
  notes = [],
  onAddNote,
  onDeleteNote,
  title = 'Notes & Comments',
  itemType = 'task',
}) => {
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState(() => {
    return localStorage.getItem('geometra_current_user_name') || 'Lead Assessor';
  });
  const [authorRole, setAuthorRole] = useState(() => {
    return localStorage.getItem('geometra_current_user_role') || 'Admin';
  });
  const [isExpanded, setIsExpanded] = useState(notes.length > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    localStorage.setItem('geometra_current_user_name', authorName.trim());
    localStorage.setItem('geometra_current_user_role', authorRole.trim());

    onAddNote({
      content: content.trim(),
      authorName: authorName.trim() || 'Admin',
      authorRole: authorRole.trim() || undefined,
    });

    setContent('');
    setIsExpanded(true);
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
          <span>{title}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
            {notes.length}
          </span>
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-2.5">
          {/* List of existing notes */}
          {notes.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-1">
              No notes recorded yet on this {itemType}.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs text-slate-700 relative group transition-colors hover:bg-slate-100/60"
                >
                  <div className="flex items-center justify-between mb-1.5 text-[11px] text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-medium text-[10px]">
                        {note.authorName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">
                        {note.authorName}
                      </span>
                      {note.authorRole && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-medium bg-slate-200/70 text-slate-600">
                          {note.authorRole}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(note.createdAt)}
                      </span>
                      {onDeleteNote && (
                        <button
                          type="button"
                          onClick={() => onDeleteNote(note.id)}
                          title="Delete note"
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition-all rounded hover:bg-rose-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-800 whitespace-pre-wrap pl-6 leading-relaxed">
                    {note.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Add note form */}
          <form onSubmit={handleSubmit} className="space-y-2 pt-1.5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Write a note on this ${itemType}...`}
                  className="w-full pl-3 pr-8 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!content.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-900 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
                  title="Post note"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="text-slate-400">Author:</span>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="Your Name"
                className="w-28 px-1.5 py-0.5 text-[11px] bg-transparent border-b border-slate-300 focus:border-slate-900 focus:outline-none"
              />
              <span className="text-slate-400">Role:</span>
              <input
                type="text"
                value={authorRole}
                onChange={(e) => setAuthorRole(e.target.value)}
                placeholder="Role (e.g. Lead, Assessor)"
                className="w-28 px-1.5 py-0.5 text-[11px] bg-transparent border-b border-slate-300 focus:border-slate-900 focus:outline-none"
              />
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
