/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { subscribeDoctorAppointmentsByDate, updateAppointment } from '../../lib/db/appointments';
import { recordRepOutcome } from '../../lib/db/repRelations';
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
  AlertCircle 
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';
import { serverTimestamp } from 'firebase/firestore';

export default function DoctorToday() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skippedMap, setSkippedMap] = useState({});
  const [nowMs, setNowMs] = useState(serverNow());

  const todayStr = todayDateStr();

  // 1-second timer to update current time for slotEnd evaluation
  useEffect(() => {
    const timer = setInterval(() => setNowMs(serverNow()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeDoctorAppointmentsByDate(user.uid, todayStr, (list) => {
      // Sort chronological by slotStart
      const sorted = [...list].sort((a, b) => (a.slotStart || '').localeCompare(b.slotStart || ''));
      setAppointments(sorted);
      setLoading(false);
    });

    return () => unsub();
  }, [user, todayStr]);

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
      
      {/* ── Top Header ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-display font-bold text-ink">Today's Visits</h1>
        <p className="text-xs text-ink-soft mt-0.5">
          {appointments.length} confirmed Gatepass visitor{appointments.length !== 1 ? 's' : ''} for today ({todayStr})
        </p>
      </div>

      {/* ── Empty State ─────────────────────────────────────────────── */}
      {appointments.length === 0 ? (
        <div className="bg-white rounded-card p-12 text-center border border-line shadow-card max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-[1.25rem] bg-sand-50 text-sand-600 flex items-center justify-center mx-auto mb-4 border border-sand-600/20">
            <Coffee className="w-8 h-8" />
          </div>
          <h2 className="text-base font-display font-bold text-ink mb-1">No visitors today</h2>
          <p className="text-xs text-ink-soft max-w-xs mx-auto">
            You have no medical representative appointments scheduled for today. Enjoy your day!
          </p>
        </div>
      ) : (
        /* ── Appointments List ───────────────────────────────────────── */
        <div className="space-y-4">
          {appointments.map((appt) => {
            const timeRange = formatSlotRange(appt.slotStart, appt.slotEnd);
            const tokenStr = formatTokenDisplay(appt.token);
            const rep = appt.repSnapshot || {};

            // Check if slot has passed or is ongoing
            let isSlotPassed = false;
            if (appt.slotDate && appt.slotEnd) {
              const endMs = parseSlotTimeToDate(appt.slotDate, appt.slotEnd).getTime();
              isSlotPassed = nowMs >= endMs;
            }

            const hasOutcome = Boolean(appt.outcome);
            const isSkipped = skippedMap[appt.id];

            return (
              <EdgeCard
                key={appt.id}
                edge={appt.outcome === 'met' ? 'teal' : appt.outcome === 'no_show' ? 'coral' : 'navy'}
                className="p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3 mb-3">
                  {/* Left: Rep & Info */}
                  <div>
                    <h2 className="text-base font-display font-bold text-ink truncate">
                      {rep.name || 'Medical Rep'}
                    </h2>
                    <p className="text-xs text-ink-soft">
                      {rep.company} {rep.designation ? `· ${rep.designation}` : ''}
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

                {/* Focus & Products */}
                <div className="flex flex-wrap items-center gap-2 text-xs mb-3">
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
                <div className="flex items-center justify-between pt-2 border-t border-line/60">
                  <span className="text-[0.6875rem] text-ink-mute font-mono">
                    STATUS: {appt.status.toUpperCase()}
                  </span>

                  {hasOutcome ? (
                    <div className="flex items-center gap-1.5">
                      {appt.outcome === 'met' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 text-teal-600 border border-teal-600/30 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Met
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-coral-50 text-coral-600 border border-coral-600/30 text-xs font-semibold">
                          <AlertCircle className="w-3.5 h-3.5" /> No-show
                        </span>
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
    </div>
  );
}
