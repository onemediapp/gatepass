import React from 'react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    classes: 'bg-amber-50/80 text-amber-600 border-amber-500/25',
    dot: 'bg-amber-500',
    ping: false,
  },
  approved: {
    label: 'Approved',
    classes: 'bg-teal-50 text-teal-700 border-teal-600/30',
    dot: 'bg-teal-500',
    ping: true,
  },
  declined: {
    label: 'Declined',
    classes: 'bg-coral-50 text-coral-600 border-coral-600/25',
    dot: 'bg-coral-500',
    ping: false,
  },
  rejected: {
    label: 'Declined',
    classes: 'bg-coral-50 text-coral-600 border-coral-600/25',
    dot: 'bg-coral-500',
    ping: false,
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-400',
    ping: false,
  },
  expired: {
    label: 'Expired',
    classes: 'bg-slate-100 text-slate-500 border-slate-200',
    dot: 'bg-slate-400',
    ping: false,
  },
  completed: {
    label: 'Completed',
    classes: 'bg-teal-50 text-teal-700 border-teal-600/30',
    dot: 'bg-teal-600',
    ping: false,
  },
  in_cabin: {
    label: 'In Cabin',
    classes: 'bg-amber-100 text-amber-800 border-amber-500/40',
    dot: 'bg-amber-500',
    ping: true,
  },
};

export default function StatusChip({ status, label, showDot = true, className = '' }) {
  const normStatus = (status || 'pending').toLowerCase();
  const config = STATUS_CONFIG[normStatus] || STATUS_CONFIG.pending;
  const displayLabel = label || config.label;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[0.6875rem] font-bold border font-mono tracking-wider uppercase select-none ${config.classes} ${className}`}
    >
      {showDot && (
        <span className="relative flex h-1.5 w-1.5">
          {config.ping && (
            <span className={`motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.dot}`} />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${config.dot}`} />
        </span>
      )}
      <span>{displayLabel}</span>
    </span>
  );
}
