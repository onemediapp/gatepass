/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { subscribeDoctorAppointments } from '../../lib/db/appointments';
import { useAuth } from '../../lib/auth';
import { todayDateStr, formatDateIST, formatSlotRange, parseSlotTimeToDate } from '../../lib/time';
import { formatTokenDisplay } from '../../lib/gatepass';
import { 
  Calendar, 
  Clock, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  History, 
  Sparkles,
  Inbox
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

export default function DoctorUpcoming() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'past'

  const todayStr = todayDateStr();

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeDoctorAppointments(user.uid, (list) => {
      setAppointments(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Group appointments into Upcoming and Past
  const { upcomingGrouped, pastGrouped } = useMemo(() => {
    const upcoming = [];
    const past = [];

    appointments.forEach((appt) => {
      if (appt.status === 'approved') {
        if (appt.slotDate > todayStr) {
          upcoming.push(appt);
        } else if (appt.slotDate < todayStr) {
          past.push(appt);
        }
      } else if (['declined', 'cancelled', 'expired'].includes(appt.status)) {
        past.push(appt);
      }
    });

    // Sort upcoming ASC (soonest first)
    upcoming.sort((a, b) => {
      const cmp = (a.slotDate || '').localeCompare(b.slotDate || '');
      if (cmp !== 0) return cmp;
      return (a.slotStart || '').localeCompare(b.slotStart || '');
    });

    // Sort past DESC (most recent first)
    past.sort((a, b) => {
      const cmp = (b.slotDate || '').localeCompare(a.slotDate || '');
      if (cmp !== 0) return cmp;
      return (b.slotStart || '').localeCompare(a.slotStart || '');
    });

    // Group upcoming by date
    const upMap = {};
    upcoming.forEach((appt) => {
      if (!upMap[appt.slotDate]) upMap[appt.slotDate] = [];
      upMap[appt.slotDate].push(appt);
    });

    // Group past by date
    const pastMap = {};
    past.forEach((appt) => {
      if (!pastMap[appt.slotDate]) pastMap[appt.slotDate] = [];
      pastMap[appt.slotDate].push(appt);
    });

    return { upcomingGrouped: upMap, pastGrouped: pastMap };
  }, [appointments, todayStr]);

  const activeGroup = activeTab === 'upcoming' ? upcomingGrouped : pastGrouped;
  const dateKeys = Object.keys(activeGroup);

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
      
      {/* ── Top Header & Segmented Control ──────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Schedule History</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            View upcoming schedule and past visitor outcomes
          </p>
        </div>

        {/* Segmented Control */}
        <div className="flex items-center p-1 bg-cream-50 rounded-[0.875rem] border border-line self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              'px-4 py-1.5 rounded-[0.625rem] text-xs font-semibold transition-all',
              activeTab === 'upcoming'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={cn(
              'px-4 py-1.5 rounded-[0.625rem] text-xs font-semibold transition-all',
              activeTab === 'past'
                ? 'bg-navy-900 text-white shadow-sm'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            Past Visits
          </button>
        </div>
      </div>

      {/* ── Empty State ─────────────────────────────────────────────── */}
      {dateKeys.length === 0 ? (
        <div className="bg-white rounded-card p-12 text-center border border-line shadow-card max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-[1.25rem] bg-navy-100 text-navy-900 flex items-center justify-center mx-auto mb-4">
            <Inbox className="w-8 h-8 text-ink-mute" />
          </div>
          <h2 className="text-base font-display font-bold text-ink mb-1">
            {activeTab === 'upcoming' ? 'No upcoming visits' : 'No past visits'}
          </h2>
          <p className="text-xs text-ink-soft max-w-xs mx-auto">
            {activeTab === 'upcoming'
              ? 'Approved requests scheduled for future dates will appear here.'
              : 'Past visits and outcomes will be archived here.'}
          </p>
        </div>
      ) : (
        /* ── Grouped Visits List ─────────────────────────────────────── */
        <div className="space-y-6">
          {dateKeys.map((dateStr) => {
            const list = activeGroup[dateStr] || [];

            // Format date header: e.g. "Tomorrow, Wed 29 Oct"
            let formattedDateHeader = dateStr;
            try {
              const d = parseSlotTimeToDate(dateStr, '12:00');
              formattedDateHeader = formatDateIST(d, 'EEEE, dd MMMM yyyy');
            } catch {
              formattedDateHeader = dateStr;
            }

            return (
              <div key={dateStr} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <Calendar className="w-4 h-4 text-amber-500" />
                  <h3 className="font-display font-bold text-sm text-ink">
                    {formattedDateHeader}
                  </h3>
                  <span className="text-[0.6875rem] font-mono text-ink-mute">
                    ({list.length} visitor{list.length !== 1 ? 's' : ''})
                  </span>
                </div>

                <div className="space-y-3">
                  {list.map((appt) => {
                    const timeRange = formatSlotRange(appt.slotStart, appt.slotEnd);
                    const tokenStr = formatTokenDisplay(appt.token);
                    const rep = appt.repSnapshot || {};

                    return (
                      <EdgeCard
                        key={appt.id}
                        edge={appt.status === 'approved' ? 'teal' : appt.status === 'declined' ? 'coral' : 'navy'}
                        className="p-4"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h4 className="text-sm font-bold text-ink truncate">
                              {rep.name || 'Medical Rep'}
                            </h4>
                            <p className="text-xs text-ink-soft">
                              {rep.company} {rep.designation ? `· ${rep.designation}` : ''}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-xs font-bold text-ink">{timeRange}</p>
                              {appt.token && (
                                <p className="font-mono text-[0.6875rem] text-teal-600 font-bold">
                                  {tokenStr}
                                </p>
                              )}
                            </div>

                            {/* Status Chip */}
                            {appt.outcome === 'met' ? (
                              <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 border border-teal-600/30 text-[0.6875rem] font-bold">
                                Met
                              </span>
                            ) : appt.outcome === 'no_show' ? (
                              <span className="px-2 py-0.5 rounded-full bg-coral-50 text-coral-600 border border-coral-600/30 text-[0.6875rem] font-bold">
                                No-show
                              </span>
                            ) : (
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-[0.6875rem] font-bold uppercase',
                                appt.status === 'approved' ? 'bg-teal-50 text-teal-600' : 'bg-cream-50 text-ink-mute'
                              )}>
                                {appt.status}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Focus */}
                        {appt.productFocus && (
                          <div className="mt-2 pt-2 border-t border-line/60 text-xs text-ink-soft">
                            <span className="font-medium text-ink">Focus: </span>
                            {appt.productFocus}
                          </div>
                        )}
                      </EdgeCard>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
