import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export function SearchableSelect({ options, value, onChange, placeholder = "Select an option", className }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={cn("relative", className)}>
      <div
        className="flex items-center justify-between border border-line rounded-[0.875rem] px-4 py-3 bg-white cursor-pointer focus-within:ring-2 focus-within:ring-navy-100 hover:border-navy-500 transition-all shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn("block truncate text-sm font-medium", !selectedOption ? "text-ink-mute" : "text-ink")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-ink-mute transition-transform" />
      </div>

      {isOpen && (
        <div className="absolute z-30 w-full mt-1.5 bg-white border border-line rounded-[0.875rem] shadow-[0_8px_24px_rgba(11,23,48,0.12)] max-h-72 overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md p-2.5 border-b border-line">
            <input
              type="text"
              className="w-full bg-cream-50 border border-line rounded-[0.625rem] px-3 py-2 text-xs outline-none font-medium text-ink placeholder:text-ink-mute focus:border-navy-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto overflow-x-hidden">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-5 text-xs font-medium text-ink-mute text-center">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "px-4 py-2.5 text-xs cursor-pointer hover:bg-teal-50 flex items-center justify-between transition-colors",
                    value === option.value ? "bg-teal-50 text-teal-600 font-semibold" : "text-ink"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <span>{option.label}</span>
                  {value === option.value && <Check className="w-4 h-4 text-teal-600" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
