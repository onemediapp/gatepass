/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { 
  generateSlotsForDate, 
  generateDateStrip, 
  slotKey, 
  getDateRangeForAdvanceDays, 
  slotTimeToEpochMs 
} from '../src/lib/slots';

const MOCK_SCHEDULE = {
  slotMinutes: 20,
  maxRepsPerDay: 3,
  maxRepsPerSlot: 1,
  advanceDays: 14,
  weekly: {
    mon: [{ start: '14:00', end: '16:00' }],
    tue: [],
    wed: [{ start: '14:00', end: '16:00' }],
    thu: [],
    fri: [{ start: '14:00', end: '16:00' }],
    sat: [],
    sun: [],
  },
  blockedDates: ['2026-10-31'],
};

describe('Slot Generation Engine (Phase 6.2 Unit Tests)', () => {

  // Test 1: Standard slot generation
  it('1. Generates correct 20-min slots for a 2-hour window (6 slots)', () => {
    // 2026-10-30 is a Friday
    const slots = generateSlotsForDate({
      dateStr: '2026-10-30',
      schedule: MOCK_SCHEDULE,
      currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00'), // 10 AM IST (before 14:00)
    });

    expect(slots).toHaveLength(6);
    expect(slots[0].slotStart).toBe('14:00');
    expect(slots[0].slotEnd).toBe('14:20');
    expect(slots[0].slotKey).toBe('2026-10-30_14:00');
    expect(slots[5].slotStart).toBe('15:40');
    expect(slots[5].slotEnd).toBe('16:00');
    expect(slots.every(s => s.state === 'available')).toBe(true);
  });

  // Test 2: Blocked dates return empty
  it('2. Blocked dates return empty slots array', () => {
    const slots = generateSlotsForDate({
      dateStr: '2026-10-31', // in blockedDates
      schedule: MOCK_SCHEDULE,
      currentServerMs: slotTimeToEpochMs('2026-10-31', '10:00'),
    });

    expect(slots).toEqual([]);
  });

  // Test 3: Day without configured hours returns empty
  it('3. Day without configured weekly hours (e.g. Saturday) returns empty', () => {
    // 2026-11-07 is Saturday
    const slots = generateSlotsForDate({
      dateStr: '2026-11-07',
      schedule: MOCK_SCHEDULE,
      currentServerMs: slotTimeToEpochMs('2026-11-07', '10:00'),
    });

    expect(slots).toEqual([]);
  });

  // Test 4: Past-slot trimming based on currentServerMs
  it('4. Trims past slots when current time is midway through the day', () => {
    // Current time: 14:35 IST
    const nowMs = slotTimeToEpochMs('2026-10-30', '14:35');
    const slots = generateSlotsForDate({
      dateStr: '2026-10-30',
      schedule: MOCK_SCHEDULE,
      currentServerMs: nowMs,
    });

    // 14:00 and 14:20 should be 'past'; 14:40, 15:00, 15:20, 15:40 should be 'available'
    const pastSlots = slots.filter(s => s.state === 'past');
    const availableSlots = slots.filter(s => s.state === 'available');

    expect(pastSlots).toHaveLength(2);
    expect(pastSlots.map(s => s.slotStart)).toEqual(['14:00', '14:20']);
    expect(availableSlots).toHaveLength(4);
    expect(availableSlots.map(s => s.slotStart)).toEqual(['14:40', '15:00', '15:20', '15:40']);
  });

  // Test 5: Full slot when approvedCount >= maxRepsPerSlot
  it('5. Marks individual slot as full when approvedCount reaches maxRepsPerSlot', () => {
    const slotLedgers = {
      '2026-10-30_14:20': 1,
    };

    const slots = generateSlotsForDate({
      dateStr: '2026-10-30',
      schedule: MOCK_SCHEDULE,
      slotLedgers,
      currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00'),
    });

    const targetSlot = slots.find(s => s.slotStart === '14:20');
    expect(targetSlot.state).toBe('full');
    expect(targetSlot.approvedCount).toBe(1);

    const otherSlots = slots.filter(s => s.slotStart !== '14:20');
    expect(otherSlots.every(s => s.state === 'available')).toBe(true);
  });

  // Test 6: Full day when day quota reached
  it('6. Marks all slots as full when day quota (maxRepsPerDay) is reached', () => {
    const dayLedgers = {
      '2026-10-30': 3, // maxRepsPerDay is 3
    };

    const slots = generateSlotsForDate({
      dateStr: '2026-10-30',
      schedule: MOCK_SCHEDULE,
      dayLedgers,
      currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00'),
    });

    expect(slots.every(s => s.state === 'full')).toBe(true);
  });

  // Test 7: 0 = unlimited visits for day quota
  it('7. When maxRepsPerDay is 0 (unlimited), day is not full even with high approved count', () => {
    const scheduleUnlimited = {
      ...MOCK_SCHEDULE,
      maxRepsPerDay: 0,
    };

    const dayLedgers = {
      '2026-10-30': 10,
    };

    const slots = generateSlotsForDate({
      dateStr: '2026-10-30',
      schedule: scheduleUnlimited,
      dayLedgers,
      currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00'),
    });

    expect(slots.every(s => s.state === 'available')).toBe(true);
  });

  // Test 8: Multiple non-overlapping ranges on the same day
  it('8. Supports multiple time ranges on the same day', () => {
    const scheduleMultiRange = {
      ...MOCK_SCHEDULE,
      weekly: {
        ...MOCK_SCHEDULE.weekly,
        mon: [
          { start: '10:00', end: '11:00' }, // 3 slots of 20m
          { start: '15:00', end: '16:00' }, // 3 slots of 20m
        ],
      },
    };

    // 2026-11-02 is Monday
    const slots = generateSlotsForDate({
      dateStr: '2026-11-02',
      schedule: scheduleMultiRange,
      currentServerMs: slotTimeToEpochMs('2026-11-02', '08:00'),
    });

    expect(slots).toHaveLength(6);
    expect(slots.map(s => s.slotStart)).toEqual(['10:00', '10:20', '10:40', '15:00', '15:20', '15:40']);
  });

  // Test 9: Date strip marks blocked date as closed
  it('9. Date strip correctly assigns "closed" state and chip to blocked dates', () => {
    const strip = generateDateStrip({
      schedule: MOCK_SCHEDULE,
      startDateStr: '2026-10-30',
      advanceDays: 3,
      currentServerMs: slotTimeToEpochMs('2026-10-30', '08:00'),
    });

    expect(strip).toHaveLength(3);
    const blockedDay = strip.find(d => d.dateStr === '2026-10-31');
    expect(blockedDay).toBeDefined();
    expect(blockedDay.state).toBe('closed');
    expect(blockedDay.chipLabel).toBe('Closed');
  });

  // Test 10: Date strip calculates available slots count accurately
  it('10. Date strip reports accurate available slot count in chip label', () => {
    const strip = generateDateStrip({
      schedule: MOCK_SCHEDULE,
      startDateStr: '2026-10-30',
      advanceDays: 1,
      currentServerMs: slotTimeToEpochMs('2026-10-30', '08:00'),
    });

    expect(strip[0].state).toBe('available');
    expect(strip[0].availableCount).toBe(6);
    expect(strip[0].chipLabel).toBe('Available · 6 left');
  });

  // Test 11: Date range calculation helper
  it('11. getDateRangeForAdvanceDays computes exact 14-day window boundary', () => {
    const range = getDateRangeForAdvanceDays('2026-10-30', 14);
    expect(range.startDate).toBe('2026-10-30');
    expect(range.endDate).toBe('2026-11-12');
  });

  // Test 12: slotKey helper produces canonical key format
  it('12. slotKey produces canonical yyyy-MM-dd_HH:mm format', () => {
    expect(slotKey('2026-10-30', '14:20')).toBe('2026-10-30_14:20');
  });

});
