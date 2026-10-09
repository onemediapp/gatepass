import { useState } from 'react';
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
        className="flex items-center justify-between border border-gray-200 rounded-[1.25rem] px-5 py-4 bg-white cursor-pointer focus-within:ring-2 focus-within:ring-emerald-500/40 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={cn("block truncate font-medium", !selectedOption && "text-gray-400 font-medium")}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className="w-5 h-5 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-100 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-72 overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-white/90 backdrop-blur-md p-3 border-b border-gray-100">
            <input
              type="text"
              className="w-full border-none focus:ring-0 bg-gray-100/80 rounded-[1rem] px-4 py-3 text-sm outline-none font-medium text-gray-900 placeholder:text-gray-500"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="overflow-y-auto overflow-x-hidden">
            {filteredOptions.length === 0 ? (
              <div className="px-5 py-6 text-sm font-medium text-gray-500 text-center">No options found</div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "px-5 py-3.5 text-sm cursor-pointer hover:bg-emerald-50 flex items-center justify-between transition-colors",
                    value === option.value && "bg-emerald-50/80 text-emerald-700 font-bold"
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <span className={cn("font-medium", value === option.value && "font-bold")}>{option.label}</span>
                  {value === option.value && <Check className="w-5 h-5 text-emerald-600" />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
