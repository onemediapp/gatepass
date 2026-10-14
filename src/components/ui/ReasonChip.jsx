import React from 'react';
import { cn } from '../../lib/utils';
import { Sparkles, BookOpen, Package, Clock, Tag, UserCheck, HelpCircle } from 'lucide-react';

export const VISIT_REASONS = [
  { id: 'new_product', label: 'New product', icon: Sparkles },
  { id: 'scientific_update', label: 'Scientific update', icon: BookOpen },
  { id: 'samples', label: 'Samples', icon: Package },
  { id: 'follow_up', label: 'Follow-up on earlier visit', icon: Clock },
  { id: 'scheme', label: 'Scheme / pricing', icon: Tag },
  { id: 'doctor_requested', label: 'Doctor requested', icon: UserCheck },
  { id: 'other', label: 'Other', icon: HelpCircle },
];

export function getReasonLabel(reasonId) {
  const found = VISIT_REASONS.find(r => r.id === reasonId);
  return found ? found.label : reasonId;
}

export default function ReasonChip({ reason, selected = false, onClick, className, readOnly = false }) {
  const Icon = reason?.icon || Sparkles;

  if (readOnly) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[0.625rem] bg-navy-50 text-navy-900 border border-navy-200 text-[0.6875rem] font-semibold tracking-tight',
          className
        )}
      >
        <Icon className="w-3.5 h-3.5 text-navy-700 shrink-0" />
        <span>{reason?.label || reason}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] border text-xs font-semibold transition-all active:scale-95 text-left',
        selected
          ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
          : 'bg-white text-ink-soft border-line hover:border-navy-400 hover:bg-cream-50',
        className
      )}
    >
      <Icon className={cn('w-3.5 h-3.5 shrink-0', selected ? 'text-amber-400' : 'text-ink-mute')} />
      <span>{reason?.label || reason}</span>
    </button>
  );
}
