import React, { useState, useRef, useEffect } from 'react';
import { StatusType } from '../types';
import { getStatusStyle } from '../utils/formatters';
import { ChevronDown, Check } from 'lucide-react';

interface StatusBadgeProps {
  status: StatusType;
  onChange?: (newStatus: StatusType) => void;
  interactive?: boolean;
  size?: 'sm' | 'md';
}

const ALL_STATUSES: StatusType[] = [
  'No Status',
  'Started',
  'In Progress',
  'Completed',
];

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  onChange,
  interactive = false,
  size = 'md',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const style = getStatusStyle(status);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (!interactive || !onChange) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${style.badgeClass} ${sizeClasses} transition-colors whitespace-nowrap`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`} />
        <span>{style.label}</span>
      </span>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 font-medium rounded-md border ${style.badgeClass} ${sizeClasses} hover:brightness-95 focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer transition-all whitespace-nowrap`}
        title="Click to update status"
      >
        <span className={`w-1.5 h-1.5 rounded-full ${style.dotClass}`} />
        <span>{style.label}</span>
        <ChevronDown className="w-3 h-3 ml-0.5 opacity-60" />
      </button>

      {isOpen && (
        <div
          className="absolute z-50 mt-1 min-w-[155px] bg-white rounded-lg shadow-xl border border-slate-200 py-1 focus:outline-none right-0"
          role="menu"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-2.5 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100 mb-0.5">
            Select Status
          </div>
          {ALL_STATUSES.map((st) => {
            const optStyle = getStatusStyle(st);
            const isSelected = st === status;
            return (
              <button
                key={st}
                type="button"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onChange(st);
                  setIsOpen(false);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(st);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                  isSelected ? 'font-semibold text-slate-900 bg-slate-50/80' : 'text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${optStyle.dotClass}`} />
                  <span>{st}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-slate-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
