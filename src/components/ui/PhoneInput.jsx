import React from 'react';
import { cn } from '../../lib/utils';

export function PhoneInput({ value, onChange, className, required, placeholder = '98765 43210' }) {
  const handleChange = (e) => {
    // Only allow digits inside value, max 10
    const digitsOnly = e.target.value.replace(/\D/g, '').substring(0, 10);
    onChange(digitsOnly);
  };

  return (
    <div className={cn("flex items-center w-full bg-white rounded-[0.875rem] border border-line focus-within:border-navy-500 focus-within:ring-2 focus-within:ring-navy-100 overflow-hidden transition-all", className)}>
      <div className="bg-cream-50 border-r border-line px-3.5 py-3 text-ink-mute font-mono text-sm font-semibold select-none">
        +91
      </div>
      <input
        type="tel"
        pattern="[0-9]{10}"
        className="flex-grow px-3.5 py-3 min-w-0 outline-none w-full bg-transparent font-mono text-sm text-ink placeholder:text-ink-mute"
        placeholder={placeholder}
        value={value || ''}
        onChange={handleChange}
        required={required}
      />
    </div>
  );
}

export default PhoneInput;
