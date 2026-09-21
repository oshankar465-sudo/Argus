import React, { useState, useRef } from 'react';
import { useArgus } from '../context/ArgusContext';
import { ResourceType } from '../types';
import { detectResourceType } from '../utils/formatters';
import { X, Paperclip, Link, Upload, FileText, Check } from 'lucide-react';

export const ResourceModal: React.FC = () => {
  const {
    isResourceModalOpen,
    setIsResourceModalOpen,
    resourceTarget,
    addResource,
  } = useArgus();

  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<'file' | 'link'>('file');
  const [linkUrl, setLinkUrl] = useState('');
  const [fileType, setFileType] = useState<ResourceType>('pdf');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isResourceModalOpen || !resourceTarget) return null;

  const handleClose = () => {
    setIsResourceModalOpen(false);
    setName('');
    setLinkUrl('');
    setSelectedFileName('');
    setSelectedFileSize('');
    setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      // Auto-suggest human readable name if empty
      if (!name) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setName(cleanName);
      }
      const calculatedType = detectResourceType(file.name);
      setFileType(calculatedType);

      // format size
      const sizeKb = Math.round(file.size / 1024);
      if (sizeKb > 1024) {
        setSelectedFileSize(`${(sizeKb / 1024).toFixed(1)} MB`);
      } else {
        setSelectedFileSize(`${sizeKb} KB`);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('A human-readable resource name is required.');
      return;
    }

    if (sourceType === 'link') {
      if (!linkUrl.trim()) {
        setError('Please provide the external link URL.');
        return;
      }
      addResource(resourceTarget, {
        name: name.trim(),
        type: 'link',
        url: linkUrl.trim(),
      });
    } else {
      addResource(resourceTarget, {
        name: name.trim(),
        type: fileType,
        fileName: selectedFileName || `${name.trim()}.${fileType === 'excel' ? 'xlsx' : fileType === 'word' ? 'docx' : fileType}`,
        fileSize: selectedFileSize || '240 KB',
      });
    }

    handleClose();
  };

  const getTargetTitle = () => {
    if (resourceTarget.level === 'candidate') {
      return 'Candidate Resource';
    }
    if (resourceTarget.level === 'task') {
      return `Task Resource ${resourceTarget.targetName ? `(${resourceTarget.targetName})` : ''}`;
    }
    return `Subtask Resource ${resourceTarget.targetName ? `(${resourceTarget.targetName})` : ''}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 sm:px-6 sm:py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shrink-0">
              <Paperclip className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">Attach Resource</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{getTargetTitle()}</p>
            </div>
          </div>
          <button
            type="button"
            id="close-resource-modal-btn"
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
              {error}
            </div>
          )}

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              id="source-type-file-btn"
              onClick={() => {
                setSourceType('file');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                sourceType === 'file'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Document / File</span>
            </button>
            <button
              type="button"
              id="source-type-link-btn"
              onClick={() => {
                setSourceType('link');
                setError('');
              }}
              className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                sourceType === 'link'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              <span>External Link</span>
            </button>
          </div>

          {/* Human Readable Name (Mandatory) */}
          <div>
            <label htmlFor="resource-name" className="block text-xs font-medium text-slate-700 mb-1.5">
              Human-Readable Resource Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="resource-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder="Resource title or description"
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
              autoFocus
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Descriptive label displayed across ARGUS dashboards and executive PDF reports.
            </p>
          </div>

          {sourceType === 'link' ? (
            <div>
              <label htmlFor="resource-link-url" className="block text-xs font-medium text-slate-700 mb-1.5">
                Target URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                id="resource-link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://example.com/spec-or-repo"
                className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400"
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Document Type Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Document Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['pdf', 'excel', 'word', 'image'] as ResourceType[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFileType(t)}
                      className={`py-1.5 text-xs font-medium rounded-md border uppercase text-center transition-all ${
                        fileType === t
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  id="resource-file-upload-input"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-4 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all"
                >
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  {selectedFileName ? (
                    <div>
                      <div className="text-xs font-semibold text-slate-900">{selectedFileName}</div>
                      <div className="text-[11px] text-slate-500">{selectedFileSize || 'Ready to attach'}</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-xs font-medium text-slate-700">
                        Click or drag file to attach
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        PDF, Excel (.xlsx), Word (.docx), or images up to 25MB
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              id="cancel-resource-btn"
              onClick={handleClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              id="save-resource-btn"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Attach Resource</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
