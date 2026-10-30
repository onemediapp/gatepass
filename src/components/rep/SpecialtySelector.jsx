/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SPECIALTIES_DATA } from '../../data/specialties';
import { Check, Plus, X, ChevronDown, ChevronUp, Sparkles, Stethoscope } from 'lucide-react';
import { cn } from '../../lib/utils';
import MonoTag from '../ui/MonoTag';

export default function SpecialtySelector({
  specialties = [],
  subSpecialties = [],
  onChange
}) {
  const [customInput, setCustomInput] = useState('');
  const [expandedSpecialty, setExpandedSpecialty] = useState(null);
  const [showAllCategories, setShowAllCategories] = useState(false);

  const selectedSpecialties = Array.isArray(specialties) ? specialties : (specialties ? [specialties] : []);
  const selectedSubSpecialties = Array.isArray(subSpecialties) ? subSpecialties : (subSpecialties ? [subSpecialties] : []);

  const toggleSpecialty = (cat) => {
    let newCats;
    if (selectedSpecialties.includes(cat)) {
      newCats = selectedSpecialties.filter(c => c !== cat);
      // Also remove any sub-specialties belonging to this category
      const catData = SPECIALTIES_DATA.find(s => s.category === cat);
      const catSubList = catData?.subSpecialties || [];
      const newSubs = selectedSubSpecialties.filter(s => !catSubList.includes(s));
      onChange?.({ specialties: newCats, subSpecialties: newSubs });
    } else {
      newCats = [...selectedSpecialties, cat];
      setExpandedSpecialty(cat);
      onChange?.({ specialties: newCats, subSpecialties: selectedSubSpecialties });
    }
  };

  const toggleSubSpecialty = (sub) => {
    let newSubs;
    if (selectedSubSpecialties.includes(sub)) {
      newSubs = selectedSubSpecialties.filter(s => s !== sub);
    } else {
      newSubs = [...selectedSubSpecialties, sub];
    }
    onChange?.({ specialties: selectedSpecialties, subSpecialties: newSubs });
  };

  const handleAddCustom = (e) => {
    e?.preventDefault();
    const trimmed = customInput.trim();
    if (!trimmed) return;

    if (!selectedSpecialties.includes(trimmed)) {
      const newCats = [...selectedSpecialties, trimmed];
      onChange?.({ specialties: newCats, subSpecialties: selectedSubSpecialties });
    }
    setCustomInput('');
  };

  const removeSpecialty = (cat) => {
    const newCats = selectedSpecialties.filter(c => c !== cat);
    const catData = SPECIALTIES_DATA.find(s => s.category === cat);
    const catSubList = catData?.subSpecialties || [];
    const newSubs = selectedSubSpecialties.filter(s => !catSubList.includes(s));
    onChange?.({ specialties: newCats, subSpecialties: newSubs });
  };

  const removeSubSpecialty = (sub) => {
    const newSubs = selectedSubSpecialties.filter(s => s !== sub);
    onChange?.({ specialties: selectedSpecialties, subSpecialties: newSubs });
  };

  const displayedCategories = showAllCategories 
    ? SPECIALTIES_DATA 
    : SPECIALTIES_DATA.slice(0, 8);

  return (
    <div className="space-y-3 font-sans">
      
      {/* Selected Tags Display */}
      {selectedSpecialties.length > 0 && (
        <div className="p-3 bg-cream-50 rounded-[1rem] border border-line space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[0.625rem] uppercase font-bold text-ink-mute tracking-wider">
              Selected Portfolios ({selectedSpecialties.length})
            </span>
            <span className="text-[0.625rem] text-teal-600 font-semibold font-mono">
              Active Targets
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {selectedSpecialties.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[0.625rem] bg-navy-900 text-white text-xs font-semibold shadow-2xs group"
              >
                <span>{cat}</span>
                <button
                  type="button"
                  onClick={() => removeSpecialty(cat)}
                  className="w-3.5 h-3.5 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors text-white/80 hover:text-white"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </span>
            ))}
          </div>

          {selectedSubSpecialties.length > 0 && (
            <div className="pt-2 border-t border-line/60">
              <span className="font-mono text-[0.5625rem] uppercase text-ink-mute block mb-1">
                Sub-Specialty Focus ({selectedSubSpecialties.length}):
              </span>
              <div className="flex flex-wrap gap-1">
                {selectedSubSpecialties.map((sub) => (
                  <span
                    key={sub}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[0.5rem] bg-teal-50 border border-teal-300 text-teal-800 text-[0.6875rem] font-medium"
                  >
                    <span>{sub}</span>
                    <button
                      type="button"
                      onClick={() => removeSubSpecialty(sub)}
                      className="text-teal-600 hover:text-teal-900"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Specialty Picker Grid */}
      <div className="space-y-1.5">
        <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold block px-0.5">
          Choose Targeted Specialties (Multiple)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-1.5">
          {displayedCategories.map((item) => {
            const isSelected = selectedSpecialties.includes(item.category);
            const isExpanded = expandedSpecialty === item.category;

            return (
              <div 
                key={item.category}
                className={cn(
                  "p-2.5 rounded-[0.875rem] border transition-all text-xs cursor-pointer select-none",
                  isSelected
                    ? "bg-navy-950 text-white border-navy-900 shadow-2xs"
                    : "bg-white hover:bg-cream-50/80 border-line text-ink-soft hover:text-ink"
                )}
                onClick={() => toggleSpecialty(item.category)}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn(
                      "w-4 h-4 rounded-[0.35rem] border flex items-center justify-center flex-shrink-0 transition-colors",
                      isSelected ? "bg-amber-400 border-amber-400 text-navy-950" : "border-line bg-cream-50"
                    )}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span className="font-medium truncate text-xs">{item.category}</span>
                  </div>

                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedSpecialty(isExpanded ? null : item.category);
                      }}
                      className="p-0.5 rounded text-white/70 hover:text-white hover:bg-white/10"
                      title="View sub-specialties"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>

                {/* Sub-specialties collapsible area */}
                {isSelected && isExpanded && (
                  <div 
                    className="mt-2.5 pt-2 border-t border-white/15 space-y-1 animate-in fade-in"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="font-mono text-[0.5625rem] text-slate-300 block mb-1">
                      Tap to select sub-specialties:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {item.subSpecialties.map((sub) => {
                        const isSubSelected = selectedSubSpecialties.includes(sub);
                        return (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => toggleSubSpecialty(sub)}
                            className={cn(
                              "text-[0.625rem] px-2 py-0.5 rounded-full font-medium transition-colors",
                              isSubSelected
                                ? "bg-teal-400 text-navy-950 font-bold"
                                : "bg-white/15 text-slate-200 hover:bg-white/25"
                            )}
                          >
                            {isSubSelected ? `✓ ${sub}` : `+ ${sub}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {SPECIALTIES_DATA.length > 8 && (
          <button
            type="button"
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="text-[0.6875rem] font-bold text-navy-900 hover:text-navy-700 font-mono flex items-center gap-1 pt-1 px-1"
          >
            <span>{showAllCategories ? 'Show fewer specialties' : `Show all ${SPECIALTIES_DATA.length} medical specialties...`}</span>
            {showAllCategories ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}
      </div>

      {/* Custom Specialty Entry */}
      <div className="pt-2 border-t border-line/70">
        <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold block px-0.5 mb-1.5 flex items-center gap-1">
          <Plus className="w-3 h-3 text-amber-500" />
          <span>Add Custom Specialty or Sub-Specialty</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustom();
              }
            }}
            placeholder="Type new specialty (e.g. Trichology, Sports Medicine)..."
            className="flex-1 bg-cream-50/70 focus:bg-white border border-line focus:border-navy-900 rounded-[0.75rem] px-3.5 py-2 text-xs font-medium text-ink outline-none transition-all placeholder:text-ink-mute"
          />
          <button
            type="button"
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
            className="px-3.5 py-2 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 text-white rounded-[0.75rem] text-xs font-bold transition-all flex items-center gap-1 shrink-0 active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>Add</span>
          </button>
        </div>
        <p className="text-[0.625rem] text-ink-mute px-0.5 mt-1">
          Enter any specialty not found in the standard catalog to personalize your detailing focus.
        </p>
      </div>

    </div>
  );
}
