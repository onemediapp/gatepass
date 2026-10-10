/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { subscribeDoctorPendingAppointments, updateAppointment } from '../../lib/db/appointments';
import { approveAppointmentTransaction, declineAppointmentTransaction } from '../../lib/db/transactions';
import { subscribeDoctorRepRelations, setRepRelation } from '../../lib/db/repRelations';
import { subscribeDoctor } from '../../lib/db/doctors';
import { useAuth } from '../../lib/auth';
import { formatDateIST, formatSlotRange, parseSlotTimeToDate, todayDateStr } from '../../lib/time';
import { generateDateStrip, generateSlotsForDate } from '../../lib/slots';
import { 
  Check, 
  X, 
  Star, 
  Ban, 
  Clock, 
  Calendar, 
  Package, 
  AlertTriangle, 
  Sparkles, 
  MoreHorizontal, 
  ChevronRight,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  Coffee
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import SlotChip from '../../components/ui/SlotChip';
import { cn } from '../../lib/utils';

export default function DoctorPendingRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [relations, setRelations] = useState({});
  const [loading, setLoading] = useState(true);

  // Status/Feedback tracking
  const [slotFullMap, setSlotFullMap] = useState({}); // { [reqId]: 'SLOT_FULL'|'DAY_FULL' }
  const [processingReqId, setProcessingReqId] = useState(null);
  const [batchApproving, setBatchApproving] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState(null);

  // Decline Sheet State
  const [declineReq, setDeclineReq] = useState(null);
  const [declineReasonChip, setDeclineReasonChip] = useState('');
  const [declineCustomNote, setDeclineCustomNote] = useState('');

  // Reschedule / Offer Different Slot State
  const [offerReq, setOfferReq] = useState(null);
  const [offerSelectedDate, setOfferSelectedDate] = useState('');
  const [offerSelectedSlot, setOfferSelectedSlot] = useState(null);

  // Block confirmation modal
  const [blockConfirmReq, setBlockConfirmReq] = useState(null);

  // ── Subscriptions ───────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    // 1. Doctor Profile & Schedule
    const unsubDoc = subscribeDoctor(user.uid, (docData) => {
      setDoctor(docData);
    });

    // 2. Doctor Rep Relations (preferred/blocked/counts)
    const unsubRels = subscribeDoctorRepRelations(user.uid, (relList) => {
      const map = {};
      relList.forEach(r => { map[r.repId] = r; });
      setRelations(map);
    });

    // 3. Pending Appointments
    const unsubAppts = subscribeDoctorPendingAppointments(user.uid, (data) => {
      setRequests(data);
      setLoading(false);
    });

    return () => {
      unsubDoc();
      unsubRels();
      unsubAppts();
    };
  }, [user]);

  // ── Silent Block Sweep ──────────────────────────────────────────────
  // Requests from blocked reps are hidden and automatically declined in background
  useEffect(() => {
    if (!user || requests.length === 0 || Object.keys(relations).length === 0) return;

    requests.forEach(async (req) => {
      const rel = relations[req.repId];
      if (rel?.blocked) {
        try {
          // Silently decline without notification/reason
          await declineAppointmentTransaction({
            appointmentId: req.id,
            doctorId: user.uid,
            declineReason: ''
          });
        } catch {
          // Ignore background sweep errors
        }
      }
    });
  }, [user, requests, relations]);

  // Filter out blocked reps from pending queue
  const visibleRequests = useMemo(() => {
    return requests.filter(r => !relations[r.repId]?.blocked);
  }, [requests, relations]);

  // Count preferred reps in pending queue
  const preferredRequests = useMemo(() => {
    return visibleRequests.filter(r => relations[r.repId]?.preferred);
  }, [visibleRequests, relations]);

  const schedule = doctor?.repSchedule || {
    maxRepsPerSlot: 1,
    maxRepsPerDay: 3,
    slotMinutes: 20,
    advanceDays: 14,
    weekly: {}
  };

  // Toast Helper
  const showToast = (message) => {
    setFeedbackToast(message);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // ── 1-Tap Approve Handler ───────────────────────────────────────────
  const handleApprove = async (req) => {
    if (!user) return;
    setProcessingReqId(req.id);

    try {
      await approveAppointmentTransaction({
        appointmentId: req.id,
        doctorId: user.uid,
        maxRepsPerSlot: schedule.maxRepsPerSlot || 1,
        maxRepsPerDay: schedule.maxRepsPerDay || 3,
      });

      showToast(`Approved request for ${req.repSnapshot?.name || 'Representative'}`);
    } catch (err) {
      if (err.message === 'SLOT_FULL' || err.message === 'DAY_FULL') {
        setSlotFullMap(prev => ({ ...prev, [req.id]: err.message }));
      } else if (err.message === 'ALREADY_DECIDED') {
        showToast('This request was already decided.');
      } else {
        alert(err.message || 'Failed to approve request.');
      }
    } finally {
      setProcessingReqId(null);
    }
  };

  // ── Batch Approve All Preferred ─────────────────────────────────────
  const handleApproveAllPreferred = async () => {
    if (!user || preferredRequests.length === 0) return;
    setBatchApproving(true);

    let approvedCount = 0;
    let stoppedReason = '';

    for (const req of preferredRequests) {
      try {
        await approveAppointmentTransaction({
          appointmentId: req.id,
          doctorId: user.uid,
          maxRepsPerSlot: schedule.maxRepsPerSlot || 1,
          maxRepsPerDay: schedule.maxRepsPerDay || 3,
        });
        approvedCount++;
      } catch (err) {
        if (err.message === 'SLOT_FULL' || err.message === 'DAY_FULL') {
          stoppedReason = 'A slot or daily quota was reached.';
          setSlotFullMap(prev => ({ ...prev, [req.id]: err.message }));
          break;
        }
      }
    }

    setBatchApproving(false);
    showToast(`Approved ${approvedCount} preferred request${approvedCount !== 1 ? 's' : ''}. ${stoppedReason}`);
  };

  // ── Decline Handler ─────────────────────────────────────────────────
  const handleConfirmDecline = async () => {
    if (!declineReq || !user) return;
    setProcessingReqId(declineReq.id);

    const fullReason = [declineReasonChip, declineCustomNote].filter(Boolean).join(' - ');

    try {
      await declineAppointmentTransaction({
        appointmentId: declineReq.id,
        doctorId: user.uid,
        declineReason: fullReason
      });

      showToast(`Declined request`);
      setDeclineReq(null);
      setDeclineReasonChip('');
      setDeclineCustomNote('');
    } catch (err) {
      alert(err.message || 'Failed to decline request');
    } finally {
      setProcessingReqId(null);
    }
  };

  // ── Prefer Toggle ───────────────────────────────────────────────────
  const handleTogglePreferred = async (repId, currentPreferred) => {
    if (!user || !repId) return;
    try {
      await setRepRelation(user.uid, repId, { preferred: !currentPreferred });
      showToast(currentPreferred ? 'Removed from preferred reps' : 'Marked as Preferred Rep ⭐');
    } catch (err) {
      console.error('Error toggling preferred status:', err);
    }
  };

  // ── Block Confirm Handler ───────────────────────────────────────────
  const handleConfirmBlock = async () => {
    if (!blockConfirmReq || !user) return;
    const repId = blockConfirmReq.repId;
    try {
      await setRepRelation(user.uid, repId, { blocked: true, preferred: false });
      await declineAppointmentTransaction({
        appointmentId: blockConfirmReq.id,
        doctorId: user.uid,
        declineReason: ''
      });
      showToast(`Blocked representative`);
      setBlockConfirmReq(null);
    } catch (err) {
      alert(err.message || 'Failed to block rep');
    }
  };

  // ── Offer Different Slot Handler ────────────────────────────────────
  const handleConfirmOfferSlot = async () => {
    if (!offerReq || !offerSelectedDate || !offerSelectedSlot) return;
    setProcessingReqId(offerReq.id);

    const newKey = `${offerSelectedDate}_${offerSelectedSlot.slotStart}`;
    const newStartAt = parseSlotTimeToDate(offerSelectedDate, offerSelectedSlot.slotStart);
    const newEndAt = parseSlotTimeToDate(offerSelectedDate, offerSelectedSlot.slotEnd);

    try {
      await updateAppointment(offerReq.id, {
        slotDate: offerSelectedDate,
        slotStart: offerSelectedSlot.slotStart,
        slotEnd: offerSelectedSlot.slotEnd,
        slotKey: newKey,
        slotStartAt: newStartAt,
        slotEndAt: newEndAt,
      });

      showToast(`Offered new slot (${offerSelectedDate} ${offerSelectedSlot.slotStart}) to rep.`);
      setOfferReq(null);
      setOfferSelectedDate('');
      setOfferSelectedSlot(null);
    } catch (err) {
      alert(err.message || 'Failed to offer new slot');
    } finally {
      setProcessingReqId(null);
    }
  };

  // Offer slot picker date strip
  const dateStrip = useMemo(() => {
    if (!offerReq) return [];
    return generateDateStrip(schedule.advanceDays || 14);
  }, [offerReq, schedule.advanceDays]);

  const availableOfferSlots = useMemo(() => {
    if (!offerSelectedDate || !schedule) return [];
    return generateSlotsForDate({
      dateStr: offerSelectedDate,
      schedule,
      currentServerMs: Date.now(),
    });
  }, [offerSelectedDate, schedule]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-36 rounded-card" />
        <Skeleton className="w-full h-36 rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 font-sans selection:bg-amber-100 selection:text-sand-600">
      
      {/* ── Toast Notification ──────────────────────────────────────── */}
      {feedbackToast && (
        <div className="fixed top-4 right-4 z-50 bg-navy-900 text-white px-4 py-2.5 rounded-[0.875rem] shadow-card text-xs font-semibold animate-in fade-in slide-in-from-top-2 border border-white/10 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ── Top Header & Batch Action ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Pending Requests</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            {visibleRequests.length} representative request{visibleRequests.length !== 1 ? 's' : ''} awaiting review
          </p>
        </div>

        {preferredRequests.length > 0 && (
          <button
            disabled={batchApproving}
            onClick={handleApproveAllPreferred}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-[0.875rem] text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {batchApproving
                ? 'Approving…'
                : `Approve all preferred (${preferredRequests.length})`}
            </span>
          </button>
        )}
      </div>

      {/* ── Empty State ─────────────────────────────────────────────── */}
      {visibleRequests.length === 0 ? (
        <div className="bg-white rounded-card p-12 text-center border border-line shadow-card max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-[1.25rem] bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-600/20">
            <Coffee className="w-8 h-8" />
          </div>
          <h2 className="text-base font-display font-bold text-ink mb-1">All Caught Up</h2>
          <p className="text-xs text-ink-soft max-w-xs mx-auto">
            You have no pending appointment requests. New requests will appear here in real time.
          </p>
        </div>
      ) : (
        /* ── Requests List ─────────────────────────────────────────── */
        <div className="space-y-4">
          {visibleRequests.map((req) => {
            const rel = relations[req.repId] || {};
            const isPreferred = Boolean(rel.preferred);
            const slotStatus = slotFullMap[req.id];
            const isProcessing = processingReqId === req.id;

            // Format date: "Tue 28 Oct"
            let dateLabel = req.slotDate;
            try {
              const d = parseSlotTimeToDate(req.slotDate, '12:00');
              dateLabel = formatDateIST(d, 'EEE dd MMM');
            } catch {
              dateLabel = req.slotDate;
            }

            const timeLabel = formatSlotRange(req.slotStart, req.slotEnd);
            const repSnapshot = req.repSnapshot || {};

            return (
              <EdgeCard
                key={req.id}
                edge={isPreferred ? 'amber' : 'navy'}
                className="p-5 transition-all hover:shadow-md"
              >
                {/* ── Card Header: Rep Name & Slot ──────────────────── */}
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-display font-bold text-ink truncate">
                        {repSnapshot.name || 'Representative'}
                      </h2>
                      {isPreferred && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-100 text-amber-500 rounded-full text-[0.625rem] font-bold">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Preferred
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-ink-soft mt-0.5 truncate">
                      {repSnapshot.company || 'Pharma'} {repSnapshot.designation ? `· ${repSnapshot.designation}` : ''}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-ink">{dateLabel}</p>
                    <p className="text-[0.6875rem] font-mono text-ink-mute font-medium">{timeLabel}</p>
                  </div>
                </div>

                {/* ── Category & Product Focus ──────────────────────── */}
                <div className="my-3 bg-cream-50 p-3 rounded-[0.875rem] border border-line space-y-1.5">
                  <div className="flex items-center gap-2">
                    {req.therapeuticCategory && (
                      <span className="px-2 py-0.5 rounded-[0.5rem] bg-navy-100 text-navy-900 text-[0.625rem] font-mono font-semibold">
                        {req.therapeuticCategory}
                      </span>
                    )}
                    {req.samplesFlag && (
                      <span className="inline-flex items-center gap-1 text-[0.625rem] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-[0.5rem]">
                        <Package className="w-3 h-3" /> Samples
                      </span>
                    )}
                  </div>

                  {req.productFocus && (
                    <p className="text-xs text-ink font-medium">
                      "{req.productFocus}"
                    </p>
                  )}

                  {req.message && (
                    <p className="text-[0.6875rem] text-ink-soft italic pt-1 border-t border-line/60">
                      Note: {req.message}
                    </p>
                  )}
                </div>

                {/* ── History & Metrics Badges ──────────────────────── */}
                <div className="flex flex-wrap items-center gap-2 py-2 text-[0.6875rem] text-ink-soft border-b border-line mb-3">
                  <span className="inline-flex items-center gap-1 bg-cream-50 px-2 py-0.5 rounded-[0.5rem] border border-line">
                    🏆 {rel.metCount || 0} visits
                  </span>

                  {(rel.noShowCount || 0) > 0 && (
                    <span className="inline-flex items-center gap-1 bg-coral-50 text-coral-600 px-2 py-0.5 rounded-[0.5rem] border border-coral-600/20 font-semibold">
                      <AlertTriangle className="w-3 h-3" /> {rel.noShowCount} no-show
                    </span>
                  )}

                  {rel.notes && (
                    <span className="text-ink-mute truncate max-w-xs italic">
                      Private: "{rel.notes}"
                    </span>
                  )}
                </div>

                {/* ── Action CTAs Row ───────────────────────────────── */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  
                  {/* Left: Star & Block quick buttons */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePreferred(req.repId, isPreferred)}
                      className={cn(
                        'p-2 rounded-[0.75rem] transition-colors',
                        isPreferred ? 'text-amber-500 bg-amber-100 hover:bg-amber-200' : 'text-ink-mute hover:bg-cream-50 hover:text-ink'
                      )}
                      title={isPreferred ? 'Remove preferred' : 'Mark preferred'}
                    >
                      <Star className={cn('w-4 h-4', isPreferred ? 'fill-amber-500' : '')} />
                    </button>

                    <button
                      onClick={() => setBlockConfirmReq(req)}
                      className="p-2 text-ink-mute hover:text-coral-600 hover:bg-coral-50 rounded-[0.75rem] transition-colors"
                      title="Silent block representative"
                    >
                      <Ban className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        setOfferReq(req);
                        setOfferSelectedDate(req.slotDate);
                      }}
                      className="px-2.5 py-1.5 text-[0.6875rem] text-ink-soft hover:text-ink hover:bg-cream-50 rounded-[0.625rem] font-medium transition-colors"
                    >
                      Offer another slot
                    </button>
                  </div>

                  {/* Right: Decline & Approve CTAs */}
                  <div className="flex items-center gap-2">
                    <button
                      disabled={isProcessing}
                      onClick={() => setDeclineReq(req)}
                      className="px-3 py-2 bg-cream-50 hover:bg-coral-50 text-coral-600 border border-line rounded-[0.75rem] text-xs font-semibold transition-colors"
                    >
                      Decline
                    </button>

                    {slotStatus ? (
                      <button
                        onClick={() => {
                          setOfferReq(req);
                          setOfferSelectedDate(req.slotDate);
                        }}
                        className="px-4 py-2 bg-sand-50 border border-sand-600/30 text-sand-600 rounded-[0.75rem] text-xs font-bold hover:bg-sand-100 transition-colors"
                      >
                        Slot full — offer another
                      </button>
                    ) : (
                      <button
                        disabled={isProcessing}
                        onClick={() => handleApprove(req)}
                        className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-[0.75rem] text-xs font-bold shadow-sm transition-all"
                      >
                        {isProcessing ? 'Approving…' : 'Approve this slot'}
                      </button>
                    )}
                  </div>
                </div>
              </EdgeCard>
            );
          })}
        </div>
      )}

      {/* ── Decline Sheet / Modal ─────────────────────────────────────── */}
      {declineReq && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-sm w-full space-y-4 shadow-card border border-line animate-in fade-in zoom-in-95">
            <h3 className="text-base font-display font-bold text-ink">Decline Request</h3>
            <p className="text-xs text-ink-soft">
              Decline visit from {declineReq.repSnapshot?.name || 'rep'} for {declineReq.slotDate}.
            </p>

            {/* Quick Reason Chips */}
            <div className="space-y-1.5">
              <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute">
                Reason (Optional)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Slot taken',
                  'Not needed this month',
                  'Not accepting this category',
                  'Emergency clinic duty'
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDeclineReasonChip(declineReasonChip === chip ? '' : chip)}
                    className={cn(
                      'px-2.5 py-1 rounded-full text-xs transition-colors',
                      declineReasonChip === chip
                        ? 'bg-navy-900 text-white font-semibold'
                        : 'bg-cream-50 text-ink-soft hover:bg-line'
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Free text note */}
            <div>
              <textarea
                value={declineCustomNote}
                onChange={(e) => setDeclineCustomNote(e.target.value)}
                placeholder="Optional personal message to representative…"
                rows={2}
                maxLength={200}
                className="w-full text-xs p-2.5 rounded-[0.75rem] border border-line focus:outline-none focus:ring-1 focus:ring-navy-900 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setDeclineReq(null)}
                className="py-2.5 bg-cream-50 text-ink rounded-[0.875rem] text-xs font-semibold hover:bg-line"
              >
                Back
              </button>
              <button
                onClick={handleConfirmDecline}
                className="py-2.5 bg-coral-600 text-white rounded-[0.875rem] text-xs font-semibold hover:bg-coral-700"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Block Confirmation Modal ──────────────────────────────────── */}
      {blockConfirmReq && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-sm w-full space-y-4 shadow-card border border-line text-center animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-coral-50 text-coral-600 flex items-center justify-center mx-auto">
              <Ban className="w-6 h-6" />
            </div>
            <h3 className="text-base font-display font-bold text-ink">
              Silently Block Representative?
            </h3>
            <p className="text-xs text-ink-soft text-left">
              Future booking requests from <strong>{blockConfirmReq.repSnapshot?.name}</strong> will be hidden and silently declined. The representative will not be notified of the block.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setBlockConfirmReq(null)}
                className="py-2.5 bg-cream-50 text-ink rounded-[0.875rem] text-xs font-semibold hover:bg-line"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBlock}
                className="py-2.5 bg-coral-600 text-white rounded-[0.875rem] text-xs font-semibold hover:bg-coral-700"
              >
                Block Rep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Offer A Different Slot Modal ──────────────────────────────── */}
      {offerReq && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-lg w-full space-y-4 shadow-card border border-line animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <h3 className="text-base font-display font-bold text-ink">Offer A Different Slot</h3>
                <p className="text-xs text-ink-soft">
                  Selecting a new slot will update the request and notify {offerReq.repSnapshot?.name}.
                </p>
              </div>
              <button
                onClick={() => setOfferReq(null)}
                className="p-1 text-ink-mute hover:text-ink rounded-[0.5rem]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 14-Day Date Strip */}
            <div>
              <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block mb-1">
                Select Date
              </label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {dateStrip.map((day) => (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => {
                      setOfferSelectedDate(day.dateStr);
                      setOfferSelectedSlot(null);
                    }}
                    className={cn(
                      'flex flex-col items-center justify-center p-2 min-w-[3.75rem] rounded-[0.75rem] border text-xs transition-all shrink-0',
                      offerSelectedDate === day.dateStr
                        ? 'bg-navy-900 text-white border-navy-900 font-bold shadow-sm'
                        : 'bg-white text-ink border-line hover:bg-cream-50'
                    )}
                  >
                    <span className="text-[0.625rem] font-mono uppercase">{day.weekday}</span>
                    <span className="text-sm font-bold">{day.dayNum}</span>
                    <span className="text-[0.5625rem] text-ink-mute">{day.monthStr}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Available Slots Grid */}
            {offerSelectedDate && (
              <div className="space-y-2">
                <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block">
                  Available Slots for {offerSelectedDate}
                </label>

                {availableOfferSlots.length === 0 ? (
                  <p className="text-xs text-ink-mute py-4 text-center">
                    No open hours configured for this day.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableOfferSlots.map((slot) => {
                      const isSelected = offerSelectedSlot?.slotStart === slot.slotStart;
                      return (
                        <button
                          key={slot.slotStart}
                          type="button"
                          onClick={() => setOfferSelectedSlot(slot)}
                          className={cn(
                            'p-2.5 rounded-[0.75rem] border text-xs font-mono font-semibold transition-all text-center',
                            isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                              : 'bg-white text-ink border-line hover:bg-cream-50'
                          )}
                        >
                          {slot.slotStart}–{slot.slotEnd}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-line">
              <button
                onClick={() => setOfferReq(null)}
                className="py-2.5 bg-cream-50 text-ink rounded-[0.875rem] text-xs font-semibold hover:bg-line"
              >
                Cancel
              </button>
              <button
                disabled={!offerSelectedDate || !offerSelectedSlot}
                onClick={handleConfirmOfferSlot}
                className="py-2.5 bg-navy-900 text-white rounded-[0.875rem] text-xs font-semibold hover:bg-navy-700 disabled:opacity-50"
              >
                Offer This Slot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
