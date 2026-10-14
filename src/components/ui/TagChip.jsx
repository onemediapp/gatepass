import React from 'react';
import { cn } from '../../lib/utils';

export default function TagChip({ tag, variant = 'default', onRemove, className }) {
  const isVip = tag?.toLowerCase?.() === 'vip' || variant === 'vip';
  const isCaution = tag?.toLowerCase?.() === 'caution' || variant === 'caution';

  let colorClasses = 'bg-cream-100 text-ink-soft border-line';
  if (isVip) {
    colorClasses = 'bg-amber-100 text-amber-800 border-amber-300 font-semibold';
  } else if (isCaution) {
    colorClasses = 'bg-coral-50 text-coral-700 border-coral-200 font-semibold';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-[0.5rem] border text-[0.6875rem] font-mono tracking-tight transition-all',
        colorClasses,
        className
      )}
    >
      <span>{tag}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag);
          }}
          className="hover:opacity-75 focus:outline-none ml-0.5 text-xs font-bold leading-none"
        >
          &times;
        </button>
      )}
    </span>
  );
}
