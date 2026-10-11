import React from 'react';

const STATE_CLASSES = {
  available:
    'bg-white text-ink border-line hover:border-navy-500 hover:shadow-sm cursor-pointer',
  selected:
    'bg-navy-900 text-cream-50 border-navy-900 shadow-md ring-2 ring-amber-500/50 cursor-pointer',
  full:
    'bg-cream-50 text-ink-mute border-line/60 opacity-60 cursor-not-allowed',
  past:
    'bg-cream-50 text-ink-mute/50 border-line/40 opacity-40 cursor-not-allowed line-through',
};

export default function SlotChip({
  state = 'available',
  time,
  remaining,
  onClick,
  className = '',
}) {
  const isClickable = state === 'available' || state === 'selected';
  const stateClass = STATE_CLASSES[state] || STATE_CLASSES.available;

  return (
    <button
      type="button"
      disabled={!isClickable}
      onClick={isClickable ? onClick : undefined}
      className={`inline-flex flex-col items-center justify-center px-3 py-2 min-h-[2.75rem] min-w-[4.5rem] rounded-[0.875rem] border font-mono text-xs transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-navy-500 ${stateClass} ${className}`}
    >
      <span className="font-semibold">{time}</span>
      {remaining !== undefined && state === 'available' && (
        <span className="text-[0.625rem] text-ink-soft tracking-tight mt-0.5">
          {remaining} left
        </span>
      )}
      {state === 'full' && (
        <span className="text-[0.625rem] text-coral-600 font-sans tracking-tight mt-0.5">
          Full
        </span>
      )}
      {state === 'past' && (
        <span className="text-[0.625rem] text-ink-mute font-sans tracking-tight mt-0.5">
          Past
        </span>
      )}
    </button>
  );
}
