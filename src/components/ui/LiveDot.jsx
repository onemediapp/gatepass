import React from 'react';

export default function LiveDot({ className = '', label = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-600 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600" />
      </span>
      {label && <span className="text-xs font-medium text-teal-600">{label}</span>}
    </span>
  );
}
