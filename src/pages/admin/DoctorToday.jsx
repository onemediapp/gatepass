/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { subscribeDoctorAppointmentsByDate, updateAppointment } from '../../lib/db/appointments';
import { recordRepOutcome, addRepRelationTag } from '../../lib/db/repRelations';
import { subscribeDoctor, updateDoctor } from '../../lib/db/doctors';
import { cancelAppointmentTransaction } from '../../lib/db/transactions';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { useAuth } from '../../lib/auth';
import { todayDateStr, formatSlotRange, parseSlotTimeToDate, serverNow } from '../../lib/time';
import { formatTokenDisplay } from '../../lib/gatepass';
import { 
  Calendar, 
  Clock, 
  Check, 
  X, 
  UserCheck, 
  UserX, 
  Coffee, 
  Tag, 
  Package, 
  CheckCircle2, 
  AlertCircle,
  BellRing,
  Share2,
  AlertTriangle,
  Pause,
  Play,
  Flame,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';
import { serverTimestamp } from 'firebase/firestore';

const POST_VISIT_TAGS = ['Useful discussion', 'Too long', 'Not relevant', 'Good samples'];

export default function DoctorToday() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [skippedMap, setSkippedMap] = useState({});
  const [appliedTagsMap, setAppliedTagsMap] = useState({});
  const [nowMs, setNowMs] = useState(serverNow());

  // Emergency cancellation state
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [cancelledEmergencyAppts, setCancelledEmergencyAppts] = useState([]);

  const todayStr = todayDateStr();

  // 5-second timer to update current time for slot evaluation
  useEffect(() => {
    const timer = setInterval(() => setNowMs(serverNow()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubDoc = subscribeDoctor(user.uid, (docData) => {
      setDoctor(docData);
    });

    const unsubAppts = subscribeDoctorAppointmentsByDate(user.uid, todayStr, (list) => {
      // Sort chronological by slotStart
      const sorted = [...list].sort((a, b) => (a.slotStart || '').localeCompare(b.slotStart || ''));
      setAppointments(sorted);
      setLoading(false);
    });

    return () => {
      unsubDoc();
      unsubAppts();
    };
  }, [user, todayStr]);

  // Doctor Today Status (delay / pause)
  const todayStatus = useMemo(() => {
    if (doctor?.todayStatus && doctor.todayStatus.date === todayStr) {
      return doctor.todayStatus;
    }
    return { date: todayStr, status: 'on_time', estimatedDelayMinutes: 0, note: '' };
  }, [doctor, todayStr]);

  const handleUpdateTodayStatus = async (status, delayMins = 0, note = '') => {
    if (!user) return;
    try {
      await updateDoctor(user.uid, {
        todayStatus: {
          date: todayStr,
          status,
          estimatedDelayMinutes: delayMins,
          note,
          updatedAt: new Date()
        }
      });
    } catch (err) {
      console.error('Failed to update today status:', err);
    }
  };

  // Handle Met / No-show outcomes
  const handleRecordOutcome = async (appt, outcome) => {
    if (!user || !appt.id) return;
    try {
      await updateAppointment(appt.id, {
        outcome,
        outcomeAt: serverTimestamp(),
      });

      if (appt.repId) {
        await recordRepOutcome(user.uid, appt.repId, outcome);
      }
    } catch (err) {
      console.error('Failed to record outcome:', err);
      alert('Failed to record visit outcome.');
    }
  };

  // Handle "Send In" (marks calledInAt)
  const handleSendIn = async (apptId) => {
    try {
      await updateAppointment(apptId, {
        calledInAt: new Date(),
        lastChangeAt: new Date(),
        lastChangeBy: 'doctor'
      });
    } catch (err) {
      console.error('Failed to mark called in:', err);
      alert('Failed to call representative in.');
    }
  };

  // Handle single cancellation by doctor
  const handleCancelAppointment = async (apptId, reason = 'Doctor clinic emergency') => {
    if (!confirm('Are you sure you want to cancel this visit? The slot will be released.')) return;
    try {
      await cancelAppointmentTransaction({
        appointmentId: apptId,
        userId: user.uid,
        userRole: 'doctor',
        cancelReason: reason,
        cancelCutoffMinutes: 60
      });
    } catch (err) {
      alert(err.message || 'Failed to cancel appointment');
    }
  };

  // Handle quick tag on rep relation
  const handleAddTag = async (repId, tag, apptId) => {
    if (!repId || !tag) return;
    try {
      await addRepRelationTag(user.uid, repId, tag);
      setAppliedTagsMap(prev => ({
        ...prev,
        [apptId]: [...(prev[apptId] || []), tag]
      }));
    } catch (err) {
      console.error('Failed to save tag:', err);
    }
  };

  // Emergency cancellation of remaining visits today
  const handleEmergencyCancelRemaining = async () => {
    const remaining = appointments.filter(a => a.status === 'approved' && !a.outcome);
    if (remaining.length === 0) {
      alert('No remaining active visits to cancel today.');
      return;
    }

    if (!confirm(`Cancel all ${remaining.length} remaining visits today? Representatives will receive notification on their pass.`)) {
      return;
    }

    setActionLoading(true);
    const cancelled = [];

    for (const appt of remaining) {
      try {
        await cancelAppointmentTransaction({
          appointmentId: appt.id,
          userId: user.uid,
          userRole: 'doctor',
          cancelReason: 'Doctor cancelled remaining clinic visits today',
          cancelCutoffMinutes: 60
        });
        cancelled.push(appt);
      } catch (err) {
        console.error('Failed to cancel appointment during emergency sweep:', appt.id, err);
      }
    }

    // Set today status to cancelled/paused
    await handleUpdateTodayStatus('paused', 0, 'Clinic cancelled for the rest of today');

    setCancelledEmergencyAppts(cancelled);
    setShowEmergencyModal(true);
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-36 rounded-card" />
        <Skeleton className="w-full h-36 rounded-card" />
      </div>
    );
  }

  const activeVisitsCount = appointments.filter(a => a.status === 'approved' && !a.outcome).length;

  return (
    <div className="space-y-6 pb-20 font-sans selection:bg-amber-100 selection:text-sand-600">
      
      {/* ── Top Header & Emergency Action ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Today's Visits</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            {appointments.length} visitor{appointments.length !== 1 ? 's' : ''} scheduled for today ({todayStr})
          </p>
        </div>

        {activeVisitsCount > 0 && (
          <button
            onClick={handleEmergencyCancelRemaining}
            disabled={actionLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-coral-50 hover:bg-coral-100 border border-coral-200 text-coral-700 rounded-[0.75rem] text-xs font-semibold transition-all active:scale-95"
          >
            <AlertTriangle className="w-4 h-4 text-coral-600" />
            <span>Cancel Remaining Visits</span>
          </button>
        )}
      </div>

      {/* ── Clinic Live Status Bar (Running Late / Pause) ─────────────── */}
      <div className="bg-white p-4 rounded-card border border-line shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink uppercase tracking-wider font-mono">Clinic Schedule Notice:</span>
            <span className={cn(
              'px-2.5 py-0.5 rounded-full text-xs font-bold',
              todayStatus.status === 'on_time'
                ? 'bg-teal-50 text-teal-700 border border-teal-200'
                : todayStatus.status === 'running_late'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-sand-100 text-sand-800 border border-sand-300'
            )}>
              {todayStatus.status === 'on_time'
                ? 'On Time'
                : todayStatus.status === 'running_late'
                ? `Running ~${todayStatus.estimatedDelayMinutes}m Late`
                : 'Clinic Paused'}
            </span>
          </div>

          <span className="text-[0.6875rem] text-ink-mute">Visible on reps' Gatepass</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line/60">
          <button
            onClick={() => handleUpdateTodayStatus('on_time', 0)}
            className={cn(
              'px-3 py-1.5 rounded-[0.625rem] text-xs font-semibold transition-all',
              todayStatus.status === 'on_time'
                ? 'bg-navy-900 text-white'
                : 'bg-cream-50 text-ink-soft hover:bg-line'
            )}
          >
            On Time
          </button>

          <button
            onClick={() => handleUpdateTodayStatus('running_late', 15)}
            className={cn(
              'px-3 py-1.5 rounded-[0.625rem] text-xs font-semibold transition-all',
              todayStatus.status === 'running_late' && todayStatus.estimatedDelayMinutes === 15
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-cream-50 text-ink-soft hover:bg-line'
            )}
          >
            +15m Late
          </button>

          <button
            onClick={() => handleUpdateTodayStatus('running_late', 30)}
            className={cn(
              'px-3 py-1.5 rounded-[0.625rem] text-xs font-semibold transition-all',
              todayStatus.status === 'running_late' && todayStatus.estimatedDelayMinutes === 30
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-cream-50 text-ink-soft hover:bg-line'
            )}
          >
            +30m Late
          </button>

          <button
            onClick={() => handleUpdateTodayStatus('running_late', 45)}
            className={cn(
              'px-3 py-1.5 rounded-[0.625rem] text-xs font-semibold transition-all',
              todayStatus.status === 'running_late' && todayStatus.estimatedDelayMinutes === 45
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-cream-50 text-ink-soft hover:bg-line'
            )}
          >
            +45m Late
          </button>

          <button
            onClick={() => handleUpdateTodayStatus('paused', 0, 'Consultations temporarily paused')}
            className={cn(
              'px-3 py-1.5 rounded-[0.625rem] text-xs font-semibold transition-all flex items-center gap-1',
              todayStatus.status === 'paused'
                ? 'bg-sand-700 text-white font-bold'
                : 'bg-cream-50 text-ink-soft hover:bg-line'
            )}
          >
            <Pause className="w-3 h-3" />
            <span>Pause Clinic</span>
          </button>
        </div>
      </div>

      {/* ── Empty State ─────────────────────────────────────────────── */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-card p-12 text-center border border-line shadow-card max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-[1.25rem] bg-sand-50 text-sand-600 flex items-center justify-center mx-auto mb-4 border border-sand-600/20">
            <Coffee className="w-8 h-8" />
          </div>
          <h2 className="text-base font-display font-bold text-ink mb-1">No visitors today</h2>
          <p className="text-xs text-ink-soft max-w-xs mx-auto">
            You have no medical representative appointments scheduled for today.
          </p>
        </div>
      ) : (
        /* ── Appointments List ───────────────────────────────────────── */
        <div className="space-y-4">
          {appointments.map((appt) => {
            const timeRange = formatSlotRange(appt.slotStart, appt.slotEnd);
            const tokenStr = formatTokenDisplay(appt.token);
            const rep = appt.repSnapshot || {};

            let isSlotPassed = false;
            if (appt.slotDate && appt.slotEnd) {
              const endMs = parseSlotTimeToDate(appt.slotDate, appt.slotEnd).getTime();
              isSlotPassed = nowMs >= endMs;
            }

            const hasOutcome = Boolean(appt.outcome);
            const isSkipped = skippedMap[appt.id];
            const appliedTags = appliedTagsMap[appt.id] || [];

            return (
              <EdgeCard
                key={appt.id}
                edge={appt.outcome === 'met' ? 'teal' : appt.outcome === 'no_show' ? 'coral' : 'navy'}
                className="p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3 mb-3">
                  {/* Left: Rep & Info */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-display font-bold text-ink truncate">
                        {rep.name || 'Medical Rep'}
                      </h2>

                      {/* Confirmation Status Badge */}
                      {appt.repConfirmedAt ? (
                        <span className="inline-flex items-center gap-1 text-[0.625rem] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          ✓ Confirmed Coming
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[0.625rem] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          Not confirmed yet
                        </span>
                      )}

                      {/* Arrival Status Badge */}
                      {appt.arrivedAt && (
                        <span className="inline-flex items-center gap-1 text-[0.625rem] font-bold text-navy-900 bg-navy-100 px-2.5 py-0.5 rounded-full border border-navy-300 animate-pulse">
                          📍 Waiting at Reception
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-ink-soft mt-0.5">
                      {rep.company} {rep.designation ? `· ${rep.designation}` : ''} {rep.mobile ? `· ${rep.mobile}` : ''}
                    </p>
                  </div>

                  {/* Right: Slot & Token */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-ink flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5 text-teal-600" /> {timeRange}
                      </p>
                    </div>

                    <div className="bg-teal-50 px-3 py-1.5 rounded-[0.75rem] border border-teal-600/30 text-teal-600 font-mono text-sm font-bold">
                      {tokenStr}
                    </div>
                  </div>
                </div>

                {/* Focus, Products & Accompaniment */}
                <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
                  {appt.accompaniedBy === 'area_manager' && (
                    <span className="px-2 py-0.5 rounded-[0.5rem] bg-navy-900 text-white font-mono text-[0.625rem] font-bold">
                      +1 Area Manager
                    </span>
                  )}
                  {appt.visitReason && (
                    <span className="px-2 py-0.5 rounded-[0.5rem] bg-cream-100 text-ink font-mono text-[0.625rem] font-medium">
                      {appt.visitReason}
                    </span>
                  )}
                  {appt.therapeuticCategory && (
                    <span className="px-2 py-0.5 rounded-[0.5rem] bg-navy-100 text-navy-900 font-mono text-[0.625rem] font-semibold">
                      {appt.therapeuticCategory}
                    </span>
                  )}
                  {appt.samplesFlag && (
                    <span className="inline-flex items-center gap-1 text-[0.625rem] font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-[0.5rem]">
                      <Package className="w-3 h-3" /> Samples
                    </span>
                  )}
                  {appt.productFocus && (
                    <span className="text-ink font-medium">
                      "{appt.productFocus}"
                    </span>
                  )}
                </div>

                {/* Outcome Status / Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-line/60">
                  <div className="flex items-center gap-2">
                    {/* "Send In" button */}
                    {!hasOutcome && appt.status === 'approved' && (
                      appt.calledInAt ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700 bg-teal-100 px-3 py-1.5 rounded-[0.75rem] border border-teal-300">
                          <BellRing className="w-3.5 h-3.5" /> Called In
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendIn(appt.id)}
                          className="px-3.5 py-1.5 bg-navy-900 text-white rounded-[0.75rem] text-xs font-bold hover:bg-navy-700 transition-all active:scale-95 shadow-xs flex items-center gap-1.5"
                        >
                          <BellRing className="w-3.5 h-3.5" />
                          <span>Send In</span>
                        </button>
                      )
                    )}

                    {!hasOutcome && (
                      <button
                        onClick={() => handleCancelAppointment(appt.id)}
                        className="px-2.5 py-1.5 text-coral-600 hover:bg-coral-50 rounded-[0.5rem] text-xs font-medium transition-colors"
                      >
                        Cancel Visit
                      </button>
                    )}
                  </div>

                  {hasOutcome ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      {appt.outcome === 'met' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 text-teal-600 border border-teal-600/30 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Met
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-coral-50 text-coral-600 border border-coral-600/30 text-xs font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" /> No-show
                        </span>
                      )}

                      {/* Post-visit quick tags for "Met" */}
                      {appt.outcome === 'met' && appt.repId && (
                        <div className="flex items-center gap-1.5 pl-2 border-l border-line">
                          <span className="text-[0.6875rem] text-ink-mute font-medium">Tag rep:</span>
                          {POST_VISIT_TAGS.map((t) => {
                            const isTagged = appliedTags.includes(t);
                            return (
                              <button
                                key={t}
                                disabled={isTagged}
                                onClick={() => handleAddTag(appt.repId, t, appt.id)}
                                className={cn(
                                  'px-2 py-0.5 rounded-[0.375rem] text-[0.625rem] font-medium transition-all',
                                  isTagged
                                    ? 'bg-navy-900 text-white font-bold'
                                    : 'bg-cream-100 text-ink-soft hover:bg-cream-200'
                                )}
                              >
                                {isTagged ? `✓ ${t}` : `+ ${t}`}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : !isSkipped ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[0.6875rem] text-ink-mute mr-1">
                        {isSlotPassed ? 'Did you meet?' : 'Mark Visit:'}
                      </span>
                      <button
                        onClick={() => handleRecordOutcome(appt, 'met')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-[0.75rem] text-xs font-semibold transition-all shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5" /> Met
                      </button>
                      <button
                        onClick={() => handleRecordOutcome(appt, 'no_show')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-cream-50 hover:bg-coral-50 text-coral-600 border border-line rounded-[0.75rem] text-xs font-semibold transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" /> No-show
                      </button>
                      <button
                        onClick={() => setSkippedMap(prev => ({ ...prev, [appt.id]: true }))}
                        className="px-2 py-1 text-ink-mute hover:text-ink text-xs transition-colors"
                      >
                        Skip
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-mute italic">Outcome skipped</span>
                  )}
                </div>
              </EdgeCard>
            );
          })}
        </div>
      )}

      {/* ── Emergency Cancel Broadcast Modal ──────────────────────────── */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-md w-full space-y-4 shadow-card border border-line">
            <div className="flex items-center gap-2.5 text-coral-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-base font-display font-bold text-ink">
                Visits Cancelled
              </h3>
            </div>
            <p className="text-xs text-ink-soft">
              {cancelledEmergencyAppts.length} visit{cancelledEmergencyAppts.length !== 1 ? 's were' : ' was'} cancelled. Gatepasses have updated automatically. Tap below to send quick WhatsApp courtesy notices if desired:
            </p>

            <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-line/60">
              {cancelledEmergencyAppts.map((appt) => {
                const rep = appt.repSnapshot || {};
                const repMobile = (rep.mobile || '').replace(/\D/g, '');
                const waText = `Hi ${rep.name || 'Sir'}, Dr. ${doctor?.name || ''} had an urgent emergency and had to cancel clinic for today. Kindly reschedule your visit on Gatepass.`;
                const waUrl = repMobile ? buildWhatsAppUrl(repMobile, waText) : null;

                return (
                  <div key={appt.id} className="pt-2 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-ink">{rep.name || 'Representative'}</p>
                      <p className="text-ink-mute text-[0.6875rem]">{appt.slotStart}–{appt.slotEnd} · {rep.company}</p>
                    </div>

                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-[0.5rem] text-xs font-semibold"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <span className="text-[0.6875rem] text-ink-mute italic">No mobile</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-line text-right">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 bg-navy-900 text-white rounded-[0.75rem] text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
