/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { parseSlotTimeToDate } from './time';

/**
 * Formats a 6-character token code into the canonical display format: [ RM · 4729 ]
 * @param {string} token 
 * @returns {string}
 */
export function formatTokenDisplay(token) {
  if (!token) return '[ ------ ]';
  const clean = token.trim().toUpperCase();
  if (clean.length >= 6) {
    return `[ ${clean.slice(0, 2)} · ${clean.slice(2)} ]`;
  }
  return `[ ${clean} ]`;
}

/**
 * Formats a millisecond duration into HHh MMm SSs countdown string
 * @param {number} ms 
 * @returns {string}
 */
export function formatCountdownTimer(ms) {
  if (ms <= 0) return '00h 00m 00s';
  const totalSecs = Math.floor(ms / 1000);
  const hrs = Math.floor(totalSecs / 3600).toString().padStart(2, '0');
  const mins = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, '0');
  const secs = (totalSecs % 60).toString().padStart(2, '0');
  return `${hrs}h ${mins}m ${secs}s`;
}

/**
 * Pure function to compute Gatepass timing state and countdown
 * 
 * @param {Object} params
 * @param {string} params.slotDate yyyy-MM-dd
 * @param {string} params.slotStart HH:mm
 * @param {string} params.slotEnd HH:mm
 * @param {number} [params.slotStartAtMs]
 * @param {number} [params.tokenExpiresAtMs]
 * @param {number} params.serverNowMs
 * @param {string} params.todayDateStr yyyy-MM-dd
 * @returns {{
 *   subState: 'not_yet_valid'|'valid'|'expiring'|'expired',
 *   countdownLabel: 'VALID FOR'|'STARTS IN'|'EXPIRED',
 *   countdownMs: number,
 *   formattedTimer: string
 * }}
 */
export function computeGatepassTiming({
  slotDate,
  slotStart,
  slotEnd,
  slotStartAtMs,
  tokenExpiresAtMs,
  serverNowMs,
  todayDateStr,
}) {
  const isToday = slotDate === todayDateStr;

  let startAtMs = slotStartAtMs;
  if (!startAtMs && slotDate && slotStart) {
    startAtMs = parseSlotTimeToDate(slotDate, slotStart).getTime();
  }

  let expiresAtMs = tokenExpiresAtMs;
  if (!expiresAtMs && slotDate && slotEnd) {
    // Default expiration: slotEnd + 30 minutes
    expiresAtMs = parseSlotTimeToDate(slotDate, slotEnd).getTime() + (30 * 60 * 1000);
  }

  // 1. Date is strictly in the past
  if (!isToday && slotDate < todayDateStr) {
    return {
      subState: 'expired',
      countdownLabel: 'EXPIRED',
      countdownMs: 0,
      formattedTimer: '00h 00m 00s',
    };
  }

  // 2. Date is in the future
  if (!isToday && slotDate > todayDateStr) {
    const countdownMs = Math.max(0, (startAtMs || 0) - serverNowMs);
    return {
      subState: 'not_yet_valid',
      countdownLabel: 'STARTS IN',
      countdownMs,
      formattedTimer: formatCountdownTimer(countdownMs),
    };
  }

  // 3. Date is today, but before slot start time
  if (startAtMs && serverNowMs < startAtMs) {
    const countdownMs = Math.max(0, startAtMs - serverNowMs);
    return {
      subState: 'not_yet_valid',
      countdownLabel: 'STARTS IN',
      countdownMs,
      formattedTimer: formatCountdownTimer(countdownMs),
    };
  }

  // 4. Date is today, and past token expiration
  if (expiresAtMs && serverNowMs >= expiresAtMs) {
    return {
      subState: 'expired',
      countdownLabel: 'EXPIRED',
      countdownMs: 0,
      formattedTimer: '00h 00m 00s',
    };
  }

  // 5. Active: check whether expiring soon (<10 minutes)
  const remainingMs = Math.max(0, (expiresAtMs || 0) - serverNowMs);
  const isExpiring = remainingMs < 10 * 60 * 1000;

  return {
    subState: isExpiring ? 'expiring' : 'valid',
    countdownLabel: 'VALID FOR',
    countdownMs: remainingMs,
    formattedTimer: formatCountdownTimer(remainingMs),
  };
}
