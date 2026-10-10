import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export function TagInput({ tags = [], onChange, placeholder = "Type and press Enter or comma", className }) {
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
    <div className={cn("border border-line rounded-[0.875rem] p-2.5 flex flex-wrap gap-1.5 items-center bg-white focus-within:ring-2 focus-within:ring-navy-100 focus-within:border-navy-500 shadow-sm min-h-[3.25rem] transition-all", className)}>
      {tags.map((tag, idx) => (
        <span
          key={idx}
          className="bg-navy-100 text-navy-900 font-mono text-xs font-medium px-2.5 py-1 rounded-[0.5rem] flex items-center gap-1 border border-navy-500/20"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(idx)}
            className="text-navy-500 hover:text-coral-600 focus:outline-none transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-grow min-w-[7.5rem] outline-none text-xs font-medium px-2 py-1 bg-transparent text-ink placeholder:text-ink-mute"
        placeholder={tags.length === 0 ? placeholder : ""}
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
      />
    </div>
  );
}

export default TagInput;
