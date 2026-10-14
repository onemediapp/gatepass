/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { format, addDays } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { TIMEZONE, todayDateStr, getISOWeekString } from './time';
import { timeToMinutes, minutesToTime, DAY_LABELS } from './schedule';
import holidays from '../data/holidays.json';

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
  const isoLocal = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}T${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`;
  const utcDate = fromZonedTime(isoLocal, TIMEZONE);
  return utcDate.getTime();
}

/**
 * Generates slots for a specific single date using 3-layer schedule and limits
 * @param {Object} params
 * @returns {Array<Object>} list of Slot objects
 */
export function generateSlotsForDate({
  dateStr,
  schedule,
  limits = {},
  slotLedgers = {},
  dayLedgers = {},
  weekLedgers = {},
  currentServerMs = Date.now(),
  isRepPreferred = false,
  repCategory = '',
  repCompanyKey = '',
  repHasActiveToday = false,
  repHasOverlap = false,
  repVisitedRecently = false,
  repMonthlyCapReached = false,
  repPendingCapReached = false,
}) {
  if (!schedule || !dateStr) return [];

  // Layer 3 & 2: Check blocked dates, holidays, and date overrides closed status
  const isBlocked = Array.isArray(schedule.blockedDates) && schedule.blockedDates.includes(dateStr);
  const override = schedule.dateOverrides?.[dateStr];
  const isOverrideClosed = override?.closed === true;

  if (isBlocked || isOverrideClosed) {
    return [];
  }

  const [y, m, d] = dateStr.split('-').map(Number);
  const isoDate = `${y.toString().padStart(4, '0')}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}T12:00:00`;
  const istDate = toZonedTime(fromZonedTime(isoDate, TIMEZONE), TIMEZONE);
  const dayKey = DAY_INDEX_MAP[istDate.getDay()];

  // Layer 2 vs Layer 1: Specific date ranges override weekly template ranges
  let ranges = [];
  if (override?.ranges && Array.isArray(override.ranges) && override.ranges.length > 0) {
    ranges = override.ranges;
  } else if (schedule.weekly && Array.isArray(schedule.weekly[dayKey])) {
    ranges = schedule.weekly[dayKey];
  }

  if (!ranges || ranges.length === 0) {
    return [];
  }

  // Quotas and limits resolution
  const slotMinutes = Number(schedule.slotMinutes) || 20;
  const maxRepsPerSlot = Number(limits.maxRepsPerSlot ?? schedule.maxRepsPerSlot ?? 1);

  // Daily quota: dateOverrides.maxReps -> dayLimits[dayKey] -> limits.maxRepsPerDay -> schedule.maxRepsPerDay
  let maxRepsPerDay = 0;
  if (override?.maxReps !== undefined && override?.maxReps !== null) {
    maxRepsPerDay = Number(override.maxReps);
  } else if (limits.dayLimits && limits.dayLimits[dayKey] !== undefined && Number(limits.dayLimits[dayKey]) > 0) {
    maxRepsPerDay = Number(limits.dayLimits[dayKey]);
  } else if (limits.maxRepsPerDay !== undefined && limits.maxRepsPerDay !== null) {
    maxRepsPerDay = Number(limits.maxRepsPerDay);
  } else if (schedule.maxRepsPerDay !== undefined && schedule.maxRepsPerDay !== null) {
    maxRepsPerDay = Number(schedule.maxRepsPerDay);
  }

  const dayLedgerEntry = dayLedgers[dateStr];
  const dayApproved = typeof dayLedgerEntry === 'number' ? dayLedgerEntry : (dayLedgerEntry?.approvedCount || 0);
  const isDayFull = maxRepsPerDay > 0 && dayApproved >= maxRepsPerDay;

  // Weekly quota
  const maxRepsPerWeek = Number(limits.maxRepsPerWeek || 0);
  const isoWeek = getISOWeekString(dateStr);
  const weekLedgerEntry = weekLedgers[isoWeek];
  const weekApproved = typeof weekLedgerEntry === 'number' ? weekLedgerEntry : (weekLedgerEntry?.approvedCount || 0);
  const isWeekFull = maxRepsPerWeek > 0 && weekApproved >= maxRepsPerWeek;

  // Company quota per day
  const maxPerCompanyPerDay = Number(limits.maxPerCompanyPerDay ?? 1);
  const companyApproved = (repCompanyKey && dayLedgerEntry?.companies) 
    ? Number(dayLedgerEntry.companies[repCompanyKey] || 0) 
    : 0;
  const isCompanyFull = Boolean(repCompanyKey && maxPerCompanyPerDay > 0 && companyApproved >= maxPerCompanyPerDay);

  // Min lead time in minutes
  const minLeadMinutes = Number(limits.minLeadMinutes || 0);

  const categoryMode = schedule.categoryMode || 'soft';
  const slots = [];

  for (const range of ranges) {
    if (!range.start || !range.end) continue;
    const startMin = timeToMinutes(range.start);
    const endMin = timeToMinutes(range.end);
    if (endMin <= startMin) continue;

    // Check category matching
    const hasCategoryRestriction = Array.isArray(range.categories) && range.categories.length > 0;
    const categoryMatches = !hasCategoryRestriction || !repCategory || range.categories.includes(repCategory);
    if (hasCategoryRestriction && !categoryMatches && categoryMode === 'strict') {
      continue; // Strictly hide slot from non-matching categories
    }

    const isPriorityOnly = Boolean(range.priorityOnly);

    for (let current = startMin; current + slotMinutes <= endMin; current += slotMinutes) {
      const sStart = minutesToTime(current);
      const sEnd = minutesToTime(current + slotMinutes);
      const sKey = slotKey(dateStr, sStart);
      const slotStartAtMs = slotTimeToEpochMs(dateStr, sStart);

      const approvedCount = Number(slotLedgers[sKey]) || 0;

      let state = 'available';
      let reason = 'Available';

      if (slotStartAtMs < currentServerMs) {
        state = 'past';
        reason = 'Ended';
      } else if (minLeadMinutes > 0 && slotStartAtMs < (currentServerMs + minLeadMinutes * 60000)) {
        state = 'full';
        reason = 'Too soon to book';
      } else if (isWeekFull) {
        state = 'full';
        reason = 'Week full';
      } else if (isDayFull) {
        state = 'full';
        reason = 'Day full';
      } else if (isCompanyFull) {
        state = 'full';
        reason = 'Your company already booked';
      } else if (approvedCount >= maxRepsPerSlot) {
        state = 'full';
        reason = 'Slot full';
      } else if (isPriorityOnly && !isRepPreferred) {
        state = 'priority';
        reason = 'Priority';
      } else if (repHasActiveToday) {
        state = 'blocked';
        reason = 'Already requested today';
      } else if (repHasOverlap) {
        state = 'blocked';
        reason = 'Overlap with another visit';
      } else if (repVisitedRecently) {
        state = 'blocked';
        reason = 'Visited recently';
      } else if (repMonthlyCapReached) {
        state = 'blocked';
        reason = 'Monthly limit reached';
      } else if (repPendingCapReached) {
        state = 'blocked';
        reason = 'Pending limit reached';
      }

      slots.push({
        slotKey: sKey,
        slotDate: dateStr,
        slotStart: sStart,
        slotEnd: sEnd,
        slotStartAtMs,
        state,
        reason,
        refusalReason: reason !== 'Available' ? reason : '',
        refusalLabel: reason !== 'Available' ? reason : '',
        clinicId: range.clinicId || '',
        isPriorityOnly,
        categoryWarning: hasCategoryRestriction && !categoryMatches,
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
 * @returns {Array<Object>} list of DayStrip objects
 */
export function generateDateStrip({
  schedule,
  limits = {},
  slotLedgers = {},
  dayLedgers = {},
  weekLedgers = {},
  currentServerMs = Date.now(),
  startDateStr,
  advanceDays = 14,
  isRepPreferred = false,
  repCategory = '',
  repCompanyKey = '',
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

    // 1. Check if closed via override, holiday, or blocked list
    const isHoliday = holidays.some(h => h.dateStr === dateStr);
    const isBlocked = Array.isArray(schedule?.blockedDates) && schedule.blockedDates.includes(dateStr);
    const override = schedule?.dateOverrides?.[dateStr];
    const isClosed = isBlocked || override?.closed === true || isHoliday;

    if (isClosed) {
      const holidayName = holidays.find(h => h.dateStr === dateStr)?.name;
      const chipLabel = holidayName ? holidayName : (override?.note || 'Closed');
      result.push({
        dateStr,
        dayKey,
        dayLabel,
        dateNumber,
        monthLabel,
        state: 'closed',
        chipLabel,
        availableCount: 0,
        slots: [],
      });
      continue;
    }

    // 2. Are there ranges for this weekday / override?
    const ranges = (override?.ranges && override.ranges.length > 0)
      ? override.ranges 
      : (schedule?.weekly?.[dayKey] || []);

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
      limits,
      slotLedgers,
      dayLedgers,
      weekLedgers,
      currentServerMs,
      isRepPreferred,
      repCategory,
      repCompanyKey,
    });

    const availableSlots = slots.filter((s) => s.state === 'available');
    const fullSlots = slots.filter((s) => s.state === 'full');
    const prioritySlots = slots.filter((s) => s.state === 'priority');
    const pastSlots = slots.filter((s) => s.state === 'past');

    let dayState = 'available';
    let chipLabel = 'Available';

    if (availableSlots.length > 0) {
      dayState = 'available';
      chipLabel = `Available · ${availableSlots.length} left`;
    } else if (prioritySlots.length > 0 && availableSlots.length === 0) {
      dayState = 'priority';
      chipLabel = 'Priority only';
    } else if (fullSlots.length > 0) {
      dayState = 'full';
      chipLabel = fullSlots[0]?.reason || 'Full';
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
