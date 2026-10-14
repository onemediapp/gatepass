import React, { useState } from 'react';
import { X, Calendar, Clock, AlertTriangle, CheckCircle, MapPin, Download, RefreshCw, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { generateIcsFileContent } from '../../lib/time';

export const CANCEL_REASONS = [
  'Plan changed',
  'Doctor unavailable',
  'Clash with another visit',
  'Unwell',
  'Other'
];

export default function ManageSheet({
  isOpen,
  onClose,
  appointment,
  doctor,
  clinic,
  isLateCancelWarning = false,
  onConfirmComing,
  onMarkArrived,
  onCancelVisit,
  onReschedule,
  actionLoading = false,
}) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState(CANCEL_REASONS[0]);

  if (!isOpen || !appointment) return null;

  const isApproved = appointment.status === 'approved';
  const isPending = appointment.status === 'pending';

  // Download .ics file helper
  const handleDownloadIcs = () => {
    const icsString = generateIcsFileContent({
      appointmentId: appointment.id,
      doctorName: doctor?.name || appointment.doctorSnapshot?.name || 'Doctor',
      clinicName: clinic?.clinicName || appointment.doctorSnapshot?.clinicName || 'Clinic',
      slotDate: appointment.slotDate,
      slotStart: appointment.slotStart,
      slotEnd: appointment.slotEnd,
      token: appointment.token || ''
    });

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gatepass-${appointment.slotDate}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirmCancel = () => {
    onCancelVisit(selectedCancelReason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-navy-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-white rounded-t-[1.75rem] sm:rounded-[1.75rem] p-6 shadow-2xl border border-line space-y-5 animate-in slide-in-from-bottom-6 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h3 className="font-display font-bold text-base text-ink">Manage Visit</h3>
            <p className="text-xs text-ink-soft">
              {appointment.slotDate} · {appointment.slotStart}–{appointment.slotEnd}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-100 text-ink-mute transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View 1: Main Actions */}
        {!showCancelConfirm ? (
          <div className="space-y-3">
            {/* 1. Confirm Attendance (Approved) */}
            {isApproved && (
              <button
                disabled={actionLoading || Boolean(appointment.repConfirmedAt)}
                onClick={onConfirmComing}
                className={cn(
                  'w-full p-3.5 rounded-[1rem] border text-left flex items-center justify-between transition-all',
                  appointment.repConfirmedAt
                    ? 'bg-teal-50 border-teal-200 text-teal-800'
                    : 'bg-white hover:bg-cream-50 border-line text-ink'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[0.75rem] bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">
                      {appointment.repConfirmedAt ? "I'm coming (Confirmed)" : "Confirm I'm coming"}
                    </h4>
                    <p className="text-[0.6875rem] text-ink-soft">
                      {appointment.repConfirmedAt ? 'Doctor notified' : 'Reduces no-shows and secures your slot'}
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* 2. Mark Arrived (Approved) */}
            {isApproved && (
              <button
                disabled={actionLoading || Boolean(appointment.arrivedAt)}
                onClick={onMarkArrived}
                className={cn(
                  'w-full p-3.5 rounded-[1rem] border text-left flex items-center justify-between transition-all',
                  appointment.arrivedAt
                    ? 'bg-navy-50 border-navy-200 text-navy-800'
                    : 'bg-white hover:bg-cream-50 border-line text-ink'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[0.75rem] bg-navy-100 text-navy-800 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">
                      {appointment.arrivedAt ? "Arrived at clinic (Reported)" : "I've arrived at clinic"}
                    </h4>
                    <p className="text-[0.6875rem] text-ink-soft">
                      {appointment.arrivedAt ? 'Reception desk informed' : 'Notifies doctor you are waiting in clinic'}
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* 3. Add to Calendar (.ics download) */}
            {isApproved && (
              <button
                onClick={handleDownloadIcs}
                className="w-full p-3.5 rounded-[1rem] border border-line bg-white hover:bg-cream-50 text-ink text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[0.75rem] bg-amber-100 text-sand-600 flex items-center justify-center shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">Add to Calendar (.ics)</h4>
                    <p className="text-[0.6875rem] text-ink-soft">
                      Add to Google, Apple, or Outlook calendar with reminder
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* 4. Reschedule Visit */}
            {(isApproved || isPending) && (
              <button
                onClick={onReschedule}
                className="w-full p-3.5 rounded-[1rem] border border-line bg-white hover:bg-cream-50 text-ink text-left flex items-center justify-between transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[0.75rem] bg-navy-50 text-navy-900 flex items-center justify-center shrink-0">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs">Reschedule Visit</h4>
                    <p className="text-[0.6875rem] text-ink-soft">
                      {isApproved ? 'Pick new slot (old slot stays valid until approved)' : 'Pick another open slot'}
                    </p>
                  </div>
                </div>
              </button>
            )}

            {/* 5. Cancel Visit */}
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full p-3.5 rounded-[1rem] border border-coral-200 bg-coral-50/50 hover:bg-coral-50 text-coral-700 text-left flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[0.75rem] bg-coral-100 text-coral-700 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs">
                    {isPending ? 'Cancel Request' : 'Cancel Visit'}
                  </h4>
                  <p className="text-[0.6875rem] text-coral-600">
                    {isPending ? 'Withdraw pending booking request' : 'Release slot and notify clinic'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        ) : (
          /* View 2: Cancellation Reason Confirmation */
          <div className="space-y-4 animate-in fade-in">
            {isLateCancelWarning && isApproved && (
              <div className="p-3 bg-coral-50 border border-coral-200 rounded-[0.875rem] flex items-start gap-2.5 text-coral-800 text-xs">
                <AlertTriangle className="w-4 h-4 text-coral-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Late Cancellation Warning</span>
                  <p className="text-[0.6875rem] leading-snug">
                    Cancelling within 60 minutes of the slot may affect your standing with Dr. {doctor?.name || 'the Doctor'}.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="text-[0.6875rem] font-mono uppercase tracking-wider text-ink-mute block mb-2">
                Reason for Cancellation
              </label>
              <div className="grid grid-cols-1 gap-2">
                {CANCEL_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedCancelReason(r)}
                    className={cn(
                      'p-2.5 rounded-[0.75rem] border text-xs font-semibold text-left transition-all',
                      selectedCancelReason === r
                        ? 'bg-navy-900 text-white border-navy-900'
                        : 'bg-cream-50 text-ink border-line hover:bg-white'
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-[0.875rem] border border-line text-xs font-semibold hover:bg-cream-50 text-ink"
              >
                Back
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 px-4 rounded-[0.875rem] bg-coral-600 hover:bg-coral-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {actionLoading ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
