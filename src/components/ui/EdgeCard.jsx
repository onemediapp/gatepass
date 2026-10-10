import React from 'react';

const EDGE_VARIANTS = {
  navy: 'border-l-4 border-l-navy-900',
  teal: 'border-l-4 border-l-teal-600',
  coral: 'border-l-4 border-l-coral-600',
  sand: 'border-l-4 border-l-sand-600',
  amber: 'border-l-4 border-l-amber-500',
  none: '',
};

export default function EdgeCard({
  edge = 'navy',
  className = '',
  children,
  onClick,
  ...props
}) {
  const edgeClass = EDGE_VARIANTS[edge] || EDGE_VARIANTS.navy;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-[1.25rem] border border-line shadow-[0_1px_2px_rgba(11,23,48,0.06),0_8px_24px_rgba(11,23,48,0.06)] overflow-hidden transition-all ${edgeClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
