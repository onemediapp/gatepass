import { format, addMinutes, parseISO } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { Timestamp } from 'firebase/firestore';

export const TIMEZONE = 'Asia/Kolkata';

let clockOffsetMs = 0;

/**
 * Sets clock offset in milliseconds relative to server/NTP time
 * @param {number} offsetMs 
 */
export function setServerClockOffset(offsetMs) {
  clockOffsetMs = offsetMs || 0;
}

/**
 * Returns current timestamp in milliseconds, synchronized with server offset
 * @returns {number}
 */
export function serverNow() {
  return Date.now() + clockOffsetMs;
}

/**
 * Returns current JS Date adjusted for server offset
 * @returns {Date}
 */
export function serverNowDate() {
  return new Date(serverNow());
}

/**
 * Safely converts a Firestore Timestamp, Date, or string to JS Date
 * @param {any} val 
 * @returns {Date|null}
 */
export function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  if (typeof val.toDate === 'function') return val.toDate();
  if (typeof val.toMillis === 'function') return new Date(val.toMillis());
  if (typeof val === 'number') return new Date(val);
  if (typeof val === 'string') return parseISO(val);
  return null;
}

/**
 * Safely converts Date, Timestamp, or number to Firestore Timestamp
 * @param {any} val 
 * @returns {Timestamp}
 */
export function toTimestamp(val) {
  if (!val) return Timestamp.now();
  if (val instanceof Timestamp) return val;
  if (val instanceof Date) return Timestamp.fromDate(val);
  if (typeof val === 'number') return Timestamp.fromMillis(val);
  if (typeof val.toDate === 'function') return val;
  return Timestamp.fromDate(new Date(val));
}

/**
 * Returns current date and time zoned to Asia/Kolkata (IST)
 * @returns {Date}
 */
export function nowIST() {
  return toZonedTime(new Date(serverNow()), TIMEZONE);
}

/**
 * Returns current date string formatted as yyyy-MM-dd in IST
 * @returns {string} e.g. "2026-10-28"
 */
export function todayDateStr() {
  const istDate = toZonedTime(new Date(serverNow()), TIMEZONE);
  return format(istDate, 'yyyy-MM-dd');
}

/**
 * Formats a Date or Timestamp in IST
 * @param {any} val 
 * @param {string} formatPattern e.g. "dd MMM yyyy"
 * @returns {string}
 */
export function formatDateIST(val, formatPattern = 'dd MMM yyyy') {
  const d = toDate(val);
  if (!d) return '';
  const istDate = toZonedTime(d, TIMEZONE);
  return format(istDate, formatPattern);
}

/**
 * Formats time in IST
 * @param {any} val 
 * @param {string} formatPattern e.g. "hh:mm a"
 * @returns {string}
 */
export function formatTimeIST(val, formatPattern = 'hh:mm a') {
  const d = toDate(val);
  if (!d) return '';
  const istDate = toZonedTime(d, TIMEZONE);
  return format(istDate, formatPattern);
}

/**
 * Parses slot date string (yyyy-MM-dd) and time string (HH:mm) into a UTC Date representing that IST moment
 * @param {string} slotDate yyyy-MM-dd
 * @param {string} timeStr HH:mm
 * @returns {Date}
 */
export function parseSlotTimeToDate(slotDate, timeStr) {
  if (!slotDate || !timeStr) return new Date();
  const [year, month, day] = slotDate.split('-').map(Number);
  const [hours, minutes] = timeStr.split(':').map(Number);
  const localDate = new Date(year, month - 1, day, hours, minutes, 0);
  return fromZonedTime(localDate, TIMEZONE);
}

/**
 * Converts slot start and end to Firestore Timestamps
 * @param {string} slotDate yyyy-MM-dd
 * @param {string} slotStart HH:mm
 * @param {string} slotEnd HH:mm
 * @returns {{ slotStartAt: Timestamp, slotEndAt: Timestamp }}
 */
export function slotToTimestamps(slotDate, slotStart, slotEnd) {
  const startDate = parseSlotTimeToDate(slotDate, slotStart);
  const endDate = parseSlotTimeToDate(slotDate, slotEnd);
  return {
    slotStartAt: Timestamp.fromDate(startDate),
    slotEndAt: Timestamp.fromDate(endDate)
  };
}

/**
 * Generates token expiration timestamp: slotEndAt + 30 minutes
 * @param {string} slotDate yyyy-MM-dd
 * @param {string} slotEnd HH:mm
 * @param {number} extraMinutes 
 * @returns {Timestamp}
 */
export function tokenExpiryTimestamp(slotDate, slotEnd, extraMinutes = 30) {
  const endDate = parseSlotTimeToDate(slotDate, slotEnd);
  const expiryDate = addMinutes(endDate, extraMinutes);
  return Timestamp.fromDate(expiryDate);
}

/**
 * Determines whether a slot end has passed relative to current IST time
 * @param {string} slotDate yyyy-MM-dd
 * @param {string} slotEnd HH:mm
 * @returns {boolean}
 */
export function isPastSlot(slotDate, slotEnd) {
  if (!slotDate) return false;
  // If no slotEnd is given, check if date is strictly before today
  if (!slotEnd) {
    return slotDate < todayDateStr();
  }
  const endDate = parseSlotTimeToDate(slotDate, slotEnd);
  return endDate.getTime() < serverNow();
}

/**
 * Returns lowercase 3-letter weekday for a slot date or Date (mon, tue, wed, thu, fri, sat, sun)
 * @param {string|Date} dateOrStr 
 * @returns {'mon'|'tue'|'wed'|'thu'|'fri'|'sat'|'sun'}
 */
export function getDayOfWeekIST(dateOrStr) {
  let d;
  if (typeof dateOrStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateOrStr)) {
    d = parseSlotTimeToDate(dateOrStr, '12:00');
  } else {
    d = toDate(dateOrStr) || new Date();
  }
  const dayStr = format(toZonedTime(d, TIMEZONE), 'EEE').toLowerCase();
  return dayStr; // 'mon', 'tue', etc.
}

/**
 * Formats a 24-hr slot range into a human-readable string (e.g. "14:00", "14:20" -> "2:00 PM – 2:20 PM")
 * @param {string} slotStart 
 * @param {string} slotEnd 
 * @returns {string}
 */
export function formatSlotRange(slotStart, slotEnd) {
  if (!slotStart) return '';
  const dummyDate = '2026-01-01';
  const sDate = parseSlotTimeToDate(dummyDate, slotStart);
  const sFormatted = format(toZonedTime(sDate, TIMEZONE), 'h:mm a');
  if (!slotEnd) return sFormatted;
  const eDate = parseSlotTimeToDate(dummyDate, slotEnd);
  const eFormatted = format(toZonedTime(eDate, TIMEZONE), 'h:mm a');
  return `${sFormatted} – ${eFormatted}`;
}
