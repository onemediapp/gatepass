import React from 'react';

const VARIANTS = {
  neutral: 'text-slate-600 bg-slate-100/80 border-slate-200/80',
  navy: 'text-navy-900 bg-navy-100/90 border-navy-500/20 font-semibold',
  amber: 'text-amber-700 bg-amber-50 border-amber-500/30 font-semibold',
  teal: 'text-teal-700 bg-teal-50 border-teal-600/30 font-semibold',
  coral: 'text-coral-600 bg-coral-50 border-coral-600/30 font-semibold',
  white: 'text-white bg-white/10 border-white/20 backdrop-blur-sm',
};

export default function MonoTag({
  children,
  variant = 'neutral',
  className = '',
  ...props
}) {
  const variantClass = VARIANTS[variant] || VARIANTS.neutral;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[0.5rem] font-mono tracking-wider uppercase text-[0.625rem] border select-none transition-colors ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
