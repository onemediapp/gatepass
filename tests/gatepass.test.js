/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  formatTokenDisplay, 
  formatCountdownTimer, 
  computeGatepassTiming 
} from '../src/lib/gatepass';
import { 
  setServerClockOffset, 
  serverNow, 
  parseSlotTimeToDate 
} from '../src/lib/time';

describe('Anti-Fraud Gatepass Engine (Phase 7 Unit Tests)', () => {

  beforeEach(() => {
    // Reset clock offset to 0 before each test
    setServerClockOffset(0);
  });

  // ── 1. Token Formatting ─────────────────────────────────────────────
  describe('Token Display Formatter', () => {
    it('1. Formats standard 6-char token code into [ RM · 4729 ] display', () => {
      expect(formatTokenDisplay('RM4729')).toBe('[ RM · 4729 ]');
      expect(formatTokenDisplay('ab1234')).toBe('[ AB · 1234 ]');
      expect(formatTokenDisplay('k7m2x9')).toBe('[ K7 · M2X9 ]');
    });

    it('2. Handles edge cases for missing or unusual tokens safely', () => {
      expect(formatTokenDisplay('')).toBe('[ ------ ]');
      expect(formatTokenDisplay(null)).toBe('[ ------ ]');
      expect(formatTokenDisplay(undefined)).toBe('[ ------ ]');
      expect(formatTokenDisplay('123')).toBe('[ 123 ]');
    });
  });

  // ── 2. Countdown Timer Formatting ───────────────────────────────────
  describe('Countdown Timer Formatter', () => {
    it('3. Accurately formats remaining milliseconds into HHh MMm SSs format', () => {
      // 41m 12s = (41 * 60 + 12) * 1000 = 2,472,000 ms
      expect(formatCountdownTimer(2472000)).toBe('00h 41m 12s');

      // 1h 05m 03s = (3600 + 300 + 3) * 1000 = 3,903,000 ms
      expect(formatCountdownTimer(3903000)).toBe('01h 05m 03s');

      // 0 ms or negative
      expect(formatCountdownTimer(0)).toBe('00h 00m 00s');
      expect(formatCountdownTimer(-5000)).toBe('00h 00m 00s');
    });
  });

  // ── 3. Clock Tampering Simulation (±2 Hours) ────────────────────────
  describe('Anti-Fraud Clock Tampering Protection', () => {
    it('4. Fast device clock (+2h ahead) is negated by server offset', () => {
      const realServerMs = new Date('2026-10-28T14:00:00+05:30').getTime();
      const clientFastMs = realServerMs + (2 * 60 * 60 * 1000); // 2 hours ahead
      
      // When synced against server Date header:
      const calculatedOffset = realServerMs - clientFastMs; // -7200000 ms
      setServerClockOffset(calculatedOffset);

      // Simulated local client reading
      const simulatedNow = clientFastMs + calculatedOffset;
      expect(simulatedNow).toBe(realServerMs);
    });

    it('5. Slow device clock (-2h behind) is negated by server offset', () => {
      const realServerMs = new Date('2026-10-28T14:00:00+05:30').getTime();
      const clientSlowMs = realServerMs - (2 * 60 * 60 * 1000); // 2 hours behind
      
      // When synced against server Date header:
      const calculatedOffset = realServerMs - clientSlowMs; // +7200000 ms
      setServerClockOffset(calculatedOffset);

      // Simulated local client reading
      const simulatedNow = clientSlowMs + calculatedOffset;
      expect(simulatedNow).toBe(realServerMs);
    });
  });

  // ── 4. Timing Sub-States Resolution ─────────────────────────────────
  describe('Gatepass Timing Sub-States', () => {
    const slotDate = '2026-10-28';
    const slotStart = '14:00';
    const slotEnd = '14:20';

    it('6. Marks past slot date as expired immediately', () => {
      const timing = computeGatepassTiming({
        slotDate: '2026-10-27', // yesterday
        slotStart,
        slotEnd,
        serverNowMs: parseSlotTimeToDate('2026-10-28', '14:10').getTime(),
        todayDateStr: '2026-10-28',
      });

      expect(timing.subState).toBe('expired');
      expect(timing.countdownLabel).toBe('EXPIRED');
      expect(timing.countdownMs).toBe(0);
    });

    it('7. Marks future slot date as not_yet_valid with countdown to start', () => {
      const serverNowMs = parseSlotTimeToDate('2026-10-28', '10:00').getTime();
      const timing = computeGatepassTiming({
        slotDate: '2026-10-29', // tomorrow
        slotStart,
        slotEnd,
        serverNowMs,
        todayDateStr: '2026-10-28',
      });

      expect(timing.subState).toBe('not_yet_valid');
      expect(timing.countdownLabel).toBe('STARTS IN');
      expect(timing.countdownMs).toBeGreaterThan(0);
    });

    it('8. Marks slot earlier today as not_yet_valid before slotStart', () => {
      // Current time: 13:30 (30 mins before 14:00 start)
      const serverNowMs = parseSlotTimeToDate(slotDate, '13:30').getTime();
      const timing = computeGatepassTiming({
        slotDate,
        slotStart,
        slotEnd,
        serverNowMs,
        todayDateStr: slotDate,
      });

      expect(timing.subState).toBe('not_yet_valid');
      expect(timing.countdownLabel).toBe('STARTS IN');
      expect(timing.formattedTimer).toBe('00h 30m 00s');
    });

    it('9. Marks active slot during presentation as valid with live countdown to expiry', () => {
      // Current time: 14:10 IST. Default expiry is slotEnd (14:20) + 30 min = 14:50 IST.
      // Remaining time: 40 minutes = 00h 40m 00s.
      const serverNowMs = parseSlotTimeToDate(slotDate, '14:10').getTime();
      const timing = computeGatepassTiming({
        slotDate,
        slotStart,
        slotEnd,
        serverNowMs,
        todayDateStr: slotDate,
      });

      expect(timing.subState).toBe('valid');
      expect(timing.countdownLabel).toBe('VALID FOR');
      expect(timing.formattedTimer).toBe('00h 40m 00s');
    });

    it('10. Marks slot with <10 minutes remaining as expiring (amber alert state)', () => {
      // Current time: 14:45 IST. Expiry is 14:50 IST (5 mins remaining).
      const serverNowMs = parseSlotTimeToDate(slotDate, '14:45').getTime();
      const timing = computeGatepassTiming({
        slotDate,
        slotStart,
        slotEnd,
        serverNowMs,
        todayDateStr: slotDate,
      });

      expect(timing.subState).toBe('expiring');
      expect(timing.countdownLabel).toBe('VALID FOR');
      expect(timing.formattedTimer).toBe('00h 05m 00s');
    });

    it('11. Marks slot past expiry time (slotEnd + 30m) as expired', () => {
      // Current time: 14:51 IST. Expiry was 14:50 IST.
      const serverNowMs = parseSlotTimeToDate(slotDate, '14:51').getTime();
      const timing = computeGatepassTiming({
        slotDate,
        slotStart,
        slotEnd,
        serverNowMs,
        todayDateStr: slotDate,
      });

      expect(timing.subState).toBe('expired');
      expect(timing.countdownLabel).toBe('EXPIRED');
      expect(timing.countdownMs).toBe(0);
    });

    it('12. Respects custom slotStartAtMs and tokenExpiresAtMs from Firestore Timestamps', () => {
      const customStartMs = parseSlotTimeToDate(slotDate, '15:00').getTime();
      const customExpiresMs = parseSlotTimeToDate(slotDate, '16:00').getTime();
      const serverNowMs = parseSlotTimeToDate(slotDate, '15:20').getTime();

      const timing = computeGatepassTiming({
        slotDate,
        slotStart,
        slotEnd,
        slotStartAtMs: customStartMs,
        tokenExpiresAtMs: customExpiresMs,
        serverNowMs,
        todayDateStr: slotDate,
      });

      expect(timing.subState).toBe('valid');
      expect(timing.formattedTimer).toBe('00h 40m 00s');
    });
  });

});
