import React from 'react';

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    classes: 'bg-sand-50 text-sand-600 border-sand-600/30',
  },
  approved: {
    label: 'Approved',
    classes: 'bg-teal-50 text-teal-600 border-teal-600/30',
  },
  declined: {
    label: 'Declined',
    classes: 'bg-coral-50 text-coral-600 border-coral-600/30',
  },
  rejected: {
    label: 'Declined',
    classes: 'bg-coral-50 text-coral-600 border-coral-600/30',
  },
  cancelled: {
    label: 'Cancelled',
    classes: 'bg-cream-50 text-ink-mute border-line',
  },
  expired: {
    label: 'Expired',
    classes: 'bg-cream-50 text-ink-mute border-line',
  },
  completed: {
    label: 'Completed',
    classes: 'bg-teal-50 text-teal-600 border-teal-600/30',
  },
  in_cabin: {
    label: 'In Cabin',
    classes: 'bg-amber-100 text-sand-600 border-amber-500/30',
  },
};

export default function StatusChip({ status, label, className = '' }) {
  const normStatus = (status || 'pending').toLowerCase();
  const config = STATUS_CONFIG[normStatus] || STATUS_CONFIG.pending;
  const displayLabel = label || config.label;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-mono tracking-wide ${config.classes} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
