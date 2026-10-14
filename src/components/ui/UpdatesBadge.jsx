import React from 'react';
import { cn } from '../../lib/utils';

export default function UpdatesBadge({ count, dotOnly = false, className }) {
  if (count === undefined || count === null || count === 0) return null;

  if (dotOnly) {
    return (
      <span
        className={cn(
          'inline-block w-2.5 h-2.5 rounded-full bg-coral-500 ring-2 ring-white animate-pulse',
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center px-1.5 py-0.5 rounded-full bg-coral-500 text-white font-mono text-[0.625rem] font-bold leading-none min-w-[1.125rem]',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
