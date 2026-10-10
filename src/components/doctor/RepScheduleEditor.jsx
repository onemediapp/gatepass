import React, { useState } from 'react';
import { Plus, Trash2, AlertCircle, Info, CalendarX, Sparkles } from 'lucide-react';
import { 
  DAYS_ORDER, 
  DAY_LABELS, 
  FULL_DAY_LABELS, 
  validateDayRanges, 
  isRangeAlignedToSlot,
  generatePlainLanguageSummary 
} from '../../lib/schedule';
import EdgeCard from '../ui/EdgeCard';
import MonoTag from '../ui/MonoTag';

export default function RepScheduleEditor({ schedule, onChange, className = '' }) {
  const [newBlockedDate, setNewBlockedDate] = useState('');

  const updateField = (field, value) => {
    onChange({
      ...schedule,
      [field]: value,
    });
  };

  const updateWeeklyDay = (day, newRanges) => {
    onChange({
      ...schedule,
      weekly: {
        ...schedule.weekly,
        [day]: newRanges,
      },
    });
  };

  const addRangeToDay = (day) => {
    const current = schedule.weekly[day] || [];
    // Default to 14:00 - 16:00 or after the last range
    let newStart = '14:00';
    let newEnd = '16:00';
    if (current.length > 0) {
      const lastEnd = current[current.length - 1].end;
      newStart = lastEnd;
      // add 1 hour
      const [h, m] = lastEnd.split(':').map(Number);
      const endH = Math.min(23, h + 1).toString().padStart(2, '0');
      newEnd = `${endH}:${m.toString().padStart(2, '0')}`;
    }
    updateWeeklyDay(day, [...current, { start: newStart, end: newEnd }]);
  };

  const removeRangeFromDay = (day, index) => {
    const current = schedule.weekly[day] || [];
    updateWeeklyDay(day, current.filter((_, i) => i !== index));
  };

  const updateRangeInDay = (day, index, field, value) => {
    const current = [...(schedule.weekly[day] || [])];
    current[index] = {
      ...current[index],
      [field]: value,
    };
    updateWeeklyDay(day, current);
  };

  const addBlockedDate = () => {
    if (!newBlockedDate) return;
    const current = schedule.blockedDates || [];
    if (!current.includes(newBlockedDate)) {
      updateField('blockedDates', [...current, newBlockedDate].sort());
    }
    setNewBlockedDate('');
  };

  const removeBlockedDate = (dateToRemove) => {
    const current = schedule.blockedDates || [];
    updateField('blockedDates', current.filter(d => d !== dateToRemove));
  };

  const slotOptions = [15, 20, 30];
  const summaryText = generatePlainLanguageSummary(schedule);

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* Live Plain-Language Preview Box */}
      <EdgeCard edge="amber" className="p-4 bg-amber-50/40">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-[0.5rem] bg-amber-100 text-sand-600 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-sand-600 font-semibold block mb-0.5">
              Live Plain-Language Preview
            </span>
            <p className="text-xs sm:text-sm font-semibold text-ink leading-relaxed">
              "{summaryText}"
            </p>
          </div>
        </div>
      </EdgeCard>

      {/* Slot Length Selector */}
      <div className="space-y-2">
        <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold block">
          Visit Slot Duration
        </label>
        <div className="flex flex-wrap gap-2">
          {slotOptions.map((mins) => {
            const isSelected = schedule.slotMinutes === mins;
            return (
              <button
                key={mins}
                type="button"
                onClick={() => updateField('slotMinutes', mins)}
                className={`px-4 py-2.5 rounded-[0.875rem] font-mono text-xs font-semibold border transition-all ${
                  isSelected
                    ? 'bg-navy-900 text-white border-navy-900 shadow-sm'
                    : 'bg-white text-ink border-line hover:border-ink-mute'
                }`}
              >
                {mins} Minutes
              </button>
            );
          })}
        </div>
        <p className="text-[0.6875rem] text-ink-mute">
          Medical representatives book specific {schedule.slotMinutes}-minute appointments within your daily hours.
        </p>
      </div>

      {/* Weekly Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold">
            Weekly Rep Hours Grid
          </label>
          <span className="text-[0.6875rem] text-ink-mute">At least 1 day required</span>
        </div>

        <div className="space-y-2.5">
          {DAYS_ORDER.map((day) => {
            const ranges = schedule.weekly[day] || [];
            const hasHours = ranges.length > 0;
            const validation = validateDayRanges(ranges);

            return (
              <div
                key={day}
                className={`p-3.5 rounded-[1rem] border transition-all ${
                  hasHours ? 'bg-white border-line shadow-sm' : 'bg-cream-50/60 border-line/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink w-10">
                      {DAY_LABELS[day]}
                    </span>
                    <span className="text-xs text-ink-soft hidden sm:inline">
                      {FULL_DAY_LABELS[day]}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasHours ? (
                      <button
                        type="button"
                        onClick={() => addRangeToDay(day)}
                        className="inline-flex items-center gap-1 font-mono text-[0.6875rem] font-semibold text-teal-600 hover:text-navy-900 px-2 py-1 rounded-[0.5rem] hover:bg-cream-50 transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Add Window
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addRangeToDay(day)}
                        className="inline-flex items-center gap-1 font-mono text-[0.6875rem] font-semibold text-ink-mute hover:text-navy-900 px-2 py-1 rounded-[0.5rem] hover:bg-white border border-dashed border-line transition-colors"
                      >
                        <Plus className="w-3 h-3" /> Set Hours
                      </button>
                    )}
                  </div>
                </div>

                {/* Range inputs list */}
                {hasHours && (
                  <div className="mt-2.5 space-y-2 pl-0 sm:pl-10">
                    {ranges.map((range, idx) => {
                      const isAligned = isRangeAlignedToSlot(range.start, range.end, schedule.slotMinutes);
                      return (
                        <div key={idx} className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="time"
                              value={range.start}
                              onChange={(e) => updateRangeInDay(day, idx, 'start', e.target.value)}
                              className="px-2.5 py-1.5 rounded-[0.625rem] border border-line bg-cream-50 font-mono text-xs text-ink outline-none focus:border-navy-500"
                            />
                            <span className="text-ink-mute text-xs">to</span>
                            <input
                              type="time"
                              value={range.end}
                              onChange={(e) => updateRangeInDay(day, idx, 'end', e.target.value)}
                              className="px-2.5 py-1.5 rounded-[0.625rem] border border-line bg-cream-50 font-mono text-xs text-ink outline-none focus:border-navy-500"
                            />
                            <button
                              type="button"
                              onClick={() => removeRangeFromDay(day, idx)}
                              className="p-1.5 text-ink-mute hover:text-coral-600 transition-colors"
                              title="Remove time window"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {!isAligned && (
                            <span className="text-[0.6875rem] text-sand-600 flex items-center gap-1 pl-1">
                              <Info className="w-3 h-3" />
                              Notice: Time window does not divide evenly into {schedule.slotMinutes}-min slots.
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {validation.hasError && (
                      <p className="text-[0.6875rem] text-coral-600 font-semibold flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {validation.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Quotas & Capacity Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="space-y-1">
          <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold">
            Max Visits / Day
          </label>
          <input
            type="number"
            min="0"
            max="30"
            value={schedule.maxRepsPerDay}
            onChange={(e) => updateField('maxRepsPerDay', Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full px-3 py-2 rounded-[0.875rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500"
          />
          <p className="text-[0.625rem] text-ink-mute">0 = Unlimited visits per day</p>
        </div>

        <div className="space-y-1">
          <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold">
            Max Reps / Slot
          </label>
          <input
            type="number"
            min="1"
            max="5"
            value={schedule.maxRepsPerSlot || 1}
            onChange={(e) => updateField('maxRepsPerSlot', Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-full px-3 py-2 rounded-[0.875rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500"
          />
          <p className="text-[0.625rem] text-ink-mute">1 rep per time slot (recommended)</p>
        </div>

        <div className="space-y-1">
          <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold">
            Advance Booking
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={schedule.advanceDays || 14}
            onChange={(e) => updateField('advanceDays', Math.max(1, parseInt(e.target.value, 10) || 14))}
            className="w-full px-3 py-2 rounded-[0.875rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500"
          />
          <p className="text-[0.625rem] text-ink-mute">Days ahead reps can pick a slot</p>
        </div>
      </div>

      {/* Blocked Dates */}
      <div className="space-y-2 pt-2">
        <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold block">
          Blocked Dates (Holidays / Leave)
        </label>
        
        <div className="flex gap-2">
          <input
            type="date"
            value={newBlockedDate}
            onChange={(e) => setNewBlockedDate(e.target.value)}
            className="px-3 py-2 rounded-[0.875rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500"
          />
          <button
            type="button"
            onClick={addBlockedDate}
            disabled={!newBlockedDate}
            className="px-3 py-2 bg-cream-50 hover:bg-white text-ink font-semibold rounded-[0.875rem] border border-line text-xs disabled:opacity-40 transition-colors"
          >
            Block Date
          </button>
        </div>

        {schedule.blockedDates && schedule.blockedDates.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {schedule.blockedDates.map((dateStr) => (
              <span
                key={dateStr}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[0.5rem] bg-coral-50 border border-coral-600/20 text-coral-600 font-mono text-xs"
              >
                <CalendarX className="w-3 h-3" />
                {dateStr}
                <button
                  type="button"
                  onClick={() => removeBlockedDate(dateStr)}
                  className="hover:text-ink transition-colors ml-0.5"
                  title="Remove blocked date"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
