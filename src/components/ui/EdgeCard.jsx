import React from 'react';

const EDGE_VARIANTS = {
  navy: 'border-l-[0.3125rem] border-l-navy-900',
  teal: 'border-l-[0.3125rem] border-l-teal-600',
  coral: 'border-l-[0.3125rem] border-l-coral-600',
  sand: 'border-l-[0.3125rem] border-l-sand-600',
  amber: 'border-l-[0.3125rem] border-l-amber-500',
  none: '',
};

export default function EdgeCard({
  edge = 'navy',
  className = '',
  children,
  onClick,
  hoverable = false,
  ...props
}) {
  const edgeClass = EDGE_VARIANTS[edge] || EDGE_VARIANTS.navy;
  const isInteractive = Boolean(onClick) || hoverable;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[1.25rem] border border-line shadow-[0_1px_3px_rgba(15,23,42,0.04),0_8px_20px_-4px_rgba(15,23,42,0.06)] overflow-hidden transition-all duration-200 ${
        isInteractive ? 'hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-6px_rgba(15,23,42,0.1)] active:scale-[0.99] cursor-pointer' : ''
      } ${edgeClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
