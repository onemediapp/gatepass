/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { generateCompanyKey } from '../src/lib/companyKey';
import { getISOWeekString } from '../src/lib/time';
import { generateSlotsForDate, slotTimeToEpochMs } from '../src/lib/slots';
import { makeDoctorToken } from '../src/lib/ids';

describe('GATEPASS v2.1 Core Utilities & Slot Engine Tests', () => {

  describe('1. Company Key Truncated SHA-256 Hashing', () => {
    it('generates a 12-character hex string', async () => {
      const key = await generateCompanyKey('Sun Pharma');
      expect(key).toBeTypeOf('string');
      expect(key).toHaveLength(12);
      expect(/^[0-9a-f]{12}$/.test(key)).toBe(true);
    });

    it('is case-insensitive and trims punctuation / spaces consistently', async () => {
      const key1 = await generateCompanyKey('Sun Pharma');
      const key2 = await generateCompanyKey('  sun pharma  ');
      const key3 = await generateCompanyKey('SUN PHARMA');
      const key4 = await generateCompanyKey('Sun Pharma!');

      expect(key1).toBe(key2);
      expect(key1).toBe(key3);
      expect(key1).toBe(key4);
    });

    it('produces distinct hash prefixes for distinct companies', async () => {
      const sunKey = await generateCompanyKey('Sun Pharma');
      const ciplaKey = await generateCompanyKey('Cipla');
      const drReddyKey = await generateCompanyKey('Dr. Reddy\'s Laboratories');

      expect(sunKey).not.toBe(ciplaKey);
      expect(sunKey).not.toBe(drReddyKey);
      expect(ciplaKey).not.toBe(drReddyKey);
    });

    it('returns default_corp for empty or missing input', async () => {
      const emptyKey = await generateCompanyKey('');
      const nullKey = await generateCompanyKey(null);
      expect(emptyKey).toBe('default_corp');
      expect(nullKey).toBe('default_corp');
    });
  });

  describe('2. ISO Week String Generation', () => {
    it('correctly calculates ISO week string in YYYY-Www format', () => {
      // 2026-10-30 is week 44 of 2026
      const week1 = getISOWeekString('2026-10-30');
      expect(week1).toBe('2026-W44');

      // 2026-01-05 is week 2 of 2026
      const week2 = getISOWeekString('2026-01-05');
      expect(week2).toBe('2026-W02');
    });
  });

  describe('3. 3-Layer Slot Resolution Engine', () => {
    const baseSchedule = {
      slotMinutes: 20,
      advanceDays: 14,
      weekly: {
        mon: [{ start: '14:00', end: '16:00', priorityOnly: false, categories: [] }],
        tue: [],
        wed: [{ start: '14:00', end: '16:00', priorityOnly: false, categories: [] }],
        thu: [],
        fri: [{ start: '14:00', end: '16:00', priorityOnly: false, categories: [] }],
        sat: [],
        sun: []
      },
      blockedDates: ['2026-10-31'],
      dateOverrides: {}
    };

    it('Layer 1: Generates standard slots from weekly template', () => {
      // 2026-10-30 is Friday
      const slots = generateSlotsForDate({
        dateStr: '2026-10-30',
        schedule: baseSchedule,
        currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00')
      });

      expect(slots).toHaveLength(6);
      expect(slots[0].slotStart).toBe('14:00');
      expect(slots[5].slotEnd).toBe('16:00');
    });

    it('Layer 2: Date override with closed: true completely closes the day', () => {
      const scheduleWithOverride = {
        ...baseSchedule,
        dateOverrides: {
          '2026-10-30': { closed: true, note: 'Attending medical conference' }
        }
      };

      const slots = generateSlotsForDate({
        dateStr: '2026-10-30',
        schedule: scheduleWithOverride,
        currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00')
      });

      expect(slots).toEqual([]);
    });

    it('Layer 2: Date override with custom ranges overrides weekly template', () => {
      const scheduleWithOverride = {
        ...baseSchedule,
        dateOverrides: {
          '2026-10-30': {
            ranges: [{ start: '10:00', end: '11:00' }] // 3 20-min slots in morning
          }
        }
      };

      const slots = generateSlotsForDate({
        dateStr: '2026-10-30',
        schedule: scheduleWithOverride,
        currentServerMs: slotTimeToEpochMs('2026-10-30', '08:00')
      });

      expect(slots).toHaveLength(3);
      expect(slots[0].slotStart).toBe('10:00');
      expect(slots[2].slotEnd).toBe('11:00');
    });

    it('Layer 3: Blocked dates return empty slots array', () => {
      const slots = generateSlotsForDate({
        dateStr: '2026-10-31',
        schedule: baseSchedule,
        currentServerMs: slotTimeToEpochMs('2026-10-31', '10:00')
      });

      expect(slots).toEqual([]);
    });
  });

  describe('4. Multi-Ledger Quotas & Limit Enforcement', () => {
    const testSchedule = {
      slotMinutes: 20,
      advanceDays: 14,
      weekly: {
        fri: [{ start: '14:00', end: '16:00', priorityOnly: false, categories: [] }]
      }
    };

    it('enforces Day Limit (refusalLabel: "Day full")', () => {
      const slots = generateSlotsForDate({
        dateStr: '2026-10-30',
        schedule: testSchedule,
        limits: { maxRepsPerDay: 2 },
        dayLedgers: {
          '2026-10-30': { approvedCount: 2 }
        },
        currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00')
      });

      expect(slots).toHaveLength(6);
      expect(slots.every(s => s.state === 'full' && s.refusalLabel === 'Day full')).toBe(true);
    });

    it('enforces Week Limit (refusalLabel: "Week full")', () => {
      const isoWeek = getISOWeekString('2026-10-30'); // '2026-W44'
      const slots = generateSlotsForDate({
        dateStr: '2026-10-30',
        schedule: testSchedule,
        limits: { maxRepsPerDay: 5, maxRepsPerWeek: 4 },
        weekLedgers: {
          [isoWeek]: { approvedCount: 4 }
        },
        currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00')
      });

      expect(slots).toHaveLength(6);
      expect(slots.every(s => s.state === 'full' && s.refusalLabel === 'Week full')).toBe(true);
    });

    it('enforces Company Limit (refusalLabel: "Your company already booked")', async () => {
      const companyKey = await generateCompanyKey('Sun Pharma');
      const slots = generateSlotsForDate({
        dateStr: '2026-10-30',
        schedule: testSchedule,
        limits: { maxRepsPerDay: 5, maxPerCompanyPerDay: 1 },
        repCompanyKey: companyKey,
        dayLedgers: {
          '2026-10-30': {
            approvedCount: 1,
            companies: {
              [companyKey]: 1
            }
          }
        },
        currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00')
      });

      expect(slots).toHaveLength(6);
      expect(slots.every(s => s.state === 'full' && s.refusalLabel === 'Your company already booked')).toBe(true);
    });

    it('enforces Minimum Lead Time (refusalLabel: "Too soon to book")', () => {
      // 14:00 slot, current time is 13:00, min lead time is 120 minutes (requires booking before 12:00)
      const slots = generateSlotsForDate({
        dateStr: '2026-10-30',
        schedule: testSchedule,
        limits: { minLeadMinutes: 120 },
        currentServerMs: slotTimeToEpochMs('2026-10-30', '13:00')
      });

      expect(slots[0].state === 'full').toBe(true);
      expect(slots[0].refusalLabel).toBe('Too soon to book');
    });

    it('enforces Priority Only slots for non-preferred reps', () => {
      const prioritySchedule = {
        slotMinutes: 20,
        weekly: {
          fri: [{ start: '14:00', end: '15:00', priorityOnly: true }]
        }
      };

      const regularRepSlots = generateSlotsForDate({
        dateStr: '2026-10-30',
        schedule: prioritySchedule,
        isRepPreferred: false,
        currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00')
      });
      expect(regularRepSlots[0].state).toBe('priority');
      expect(regularRepSlots[0].refusalLabel).toBe('Priority');

      const preferredRepSlots = generateSlotsForDate({
        dateStr: '2026-10-30',
        schedule: prioritySchedule,
        isRepPreferred: true,
        currentServerMs: slotTimeToEpochMs('2026-10-30', '10:00')
      });
      expect(preferredRepSlots[0].state).toBe('available');
    });
  });

  describe('5. Multi-Ledger Atomic Transactions & Reschedule Swap Simulation', () => {
    class MockMultiLedgerState {
      constructor() {
        this.appointments = new Map();
        this.slotLedgers = new Map();
        this.dayLedgers = new Map();
        this.weekLedgers = new Map();
        this.tokens = new Set();
      }

      setAppointment(id, data) {
        this.appointments.set(id, { ...data, status: data.status || 'pending' });
      }

      setSlotLedger(key, count) {
        this.slotLedgers.set(key, { approvedCount: count });
      }

      setDayLedger(key, count, companies = {}) {
        this.dayLedgers.set(key, { approvedCount: count, companies });
      }

      setWeekLedger(key, count) {
        this.weekLedgers.set(key, { approvedCount: count });
      }

      async approveAppointment({ appointmentId, doctorId, limits = {} }) {
        const appt = this.appointments.get(appointmentId);
        if (!appt || appt.status !== 'pending') throw new Error('ALREADY_DECIDED');

        const slotKey = `${doctorId}_${appt.slotKey}`;
        const dayKey = `${doctorId}_${appt.slotDate}`;
        const isoWeek = getISOWeekString(appt.slotDate);
        const weekKey = `${doctorId}_${isoWeek}`;
        const companyKey = appt.companyKey || '';

        const slotCount = this.slotLedgers.get(slotKey)?.approvedCount || 0;
        const dayEntry = this.dayLedgers.get(dayKey) || { approvedCount: 0, companies: {} };
        const weekCount = this.weekLedgers.get(weekKey)?.approvedCount || 0;
        const companyCount = companyKey ? (dayEntry.companies[companyKey] || 0) : 0;

        if (slotCount >= (limits.maxRepsPerSlot || 1)) throw new Error('SLOT_FULL');
        if (limits.maxRepsPerDay > 0 && dayEntry.approvedCount >= limits.maxRepsPerDay) throw new Error('DAY_FULL');
        if (limits.maxRepsPerWeek > 0 && weekCount >= limits.maxRepsPerWeek) throw new Error('WEEK_FULL');
        if (limits.maxPerCompanyPerDay > 0 && companyCount >= limits.maxPerCompanyPerDay) throw new Error('COMPANY_FULL');

        let isSameDayReschedule = false;
        let isSameWeekReschedule = false;

        // Handle atomic reschedule of previous appointment
        if (appt.rescheduleOf) {
          const oldAppt = this.appointments.get(appt.rescheduleOf);
          if (oldAppt && oldAppt.status === 'approved') {
            const oldSlotKey = `${doctorId}_${oldAppt.slotKey}`;
            const oldIsoWeek = getISOWeekString(oldAppt.slotDate);
            isSameDayReschedule = (oldAppt.slotDate === appt.slotDate);
            isSameWeekReschedule = (oldIsoWeek === isoWeek);

            // Decrement old slot ledger
            const curOldSlot = this.slotLedgers.get(oldSlotKey)?.approvedCount || 0;
            if (curOldSlot > 0) this.slotLedgers.set(oldSlotKey, { approvedCount: curOldSlot - 1 });

            // Decrement old day ledger if different day
            if (!isSameDayReschedule) {
              const oldDayKey = `${doctorId}_${oldAppt.slotDate}`;
              const curOldDay = this.dayLedgers.get(oldDayKey) || { approvedCount: 0, companies: {} };
              const updatedCompanies = { ...(curOldDay.companies || {}) };
              const oldCompanyKey = oldAppt.companyKey || '';
              if (oldCompanyKey && (updatedCompanies[oldCompanyKey] || 0) > 0) {
                updatedCompanies[oldCompanyKey] -= 1;
              }
              this.dayLedgers.set(oldDayKey, {
                approvedCount: Math.max(0, curOldDay.approvedCount - 1),
                companies: updatedCompanies
              });
            }

            // Decrement old week ledger if different week
            if (!isSameWeekReschedule) {
              const oldWeekKey = `${doctorId}_${oldIsoWeek}`;
              const curOldWeek = this.weekLedgers.get(oldWeekKey)?.approvedCount || 0;
              if (curOldWeek > 0) this.weekLedgers.set(oldWeekKey, { approvedCount: curOldWeek - 1 });
            }

            // Mark old appointment cancelled by reschedule
            this.appointments.set(appt.rescheduleOf, {
              ...oldAppt,
              status: 'cancelled',
              cancelledBy: 'rep',
              cancelReason: 'rescheduled',
              rescheduledTo: appointmentId
            });
          }
        }

        // Increment new slot ledger
        this.slotLedgers.set(slotKey, { approvedCount: slotCount + 1 });

        // Update new day ledger
        const newCompanies = { ...(dayEntry.companies || {}) };
        if (companyKey) {
          newCompanies[companyKey] = isSameDayReschedule ? companyCount : (companyCount + 1);
        }
        this.dayLedgers.set(dayKey, {
          approvedCount: isSameDayReschedule ? dayEntry.approvedCount : (dayEntry.approvedCount + 1),
          companies: newCompanies
        });

        // Update new week ledger
        this.weekLedgers.set(weekKey, {
          approvedCount: isSameWeekReschedule ? weekCount : (weekCount + 1)
        });

        const token = makeDoctorToken();
        this.appointments.set(appointmentId, {
          ...appt,
          status: 'approved',
          token
        });

        return { token };
      }
    }

    it('rejects approval when week limit is reached (WEEK_FULL)', async () => {
      const state = new MockMultiLedgerState();
      state.setAppointment('appt_1', {
        doctorId: 'dr_123',
        slotDate: '2026-10-30',
        slotKey: '2026-10-30_14:00',
        status: 'pending'
      });
      state.setWeekLedger(`dr_123_2026-W44`, 5); // 5 already approved

      await expect(
        state.approveAppointment({
          appointmentId: 'appt_1',
          doctorId: 'dr_123',
          limits: { maxRepsPerWeek: 5 }
        })
      ).rejects.toThrow('WEEK_FULL');
    });

    it('rejects approval when company daily limit is reached (COMPANY_FULL)', async () => {
      const state = new MockMultiLedgerState();
      const companyKey = await generateCompanyKey('Sun Pharma');
      state.setAppointment('appt_2', {
        doctorId: 'dr_123',
        slotDate: '2026-10-30',
        slotKey: '2026-10-30_14:00',
        companyKey,
        status: 'pending'
      });
      state.setDayLedger('dr_123_2026-10-30', 1, { [companyKey]: 1 });

      await expect(
        state.approveAppointment({
          appointmentId: 'appt_2',
          doctorId: 'dr_123',
          limits: { maxPerCompanyPerDay: 1 }
        })
      ).rejects.toThrow('COMPANY_FULL');
    });

    it('atomically cancels old appointment and adjusts ledgers when approving a reschedule', async () => {
      const state = new MockMultiLedgerState();
      const companyKey = await generateCompanyKey('Sun Pharma');

      // Old approved appointment on Monday
      state.setAppointment('old_appt', {
        doctorId: 'dr_123',
        slotDate: '2026-10-26',
        slotKey: '2026-10-26_14:00',
        companyKey,
        status: 'approved',
        token: 'D12'
      });
      state.setSlotLedger('dr_123_2026-10-26_14:00', 1);
      state.setDayLedger('dr_123_2026-10-26', 1, { [companyKey]: 1 });
      state.setWeekLedger('dr_123_2026-W44', 1);

      // New pending appointment on Friday rescheduling old_appt
      state.setAppointment('new_appt', {
        doctorId: 'dr_123',
        slotDate: '2026-10-30',
        slotKey: '2026-10-30_15:00',
        companyKey,
        status: 'pending',
        rescheduleOf: 'old_appt'
      });

      const res = await state.approveAppointment({
        appointmentId: 'new_appt',
        doctorId: 'dr_123',
        limits: { maxRepsPerSlot: 1, maxRepsPerDay: 3, maxRepsPerWeek: 5, maxPerCompanyPerDay: 1 }
      });

      expect(res.token).toBeDefined();

      // Old appointment must be marked cancelled
      const oldAppt = state.appointments.get('old_appt');
      expect(oldAppt.status).toBe('cancelled');
      expect(oldAppt.cancelReason).toBe('rescheduled');
      expect(oldAppt.rescheduledTo).toBe('new_appt');

      // Old slot ledger must be 0
      expect(state.slotLedgers.get('dr_123_2026-10-26_14:00').approvedCount).toBe(0);

      // Old day ledger count and company tally must be decremented
      const oldDay = state.dayLedgers.get('dr_123_2026-10-26');
      expect(oldDay.approvedCount).toBe(0);
      expect(oldDay.companies[companyKey]).toBe(0);

      // New slot ledger must be 1
      expect(state.slotLedgers.get('dr_123_2026-10-30_15:00').approvedCount).toBe(1);

      // New day ledger must be 1 and company tally 1
      const newDay = state.dayLedgers.get('dr_123_2026-10-30');
      expect(newDay.approvedCount).toBe(1);
      expect(newDay.companies[companyKey]).toBe(1);

      // Week ledger should remain 1 (since both Monday and Friday are in the same ISO week 2026-W44)
      expect(state.weekLedgers.get('dr_123_2026-W44').approvedCount).toBe(1);
    });
  });

});
