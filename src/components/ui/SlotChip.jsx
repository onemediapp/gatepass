import React from 'react';

const STATE_CLASSES = {
  available:
    'bg-white text-ink border-line hover:border-teal-500 hover:shadow-md hover:-translate-y-0.5 active:scale-95 cursor-pointer',
  selected:
    'bg-navy-900 text-white border-navy-900 shadow-lg ring-2 ring-amber-400 scale-[1.02] cursor-pointer',
  full:
    'bg-slate-50 text-slate-400 border-slate-200/60 opacity-60 cursor-not-allowed',
  past:
    'bg-slate-50 text-slate-300 border-slate-200/40 opacity-40 cursor-not-allowed line-through',
};

export default function SlotChip({
  state = 'available',
  time,
  remaining,
  refusalLabel,
  onClick,
  className = '',
}) {
  const isClickable = state === 'available' || state === 'selected';
  const isSelected = state === 'selected';
  const isAvailable = state === 'available';
  const stateClass = STATE_CLASSES[state] || STATE_CLASSES.available;

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={isClickable ? onClick : undefined}
      className={`relative inline-flex flex-col items-center justify-center px-3 py-2 min-h-[3rem] min-w-[4.75rem] rounded-[1rem] border font-mono text-xs transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 select-none ${stateClass} ${className}`}
    >
      <div className="flex items-center gap-1.5 font-bold tracking-tight">
        {isAvailable && (
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 flex-shrink-0" />
        )}
        {isSelected && (
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
        )}
        <span>{time}</span>
      </div>

      {remaining !== undefined && isAvailable && (
        <span className="text-[0.625rem] text-teal-600 font-sans font-medium tracking-tight mt-0.5">
          {remaining} slot{remaining === 1 ? '' : 's'}
        </span>
      )}

      {isSelected && (
        <span className="text-[0.625rem] text-amber-300 font-sans font-semibold tracking-tight mt-0.5">
          Selected
        </span>
      )}

      {state === 'full' && (
        <span className="text-[0.5625rem] text-coral-600 font-sans tracking-tight mt-0.5 truncate max-w-full font-medium">
          {refusalLabel || 'Full'}
        </span>
      )}

      {state === 'past' && (
        <span className="text-[0.5625rem] text-slate-400 font-sans tracking-tight mt-0.5">
          Passed
        </span>
      )}
    </button>
  );
}
