import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TagInput({ tags, onChange, placeholder = "Type and press Enter or comma", className }) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (val) => {
    const trimmed = val.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue) {
      addTag(inputValue);
    }
  };

  const removeTag = (indexToRemove) => {
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className={cn("border border-gray-200 rounded-[1.25rem] px-3 py-3 flex flex-wrap gap-2 items-center bg-white focus-within:ring-2 focus-within:ring-emerald-500/40 shadow-sm min-h-[60px]", className)}>
      {tags.map((tag, idx) => (
        <span key={idx} className="bg-emerald-50 text-emerald-700 text-sm font-bold px-3 py-1.5 rounded-[1rem] flex items-center gap-1 border border-emerald-100/50 shadow-sm">
          {tag}
          <button 
            type="button" 
            onClick={() => removeTag(idx)}
            className="text-emerald-400 hover:text-emerald-700 focus:outline-none ml-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-grow min-w-[120px] outline-none font-medium px-2 py-1 bg-transparent placeholder:text-gray-400"
        placeholder={tags.length === 0 ? placeholder : ""}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </div>
  );
}

