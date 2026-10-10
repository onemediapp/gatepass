/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { format, addDays, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { TIMEZONE, todayDateStr } from './time';
import { timeToMinutes, minutesToTime, DAYS_ORDER, DAY_LABELS } from './schedule';

const DAY_INDEX_MAP = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/**
 * Creates unique slot key
 * @param {string} dateStr yyyy-MM-dd
 * @param {string} slotStart HH:mm
 * @returns {string} e.g. "2026-10-30_14:00"
 */
export function slotKey(dateStr, slotStart) {
  return `${dateStr}_${slotStart}`;
}

/**
 * Calculates start and end date strings for the advance window
 * @param {string} [startDateStr] yyyy-MM-dd
 * @param {number} [advanceDays] default 14
 * @returns {{ startDate: string, endDate: string }}
 */
export function getDateRangeForAdvanceDays(startDateStr, advanceDays = 14) {
  const start = startDateStr || todayDateStr();
  const [y, m, d] = start.split('-').map(Number);
  const baseDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const endDate = addDays(baseDate, Math.max(1, advanceDays) - 1);
  return {
    startDate: start,
    endDate: format(endDate, 'yyyy-MM-dd'),
  };
}

/**
 * Converts IST date string and HH:mm to UTC epoch milliseconds
 * @param {string} dateStr yyyy-MM-dd
 * @param {string} timeStr HH:mm
 * @returns {number} epoch ms
 */
export function slotTimeToEpochMs(dateStr, timeStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  // Construct plain local string representation and parse in IST
  const isoLocal = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}T${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
  const utcDate = fromZonedTime(isoLocal, TIMEZONE);
  return utcDate.getTime();
}

/**
 * Generates slots for a specific single date
 * @param {Object} params
 * @param {string} params.dateStr yyyy-MM-dd
 * @param {Object} params.schedule Doctor RepSchedule
 * @param {Record<string, number>} [params.slotLedgers] map of slotKey -> approvedCount
 * @param {Record<string, number>} [params.dayLedgers] map of dateStr -> approvedCount
 * @param {number} [params.currentServerMs] current timestamp in ms
 * @returns {Array<Object>} list of Slot objects
 */
export function generateSlotsForDate({
  dateStr,
  schedule,
  slotLedgers = {},
  dayLedgers = {},
  currentServerMs = Date.now(),
}) {
  if (!schedule || !schedule.weekly || !dateStr) return [];

  // Check blocked dates
  if (Array.isArray(schedule.blockedDates) && schedule.blockedDates.includes(dateStr)) {
    return [];
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  // Get weekday in IST
  const isoDate = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}T12:00:00`;
  const istDate = toZonedTime(fromZonedTime(isoDate, TIMEZONE), TIMEZONE);
  const dayKey = DAY_INDEX_MAP[istDate.getDay()];

  const ranges = schedule.weekly[dayKey] || [];
  if (!Array.isArray(ranges) || ranges.length === 0) {
    return [];
  }

  const slotMinutes = Number(schedule.slotMinutes) || 20;
  const maxRepsPerSlot = Number(schedule.maxRepsPerSlot) || 1;
  const maxRepsPerDay = Number(schedule.maxRepsPerDay) || 0;
  const dayApproved = Number(dayLedgers[dateStr]) || 0;
  const isDayFull = maxRepsPerDay > 0 && dayApproved >= maxRepsPerDay;

  const slots = [];

  for (const range of ranges) {
    if (!range.start || !range.end) continue;
    const startMin = timeToMinutes(range.start);
    const endMin = timeToMinutes(range.end);
    if (endMin <= startMin) continue;

    for (let current = startMin; current + slotMinutes <= endMin; current += slotMinutes) {
      const sStart = minutesToTime(current);
      const sEnd = minutesToTime(current + slotMinutes);
      const sKey = slotKey(dateStr, sStart);
      const slotStartAtMs = slotTimeToEpochMs(dateStr, sStart);

      const approvedCount = Number(slotLedgers[sKey]) || 0;

      let state = 'available';

      if (slotStartAtMs < currentServerMs) {
        state = 'past';
      } else if (isDayFull) {
        state = 'full';
      } else if (approvedCount >= maxRepsPerSlot) {
        state = 'full';
      }

      slots.push({
        slotKey: sKey,
        slotDate: dateStr,
        slotStart: sStart,
        slotEnd: sEnd,
        slotStartAtMs,
        state,
        approvedCount,
        maxCount: maxRepsPerSlot,
      });
    }
  }

  return slots;
}

/**
 * Generates the full 14-day date strip with day state, chip labels, and slot counts
 * @param {Object} params
 * @param {Object} params.schedule Doctor RepSchedule
 * @param {Record<string, number>} [params.slotLedgers] map of slotKey -> approvedCount
 * @param {Record<string, number>} [params.dayLedgers] map of dateStr -> approvedCount
 * @param {number} [params.currentServerMs] current timestamp in ms
 * @param {string} [params.startDateStr] start date in yyyy-MM-dd
 * @param {number} [params.advanceDays] number of days (default 14)
 * @returns {Array<Object>} list of DayStrip objects
 */
export function generateDateStrip({
  schedule,
  slotLedgers = {},
  dayLedgers = {},
  currentServerMs = Date.now(),
  startDateStr,
  advanceDays = 14,
}) {
  const startStr = startDateStr || todayDateStr();
  const daysCount = Math.max(1, Number(advanceDays) || schedule?.advanceDays || 14);

  const [startY, startM, startD] = startStr.split('-').map(Number);
  const baseDate = new Date(Date.UTC(startY, startM - 1, startD, 12, 0, 0));

  const result = [];

  for (let i = 0; i < daysCount; i++) {
    const currentTarget = addDays(baseDate, i);
    const dateStr = format(currentTarget, 'yyyy-MM-dd');
    const dayIndex = currentTarget.getUTCDay();
    const dayKey = DAY_INDEX_MAP[dayIndex];
    const dayLabel = DAY_LABELS[dayKey];
    const dateNumber = currentTarget.getUTCDate();
    const monthLabel = format(currentTarget, 'MMM');

    // 1. Is blocked date?
    const isBlocked = Array.isArray(schedule?.blockedDates) && schedule.blockedDates.includes(dateStr);
    if (isBlocked) {
      result.push({
        dateStr,
        dayKey,
        dayLabel,
        dateNumber,
        monthLabel,
        state: 'closed',
        chipLabel: 'Closed',
        availableCount: 0,
        slots: [],
      });
      continue;
    }

    // 2. Are there ranges for this weekday?
    const ranges = schedule?.weekly?.[dayKey] || [];
    if (!Array.isArray(ranges) || ranges.length === 0) {
      result.push({
        dateStr,
        dayKey,
        dayLabel,
        dateNumber,
        monthLabel,
        state: 'no_hours',
        chipLabel: 'No rep hours',
        availableCount: 0,
        slots: [],
      });
      continue;
    }

    // 3. Generate slots for this day
    const slots = generateSlotsForDate({
      dateStr,
      schedule,
      slotLedgers,
      dayLedgers,
      currentServerMs,
    });

    const availableSlots = slots.filter((s) => s.state === 'available');
    const fullSlots = slots.filter((s) => s.state === 'full');
    const pastSlots = slots.filter((s) => s.state === 'past');

    let dayState = 'available';
    let chipLabel = 'Available';

    if (availableSlots.length > 0) {
      dayState = 'available';
      chipLabel = `Available · ${availableSlots.length} left`;
    } else if (fullSlots.length > 0) {
      dayState = 'full';
      chipLabel = 'Full';
    } else if (pastSlots.length === slots.length && slots.length > 0) {
      dayState = 'past';
      chipLabel = 'Ended';
    } else {
      dayState = 'no_hours';
      chipLabel = 'No rep hours';
    }

    result.push({
      dateStr,
      dayKey,
      dayLabel,
      dateNumber,
      monthLabel,
      state: dayState,
      chipLabel,
      availableCount: availableSlots.length,
      slots,
    });
  }

  return result;
}
