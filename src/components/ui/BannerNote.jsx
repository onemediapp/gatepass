import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function BannerNote({ note, title = 'Doctor Note', className }) {
  if (!note) return null;

  return (
    <div
      className={cn(
        'p-2.5 rounded-[0.75rem] bg-amber-50 border border-amber-300/80 text-amber-900 text-xs flex items-start gap-2 shadow-xs',
        className
      )}
    >
      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <span className="font-bold text-[0.6875rem] uppercase tracking-wider block font-mono text-amber-800">{title}</span>}
        <p className="leading-snug font-medium text-xs break-words">{note}</p>
      </div>
    </div>
  );
}
