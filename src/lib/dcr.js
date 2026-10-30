/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { formatDateIST, formatSlotRange } from './time';
import { formatTokenDisplay } from './gatepass';

/**
 * Builds structured Daily Call Report data for a specific date
 * @param {Array} appointments
 * @param {Object} repProfile
 * @param {string} selectedDateStr e.g. '2026-10-29'
 * @returns {Object} Structured DCR object
 */
export function buildDcrReportData({ appointments = [], repProfile = {}, userData = {}, selectedDateStr }) {
  const dateStr = selectedDateStr || new Date().toISOString().split('T')[0];
  
  // Filter appointments for the selected date
  const dayAppointments = appointments.filter(a => {
    return a.slotDate === dateStr || (a.preferredDate && a.preferredDate === dateStr);
  });

  // Sort chronologically by slotStart
  dayAppointments.sort((a, b) => (a.slotStart || '').localeCompare(b.slotStart || ''));

  let metCount = 0;
  let noShowCount = 0;
  let pendingCount = 0;
  let cancelledCount = 0;
  let samplesCount = 0;
  let accompaniedCount = 0;

  const calls = dayAppointments.map((appt, idx) => {
    const doctor = appt.doctorSnapshot || {};
    const rep = appt.repSnapshot || {};
    const isMet = appt.outcome === 'met' || appt.status === 'completed';
    const isNoShow = appt.outcome === 'no_show';
    const isCancelled = appt.status === 'cancelled';
    const isPending = appt.status === 'pending';

    if (isMet) metCount++;
    else if (isNoShow) noShowCount++;
    else if (isCancelled) cancelledCount++;
    else if (isPending) pendingCount++;

    if (appt.samplesFlag) samplesCount++;
    if (appt.accompaniedBy) accompaniedCount++;

    let accompanimentDisplay = 'Solo';
    if (appt.accompaniedBy) {
      if (typeof appt.accompaniedBy === 'object') {
        accompanimentDisplay = `${appt.accompaniedBy.name || 'Manager'} (${appt.accompaniedBy.designation || 'Area Manager'})`;
      } else {
        accompanimentDisplay = 'Area Manager';
      }
    }

    const timeRange = appt.slotStart && appt.slotEnd 
      ? formatSlotRange(appt.slotStart, appt.slotEnd)
      : (appt.slotStart || 'N/A');

    const calledInTime = appt.calledInAt?.toMillis 
      ? formatDateIST(new Date(appt.calledInAt.toMillis()), 'hh:mm a')
      : (appt.calledInAt ? formatDateIST(new Date(appt.calledInAt), 'hh:mm a') : '—');

    return {
      callIndex: idx + 1,
      appointmentId: appt.id,
      token: appt.token ? formatTokenDisplay(appt.token) : 'UNISSUED',
      doctorName: doctor.name ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`) : 'Doctor',
      specialty: doctor.specialty || 'General Physician',
      clinicName: doctor.clinicName || appt.clinicName || 'Clinic',
      city: doctor.city || userData?.city || 'Kurnool',
      slotWindow: timeRange,
      calledInTime,
      status: isMet ? 'COMPLETED (MET)' : isNoShow ? 'NO-SHOW' : isCancelled ? 'CANCELLED' : appt.status?.toUpperCase() || 'SCHEDULED',
      outcome: appt.outcome || (isMet ? 'met' : 'pending'),
      productsDetailed: appt.productFocus || rep.productFocus || 'Pharmaceutical Portfolio',
      therapeuticCategory: appt.therapeuticCategory || rep.therapeuticCategory || 'Therapeutics',
      samplesProvided: appt.samplesFlag ? 'YES (Starter Samples Delivered)' : 'NO',
      accompaniment: accompanimentDisplay,
      repNotes: appt.message || 'Standard detailing protocol observed',
      verifiedProtocol: Boolean(appt.token && (appt.repConfirmedAt || isMet))
    };
  });

  const totalCalls = dayAppointments.length;
  const strikeRate = totalCalls > 0 ? Math.round((metCount / totalCalls) * 100) : 0;

  return {
    date: dateStr,
    formattedDate: formatDateIST(dateStr, 'EEEE, dd MMMM yyyy'),
    repName: userData?.name || repProfile?.name || 'Medical Representative',
    repDesignation: repProfile?.designation || 'Professional Sales Representative',
    companyName: repProfile?.companyName || 'Pharmaceutical Healthcare',
    division: repProfile?.division || 'Core Division',
    headquarter: userData?.city || 'Kurnool (AP)',
    mobile: userData?.mobile || '',
    metrics: {
      totalCalls,
      metCount,
      noShowCount,
      pendingCount,
      cancelledCount,
      samplesCount,
      accompaniedCount,
      strikeRate
    },
    calls
  };
}

/**
 * Converts DCR data into a clean, RFC-4180 compliant CSV string
 * @param {Object} dcrData
 * @returns {string} CSV text
 */
export function generateDcrCsvString(dcrData) {
  const headers = [
    'Call #',
    'Date',
    'Gatepass Token',
    'Doctor Name',
    'Specialty',
    'Clinic / Hospital',
    'City / HQ',
    'Scheduled Window',
    'Time Called In',
    'Call Status',
    'Products Detailed',
    'Therapeutic Segment',
    'Samples Given',
    'Accompaniment',
    'Verification Protocol',
    'Notes / Remarks'
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = dcrData.calls.map(c => [
    escapeCsv(c.callIndex),
    escapeCsv(dcrData.date),
    escapeCsv(c.token),
    escapeCsv(c.doctorName),
    escapeCsv(c.specialty),
    escapeCsv(c.clinicName),
    escapeCsv(c.city),
    escapeCsv(c.slotWindow),
    escapeCsv(c.calledInTime),
    escapeCsv(c.status),
    escapeCsv(c.productsDetailed),
    escapeCsv(c.therapeuticCategory),
    escapeCsv(c.samplesProvided),
    escapeCsv(c.accompaniment),
    escapeCsv(c.verifiedProtocol ? 'VERIFIED (GP-AUTH-2026)' : 'PENDING'),
    escapeCsv(c.repNotes)
  ]);

  const metaHeader = [
    `# PHARMA DAILY CALL REPORT (DCR) - GATEPASS PROTOCOL`,
    `# Representative: ${dcrData.repName} (${dcrData.repDesignation})`,
    `# Company: ${dcrData.companyName} | Division: ${dcrData.division}`,
    `# Territory HQ: ${dcrData.headquarter} | Date: ${dcrData.formattedDate}`,
    `# Performance: ${dcrData.metrics.metCount}/${dcrData.metrics.totalCalls} Calls Completed (${dcrData.metrics.strikeRate}% Strike Rate)`,
    ''
  ].join('\r\n');

  const csvBody = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');

  return `${metaHeader}\r\n${csvBody}`;
}

/**
 * Triggers a browser download of the DCR CSV file
 * @param {Object} dcrData
 */
export function downloadDcrCsv(dcrData) {
  const csvContent = generateDcrCsvString(dcrData);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const sanitizedCompany = (dcrData.companyName || 'Pharma').replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `DCR_${sanitizedCompany}_${dcrData.date}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats a clean, executive WhatsApp message summary of the DCR
 * @param {Object} dcrData
 * @returns {string} Formatted WhatsApp text
 */
export function formatDcrWhatsAppText(dcrData) {
  const m = dcrData.metrics;
  let text = `📋 *DAILY CALL REPORT (DCR)*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n`;
  text += `👤 *Rep:* ${dcrData.repName} (${dcrData.repDesignation})\n`;
  text += `🏢 *Company:* ${dcrData.companyName} | *Div:* ${dcrData.division}\n`;
  text += `📍 *HQ:* ${dcrData.headquarter} | *Date:* ${dcrData.formattedDate}\n`;
  text += `📊 *Summary:* ${m.metCount}/${m.totalCalls} Calls Met (${m.strikeRate}%) · ${m.samplesCount} Samples\n`;
  text += `━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (dcrData.calls.length === 0) {
    text += `_No doctor visits logged on Gatepass for this date._\n`;
  } else {
    dcrData.calls.forEach((c) => {
      const statusIcon = c.outcome === 'met' ? '✅' : c.status.includes('CANCEL') ? '❌' : '⏳';
      text += `${statusIcon} *${c.doctorName}* (${c.specialty})\n`;
      text += `   🏥 ${c.clinicName} · Slot: ${c.slotWindow}\n`;
      text += `   🔑 Token: ${c.token} | In-Cabin: ${c.calledInTime}\n`;
      text += `   💊 *Detailed:* ${c.productsDetailed}\n`;
      if (c.accompaniment !== 'Solo') {
        text += `   👥 *Joint Visit:* ${c.accompaniment}\n`;
      }
      text += `\n`;
    });
  }

  text += `🔒 _Verified zero-wait detailing record powered by Gatepass protocol._`;
  return text;
}
