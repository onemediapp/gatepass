/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  approveAppointmentTransaction, 
  declineAppointmentTransaction, 
  moveAppointmentTransaction 
} from './transactions';
import { updateAppointment } from './appointments';
import { getClinic, updateClinic } from './clinics';

/**
 * Gets or initializes staff delegation settings for a clinic
 * @param {string} clinicId 
 * @returns {Promise<Object>}
 */
export async function getClinicDelegationSettings(clinicId) {
  if (!clinicId) return null;
  const clinic = await getClinic(clinicId);
  if (!clinic) return null;

  return clinic.delegation || {
    enabled: true,
    pin: '2026', // Default clinic staff PIN
    staffName: 'Clinic Reception',
    allowApprovals: true,
    allowRescheduling: true,
    allowQueueCallIn: true,
    updatedAt: null
  };
}

/**
 * Updates staff delegation settings for a clinic (called by doctor/clinic owner)
 * @param {string} clinicId 
 * @param {Object} delegationUpdates 
 */
export async function updateClinicDelegationSettings(clinicId, delegationUpdates) {
  if (!clinicId) throw new Error('clinicId is required');
  const clinic = await getClinic(clinicId);
  if (!clinic) throw new Error('Clinic not found');

  const current = clinic.delegation || {};
  const updated = {
    ...current,
    ...delegationUpdates,
    updatedAt: serverTimestamp()
  };

  await updateClinic(clinicId, {
    delegation: updated
  });

  return updated;
}

/**
 * Verifies staff PIN against clinic delegation configuration
 * @param {string} clinicId 
 * @param {string} enteredPin 
 * @returns {Promise<{ valid: boolean, staffName: string }>}
 */
export async function verifyClinicStaffPin(clinicId, enteredPin) {
  if (!clinicId || !enteredPin) return { valid: false, staffName: '' };
  const settings = await getClinicDelegationSettings(clinicId);
  if (!settings || !settings.enabled) return { valid: false, staffName: '' };

  const cleanEntered = String(enteredPin).trim();
  const targetPin = String(settings.pin || '2026').trim();

  if (cleanEntered === targetPin) {
    return {
      valid: true,
      staffName: settings.staffName || 'Reception Staff'
    };
  }

  return { valid: false, staffName: '' };
}

/**
 * Delegated staff action: Approves appointment on behalf of doctor
 */
export async function approveAppointmentAsStaff({
  appointmentId,
  doctorId,
  staffName = 'Clinic Staff',
  clinicId
}) {
  if (!appointmentId || !doctorId) {
    throw new Error('Missing appointmentId or doctorId');
  }

  // Execute standard atomic approval transaction
  const result = await approveAppointmentTransaction({
    appointmentId,
    doctorId,
    maxRepsPerSlot: 1,
    maxRepsPerDay: 4,
    maxPerCompanyPerDay: 1
  });

  // Stamp delegated action
  await updateAppointment(appointmentId, {
    approvedByStaff: true,
    staffName,
    staffClinicId: clinicId || '',
    lastChangeAt: new Date(),
    lastChangeBy: 'staff'
  });

  return result;
}

/**
 * Delegated staff action: Moves / reschedules an appointment on behalf of doctor
 */
export async function moveAppointmentAsStaff({
  appointmentId,
  doctorId,
  newSlotDate,
  newSlotStart,
  newSlotEnd,
  staffName = 'Clinic Staff'
}) {
  const result = await moveAppointmentTransaction({
    appointmentId,
    doctorId,
    newSlotDate,
    newSlotStart,
    newSlotEnd
  });

  await updateAppointment(appointmentId, {
    movedByStaff: true,
    staffName,
    lastChangeAt: new Date(),
    lastChangeBy: 'staff'
  });

  return result;
}

/**
 * Delegated staff action: Declines appointment on behalf of doctor
 */
export async function declineAppointmentAsStaff({
  appointmentId,
  doctorId,
  declineReason = '',
  staffName = 'Clinic Staff'
}) {
  await declineAppointmentTransaction({
    appointmentId,
    doctorId,
    declineReason: declineReason ? `${declineReason} (Actioned by ${staffName})` : `Schedule full (Actioned by ${staffName})`
  });

  await updateAppointment(appointmentId, {
    declinedByStaff: true,
    staffName,
    lastChangeAt: new Date(),
    lastChangeBy: 'staff'
  });
}

/**
 * Delegated staff action: Marks representative as arrived at clinic reception
 */
export async function markRepArrivedAsStaff({ appointmentId, staffName = 'Clinic Reception' }) {
  if (!appointmentId) throw new Error('appointmentId is required');
  await updateAppointment(appointmentId, {
    arrivedAt: new Date(),
    arrivedCheckedBy: staffName,
    lastChangeAt: new Date(),
    lastChangeBy: 'staff'
  });
}

/**
 * Delegated staff action: Calls representative into doctor's consultation cabin
 */
export async function callRepInAsStaff({ appointmentId, staffName = 'Clinic Reception' }) {
  if (!appointmentId) throw new Error('appointmentId is required');
  await updateAppointment(appointmentId, {
    calledInAt: new Date(),
    calledInByStaff: staffName,
    lastChangeAt: new Date(),
    lastChangeBy: 'staff'
  });
}
