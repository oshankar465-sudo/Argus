import React from 'react';
import { Resource } from '../types';
import { FileText, FileSpreadsheet, ExternalLink, Image as ImageIcon, File, Trash2, Download } from 'lucide-react';

interface ResourceItemProps {
  resource: Resource;
  onDelete?: () => void;
  compact?: boolean;
}

export const ResourceItem: React.FC<ResourceItemProps> = ({ resource, onDelete, compact = false }) => {
  const getIcon = () => {
    switch (resource.type) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-rose-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'word':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'image':
        return <ImageIcon className="w-4 h-4 text-purple-600" />;
      case 'link':
        return <ExternalLink className="w-4 h-4 text-slate-500" />;
      default:
        return <File className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (resource.type === 'link' && resource.url) {
      window.open(resource.url, '_blank', 'noopener,noreferrer');
    } else if (resource.url) {
      // Direct file data or link
      const a = document.createElement('a');
      a.href = resource.url;
      a.download = resource.fileName || resource.name;
      a.target = '_blank';
      a.click();
    } else {
      // Simulate file download / preview for mock items
      const dummyContent = `ARGUS Internal Resource: ${resource.name}\nFile: ${resource.fileName || resource.name}\nLevel: ${resource.level}\nType: ${resource.type.toUpperCase()}`;
      const blob = new Blob([dummyContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.fileName || `${resource.name.replace(/\s+/g, '_')}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (compact) {
    return (
      <div className="group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 text-xs transition-colors">
        <div className="flex items-center gap-2 min-w-0">
          <div className="shrink-0">{getIcon()}</div>
          <span className="font-medium text-slate-800 truncate" title={resource.name}>
            {resource.name}
          </span>
          {resource.fileSize && (
            <span className="text-[10px] text-slate-400 shrink-0">({resource.fileSize})</span>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleOpen}
            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded transition-colors"
            title={resource.type === 'link' ? 'Open link' : 'Download file'}
          >
            {resource.type === 'link' ? (
              <ExternalLink className="w-3 h-3" />
            ) : (
              <Download className="w-3 h-3" />
            )}
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
              title="Remove resource"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center justify-between gap-3 p-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-xs">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-md bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60">
          {getIcon()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-900 text-sm truncate" title={resource.name}>
              {resource.name}
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              {resource.type}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
            {resource.type === 'link' ? (
              <span className="truncate text-slate-500 hover:underline">{resource.url}</span>
            ) : (
              <>
                {resource.fileName && <span className="truncate">{resource.fileName}</span>}
                {resource.fileSize && <span>• {resource.fileSize}</span>}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleOpen}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
          title={resource.type === 'link' ? 'Open link in new tab' : 'Download file'}
        >
          {resource.type === 'link' ? (
            <>
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open</span>
            </>
          ) : (
            <>
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </>
          )}
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
            title="Remove resource"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
