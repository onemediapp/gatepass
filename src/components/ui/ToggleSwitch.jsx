import React from 'react';
import { cn } from '../../lib/utils';

export function ToggleSwitch({ checked, onChange, label, description, className }) {
  return (
    <label className={cn("flex items-start justify-between cursor-pointer group select-none", className)}>
      <div className="flex flex-col pr-4">
        {label && (
          <span className="font-semibold text-ink text-sm group-active:opacity-80 transition-opacity">
            {label}
          </span>
        )}
        {description && (
          <span className="text-xs text-ink-mute mt-0.5 font-normal leading-relaxed group-active:opacity-80 transition-opacity">
            {description}
          </span>
        )}
      </div>
      <div className="relative inline-flex items-center mt-0.5 flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className="w-11 h-6 bg-line peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-line after:border after:rounded-full after:h-5 after:w-5 after:shadow-sm after:transition-all peer-checked:bg-teal-600 transition-colors" />
      </div>
    </label>
  );
}

export default ToggleSwitch;
