import React from 'react';

const VARIANTS = {
  neutral: 'text-ink-mute bg-cream-50 border-line',
  navy: 'text-navy-900 bg-navy-100 border-navy-500/20',
  amber: 'text-sand-600 bg-amber-100 border-amber-500/30',
  teal: 'text-teal-600 bg-teal-50 border-teal-600/30',
  coral: 'text-coral-600 bg-coral-50 border-coral-600/30',
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
      className={`inline-flex items-center px-2 py-0.5 rounded-[0.375rem] font-mono tracking-wider uppercase text-[0.6875rem] font-medium border ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
