/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const DAYS_ORDER = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

export const DAY_LABELS = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
};

export const FULL_DAY_LABELS = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
};

/**
 * Parses HH:mm string into total minutes from midnight
 * @param {string} timeStr e.g. "14:30"
 * @returns {number} minutes e.g. 870
 */
export function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Formats minutes from midnight into 24-hr HH:mm string
 * @param {number} totalMinutes 
 * @returns {string} e.g. "14:30"
 */
export function minutesToTime(totalMinutes) {
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Formats 24h time string into concise 12-hour format (e.g. "14:00" -> "2 PM", "14:30" -> "2:30 PM")
 * @param {string} time24 
 * @returns {string}
 */
export function formatConciseTime(time24) {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const hour12 = h % 12 || 12;
  const period = h < 12 ? 'AM' : 'PM';
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Formats start and end into a combined friendly range (e.g. "14:00", "16:00" -> "2–4 PM")
 * @param {string} start 
 * @param {string} end 
 * @returns {string}
 */
export function formatConciseRange(start, end) {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  const start12 = sh % 12 || 12;
  const end12 = eh % 12 || 12;
  const startPeriod = sh < 12 ? 'AM' : 'PM';
  const endPeriod = eh < 12 ? 'AM' : 'PM';

  const startFormatted = sm === 0 ? `${start12}` : `${start12}:${sm.toString().padStart(2, '0')}`;
  const endFormatted = em === 0 ? `${end12}` : `${end12}:${em.toString().padStart(2, '0')}`;

  if (startPeriod === endPeriod) {
    return `${startFormatted}–${endFormatted} ${endPeriod}`;
  }
  return `${startFormatted} ${startPeriod}–${endFormatted} ${endPeriod}`;
}

/**
 * Checks whether an array of ranges for a given day has overlaps or invalid ranges
 * @param {Array<{start: string, end: string}>} ranges 
 * @returns {{ hasError: boolean, error?: string }}
 */
export function validateDayRanges(ranges) {
  if (!ranges || ranges.length === 0) return { hasError: false };

  for (let i = 0; i < ranges.length; i++) {
    const { start, end } = ranges[i];
    if (!start || !end) {
      return { hasError: true, error: 'Start and end time required.' };
    }
    const startM = timeToMinutes(start);
    const endM = timeToMinutes(end);
    if (endM <= startM) {
      return { hasError: true, error: `End time (${end}) must be after start time (${start}).` };
    }
  }

  // Check overlaps
  const sorted = [...ranges].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start));
  for (let i = 0; i < sorted.length - 1; i++) {
    const currentEnd = timeToMinutes(sorted[i].end);
    const nextStart = timeToMinutes(sorted[i + 1].start);
    if (currentEnd > nextStart) {
      return {
        hasError: true,
        error: `Overlapping ranges: ${sorted[i].start}–${sorted[i].end} overlaps with ${sorted[i + 1].start}–${sorted[i + 1].end}.`
      };
    }
  }

  return { hasError: false };
}

/**
 * Checks if range duration aligns with slot length
 * @param {string} start 
 * @param {string} end 
 * @param {number} slotMinutes 
 * @returns {boolean} true if aligned, false if uneven remainder
 */
export function isRangeAlignedToSlot(start, end, slotMinutes) {
  if (!start || !end || !slotMinutes) return true;
  const duration = timeToMinutes(end) - timeToMinutes(start);
  return duration % slotMinutes === 0;
}

/**
 * Checks if at least one day has configured hours
 * @param {Record<string, Array<{start: string, end: string}>>} weekly 
 * @returns {boolean}
 */
export function hasConfiguredHours(weekly) {
  if (!weekly) return false;
  return Object.values(weekly).some(ranges => Array.isArray(ranges) && ranges.length > 0);
}

/**
 * Generates live plain-language preview for the doctor Rep Schedule
 * @param {Object} schedule 
 * @returns {string} e.g. "Reps can book up to 3 visits on Mon, Wed, Fri between 2–4 PM, 20 min each."
 */
export function generatePlainLanguageSummary(schedule) {
  if (!schedule || !schedule.weekly || !hasConfiguredHours(schedule.weekly)) {
    return 'No visit hours configured yet. Add at least one day to enable bookings.';
  }

  const activeDays = DAYS_ORDER.filter(day => schedule.weekly[day] && schedule.weekly[day].length > 0);
  const dayNames = activeDays.map(day => DAY_LABELS[day]);

  let daysPhrase = '';
  if (dayNames.length === 1) {
    daysPhrase = dayNames[0];
  } else if (dayNames.length === 2) {
    daysPhrase = `${dayNames[0]} and ${dayNames[1]}`;
  } else if (dayNames.length === 7) {
    daysPhrase = 'Every day';
  } else {
    daysPhrase = dayNames.join(', ');
  }

  // Check if all active days share the exact same single time range
  const firstDayRanges = schedule.weekly[activeDays[0]];
  const allSameSingleRange = firstDayRanges.length === 1 && activeDays.every(day => {
    const r = schedule.weekly[day];
    return r.length === 1 && r[0].start === firstDayRanges[0].start && r[0].end === firstDayRanges[0].end;
  });

  const maxReps = Number(schedule.maxRepsPerDay);
  const visitsPhrase = maxReps > 0
    ? `up to ${maxReps} visit${maxReps === 1 ? '' : 's'}`
    : 'unlimited visits';

  const slotMinutes = schedule.slotMinutes || 20;

  if (allSameSingleRange) {
    const rangePhrase = formatConciseRange(firstDayRanges[0].start, firstDayRanges[0].end);
    return `Reps can book ${visitsPhrase} on ${daysPhrase} between ${rangePhrase}, ${slotMinutes} min each.`;
  }

  return `Reps can book ${visitsPhrase} across ${daysPhrase}, ${slotMinutes} min each.`;
}
