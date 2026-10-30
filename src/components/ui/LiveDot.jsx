import React from 'react';

const COLOR_MAP = {
  teal: {
    ping: 'bg-teal-500',
    dot: 'bg-teal-500',
    text: 'text-teal-600',
  },
  amber: {
    ping: 'bg-amber-400',
    dot: 'bg-amber-500',
    text: 'text-amber-500',
  },
  coral: {
    ping: 'bg-coral-500',
    dot: 'bg-coral-600',
    text: 'text-coral-600',
  },
};

export default function LiveDot({ 
  className = '', 
  label = '', 
  color = 'teal', 
  active = true,
  size = 'md' 
}) {
  const c = COLOR_MAP[color] || COLOR_MAP.teal;
  const sizeClasses = size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2';

  return (
    <span className={`inline-flex items-center gap-1.5 select-none ${className}`}>
      <span className={`relative flex ${sizeClasses}`}>
        {active && (
          <span 
            className={`motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full ${c.ping} opacity-75`} 
          />
        )}
        <span className={`relative inline-flex rounded-full ${sizeClasses} ${c.dot} shadow-[0_0_8px_rgba(20,184,166,0.5)]`} />
      </span>
      {label && <span className={`text-xs font-semibold tracking-tight ${c.text}`}>{label}</span>}
    </span>
  );
}
