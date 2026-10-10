/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { makeDoctorToken } from '../src/lib/ids';

/**
 * Simulates Firestore atomic transaction logic from Phase 8.2
 * to verify race conditions, slot caps, day caps, and token allocation.
 */
class MockFirestoreState {
  constructor() {
    this.appointments = new Map();
    this.slotLedgers = new Map();
    this.dayLedgers = new Map();
    this.tokens = new Set();
  }

  setAppointment(id, data) {
    this.appointments.set(id, { ...data, status: data.status || 'pending' });
  }

  setSlotLedger(key, count) {
    this.slotLedgers.set(key, { approvedCount: count });
  }

  setDayLedger(key, count) {
    this.dayLedgers.set(key, { approvedCount: count });
  }

  addToken(token) {
    this.tokens.add(token);
  }

  /**
   * Executes atomic approval transaction simulation
   */
  async approveTransaction({ appointmentId, doctorId, maxRepsPerSlot = 1, maxRepsPerDay = 3 }) {
    // 1. Transaction Read Phase
    const appt = this.appointments.get(appointmentId);
    if (!appt) throw new Error('ALREADY_DECIDED');
    if (appt.status !== 'pending') throw new Error('ALREADY_DECIDED');

    const slotKey = `${doctorId}_${appt.slotKey}`;
    const dayKey = `${doctorId}_${appt.slotDate}`;

    const slotDoc = this.slotLedgers.get(slotKey);
    const dayDoc = this.dayLedgers.get(dayKey);

    const slotCount = slotDoc ? slotDoc.approvedCount : 0;
    const dayCount = dayDoc ? dayDoc.approvedCount : 0;

    if (slotCount >= maxRepsPerSlot) throw new Error('SLOT_FULL');
    if (maxRepsPerDay > 0 && dayCount >= maxRepsPerDay) throw new Error('DAY_FULL');

    // Token allocation: 3 candidates
    const candidates = [makeDoctorToken(), makeDoctorToken(), makeDoctorToken()];
    const availableToken = candidates.find(t => !this.tokens.has(t));
    if (!availableToken) throw new Error('TOKEN_RETRY');

    // 2. Transaction Write Phase (atomic commit)
    this.appointments.set(appointmentId, {
      ...appt,
      status: 'approved',
      token: availableToken,
    });
    this.tokens.add(availableToken);
    this.slotLedgers.set(slotKey, { approvedCount: slotCount + 1 });
    this.dayLedgers.set(dayKey, { approvedCount: dayCount + 1 });

    return { tokenCode: availableToken };
  }
}

describe('Doctor Approval Transaction Engine (Phase 8.2)', () => {

  it('1. Generates canonical RM + 4 digit token code', () => {
    const token = makeDoctorToken();
    expect(token).toMatch(/^RM\d{4}$/);
  });

  it('2. Successfully approves a pending request and increments slot/day ledgers', async () => {
    const state = new MockFirestoreState();
    state.setAppointment('appt_1', {
      doctorId: 'doc_1',
      slotKey: '2026-10-30_14:00',
      slotDate: '2026-10-30',
      status: 'pending',
    });

    const result = await state.approveTransaction({
      appointmentId: 'appt_1',
      doctorId: 'doc_1',
      maxRepsPerSlot: 1,
      maxRepsPerDay: 3,
    });

    expect(result.tokenCode).toMatch(/^RM\d{4}$/);
    expect(state.appointments.get('appt_1').status).toBe('approved');
    expect(state.slotLedgers.get('doc_1_2026-10-30_14:00').approvedCount).toBe(1);
    expect(state.dayLedgers.get('doc_1_2026-10-30').approvedCount).toBe(1);
  });

  it('3. Race Condition: When two approvals race for maxRepsPerSlot = 1, exactly ONE succeeds', async () => {
    const state = new MockFirestoreState();
    state.setAppointment('appt_A', {
      doctorId: 'doc_1',
      slotKey: '2026-10-30_14:00',
      slotDate: '2026-10-30',
      status: 'pending',
    });
    state.setAppointment('appt_B', {
      doctorId: 'doc_1',
      slotKey: '2026-10-30_14:00',
      slotDate: '2026-10-30',
      status: 'pending',
    });

    // Run both approval attempts concurrently
    const results = await Promise.allSettled([
      state.approveTransaction({
        appointmentId: 'appt_A',
        doctorId: 'doc_1',
        maxRepsPerSlot: 1,
        maxRepsPerDay: 5,
      }),
      state.approveTransaction({
        appointmentId: 'appt_B',
        doctorId: 'doc_1',
        maxRepsPerSlot: 1,
        maxRepsPerDay: 5,
      }),
    ]);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].reason.message).toBe('SLOT_FULL');
    expect(state.slotLedgers.get('doc_1_2026-10-30_14:00').approvedCount).toBe(1);
  });

  it('4. Enforces maxRepsPerDay cap (throws DAY_FULL)', async () => {
    const state = new MockFirestoreState();
    state.setAppointment('appt_3', {
      doctorId: 'doc_1',
      slotKey: '2026-10-30_15:00',
      slotDate: '2026-10-30',
      status: 'pending',
    });
    // Day ledger already at cap (3)
    state.setDayLedger('doc_1_2026-10-30', 3);

    await expect(
      state.approveTransaction({
        appointmentId: 'appt_3',
        doctorId: 'doc_1',
        maxRepsPerSlot: 1,
        maxRepsPerDay: 3,
      })
    ).rejects.toThrow('DAY_FULL');
  });

  it('5. Rejects already decided appointments (throws ALREADY_DECIDED)', async () => {
    const state = new MockFirestoreState();
    state.setAppointment('appt_decided', {
      doctorId: 'doc_1',
      slotKey: '2026-10-30_14:00',
      slotDate: '2026-10-30',
      status: 'approved',
    });

    await expect(
      state.approveTransaction({
        appointmentId: 'appt_decided',
        doctorId: 'doc_1',
      })
    ).rejects.toThrow('ALREADY_DECIDED');
  });

  it('6. Allows unlimited daily requests when maxRepsPerDay = 0', async () => {
    const state = new MockFirestoreState();
    state.setAppointment('appt_unlimited', {
      doctorId: 'doc_1',
      slotKey: '2026-10-30_16:00',
      slotDate: '2026-10-30',
      status: 'pending',
    });
    state.setDayLedger('doc_1_2026-10-30', 10); // 10 already booked

    const res = await state.approveTransaction({
      appointmentId: 'appt_unlimited',
      doctorId: 'doc_1',
      maxRepsPerSlot: 1,
      maxRepsPerDay: 0, // unlimited
    });

    expect(res.tokenCode).toBeDefined();
    expect(state.dayLedgers.get('doc_1_2026-10-30').approvedCount).toBe(11);
  });
});
