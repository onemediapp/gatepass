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
  Inbox,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  XCircle,
  UserX
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import VisitDetailsModal from '../../components/doctor/VisitDetailsModal';
import { cn } from '../../lib/utils';

export default function DoctorUpcoming() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'history'
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all' | 'completed' | 'cancelled' | 'no_show'
  const [selectedAppt, setSelectedAppt] = useState(null);

  const todayStr = todayDateStr();
  const [selectedDateStr, setSelectedDateStr] = useState(todayStr);

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeDoctorAppointments(user.uid, (list) => {
      setAppointments(list);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  // Generate 7-day strip centered around selected date or today
  const weekStrip = useMemo(() => {
    const baseDate = new Date();
    const days = [];
    for (let i = -2; i <= 4; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const dStr = d.toISOString().split('T')[0];
      days.push({
        dateStr: dStr,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNum: d.getDate(),
        isToday: dStr === todayStr
      });
    }
    return days;
  }, [todayStr]);

  // Filtered upcoming visits for the selected date
  const upcomingForSelectedDate = useMemo(() => {
    return appointments.filter(a => {
      return a.status === 'approved' && a.slotDate === selectedDateStr;
    }).sort((a, b) => (a.slotStart || '').localeCompare(b.slotStart || ''));
  }, [appointments, selectedDateStr]);

  // Past visits for History tab
  const historyGrouped = useMemo(() => {
    const past = appointments.filter(a => {
      if (a.slotDate < todayStr) return true;
      if (a.status === 'completed' || a.outcome === 'met' || a.outcome === 'no_show') return true;
      if (['declined', 'cancelled', 'expired'].includes(a.status)) return true;
      return false;
    });

    // Apply history filter
    const filtered = past.filter(a => {
      if (historyFilter === 'completed') return a.status === 'completed' || a.outcome === 'met';
      if (historyFilter === 'cancelled') return a.status === 'cancelled' || a.status === 'declined';
      if (historyFilter === 'no_show') return a.outcome === 'no_show';
      return true;
    });

    // Sort descending by date
    filtered.sort((a, b) => {
      const cmp = (b.slotDate || '').localeCompare(a.slotDate || '');
      if (cmp !== 0) return cmp;
      return (b.slotStart || '').localeCompare(a.slotStart || '');
    });

    // Group by date
    const map = {};
    filtered.forEach(a => {
      const key = a.slotDate || 'Past';
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });

    return map;
  }, [appointments, todayStr, historyFilter]);

  const historyDateKeys = Object.keys(historyGrouped);

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
      
      {/* ── Top Header & Tab Toggle ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">
            {activeTab === 'upcoming' ? 'Upcoming Visits' : 'Visit History'}
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            {activeTab === 'upcoming' 
              ? 'Your confirmed and scheduled representative visits' 
              : 'Completed, cancelled and past representative visits'}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1 bg-cream-200/70 rounded-[1rem] border border-line self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={cn(
              'px-4 py-1.5 rounded-[0.75rem] text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'upcoming'
                ? 'bg-white text-navy-950 font-bold shadow-2xs'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={cn(
              'px-4 py-1.5 rounded-[0.75rem] text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'history'
                ? 'bg-white text-navy-950 font-bold shadow-2xs'
                : 'text-ink-soft hover:text-ink'
            )}
          >
            Visit History
          </button>
        </div>
      </div>

      {/* ── TAB 1: UPCOMING VISITS (Reference Image 4 Screen 1) ──────── */}
      {activeTab === 'upcoming' && (
        <div className="space-y-5">
          
          {/* Calendar Strip Header */}
          <div className="bg-white p-4 rounded-[1.25rem] border border-line shadow-card space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-ink">
                {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setSelectedDateStr(todayStr)}
                  className="px-2.5 py-1 rounded-[0.625rem] bg-slate-100 hover:bg-slate-200 text-[0.6875rem] font-bold text-slate-700 transition-colors cursor-pointer"
                >
                  Today
                </button>
              </div>
            </div>

            {/* 7-Day Date Strip */}
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {weekStrip.map((day) => {
                const isSelected = day.dateStr === selectedDateStr;
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => setSelectedDateStr(day.dateStr)}
                    className={cn(
                      "py-2.5 px-1 rounded-[1rem] transition-all cursor-pointer flex flex-col items-center justify-center",
                      isSelected 
                        ? "bg-navy-900 text-white font-bold shadow-xs scale-102" 
                        : "hover:bg-slate-100 text-slate-600"
                    )}
                  >
                    <span className="text-[0.625rem] uppercase font-mono tracking-wider opacity-80">
                      {day.dayName}
                    </span>
                    <span className="text-sm font-display font-bold mt-0.5">
                      {day.dayNum}
                    </span>
                    {day.isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Visits Heading */}
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-bold text-sm text-ink">
              {selectedDateStr === todayStr ? 'Today, ' : ''}
              {formatDateIST(selectedDateStr, 'EEEE, dd MMMM yyyy')}
            </h3>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              {upcomingForSelectedDate.length} visit{upcomingForSelectedDate.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Visits List */}
          {upcomingForSelectedDate.length === 0 ? (
            <div className="bg-white rounded-[1.25rem] p-10 text-center border border-line shadow-card max-w-md mx-auto my-6">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-display font-bold text-ink">No visits scheduled</h4>
              <p className="text-xs text-slate-500 mt-1">
                No medical representative appointments for this date.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingForSelectedDate.map((appt) => {
                const rep = appt.repSnapshot || {};
                const initial = rep.name ? rep.name.charAt(0) : 'R';
                const timeRange = formatSlotRange(appt.slotStart, appt.slotEnd);

                return (
                  <div
                    key={appt.id}
                    onClick={() => setSelectedAppt(appt)}
                    className="flex items-center justify-between p-4 rounded-[1.25rem] bg-white border border-line hover:border-teal-300 hover:shadow-sm transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      {/* Slot Time */}
                      <div className="text-left font-mono min-w-[4.5rem]">
                        <p className="text-xs font-bold text-ink">{appt.slotStart || '10:00'}</p>
                        <p className="text-[0.625rem] text-slate-400">{appt.slotEnd || '10:30'}</p>
                      </div>

                      {/* Rep Avatar */}
                      <div className="w-10 h-10 rounded-[0.875rem] bg-amber-100 text-amber-800 font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                        {initial}
                      </div>

                      {/* Rep Details */}
                      <div>
                        <h4 className="text-sm font-display font-bold text-ink group-hover:text-teal-700 transition-colors">
                          {rep.name || 'Representative'}
                        </h4>
                        <p className="text-xs text-slate-600 font-medium">
                          {rep.company || 'Pharma Co.'}
                        </p>
                        <p className="text-[0.6875rem] text-slate-400">
                          {rep.designation || 'RM'} {rep.therapeuticCategory ? `• ${rep.therapeuticCategory}` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
                        Confirmed
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ── TAB 2: VISIT HISTORY (Reference Image 4 Screen 4) ───────── */}
      {activeTab === 'history' && (
        <div className="space-y-5">
          
          {/* History Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['all', 'completed', 'cancelled', 'no_show'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setHistoryFilter(filterKey)}
                className={cn(
                  "px-4 py-2 rounded-[0.75rem] text-xs font-bold capitalize transition-all cursor-pointer shrink-0",
                  historyFilter === filterKey
                    ? "bg-navy-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 hover:bg-slate-100 border border-line"
                )}
              >
                {filterKey === 'no_show' ? 'No Show' : filterKey}
              </button>
            ))}
          </div>

          {/* Grouped History List */}
          {historyDateKeys.length === 0 ? (
            <div className="bg-white rounded-[1.25rem] p-10 text-center border border-line shadow-card max-w-md mx-auto my-6">
              <History className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-display font-bold text-ink">No visits in history</h4>
              <p className="text-xs text-slate-500 mt-1">
                Completed, cancelled and expired visits will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {historyDateKeys.map((dStr) => {
                const list = historyGrouped[dStr] || [];

                return (
                  <div key={dStr} className="space-y-3">
                    <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-500 px-1 font-mono">
                      {formatDateIST(dStr, 'EEEE, dd MMMM yyyy')}
                    </h3>

                    <div className="space-y-2.5">
                      {list.map((appt) => {
                        const rep = appt.repSnapshot || {};
                        const initial = rep.name ? rep.name.charAt(0) : 'R';
                        const isCompleted = appt.outcome === 'met' || appt.status === 'completed';
                        const isCancelled = appt.status === 'cancelled' || appt.status === 'declined';
                        const isNoShow = appt.outcome === 'no_show';

                        return (
                          <div
                            key={appt.id}
                            onClick={() => setSelectedAppt(appt)}
                            className="flex items-center justify-between p-4 rounded-[1.25rem] bg-white border border-line hover:border-slate-300 hover:shadow-2xs transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-3.5">
                              {/* Slot Time */}
                              <div className="text-left font-mono min-w-[4rem]">
                                <p className="text-xs font-bold text-ink">{appt.slotStart || '10:00'}</p>
                                <p className="text-[0.625rem] text-slate-400">{appt.slotEnd || '10:30'}</p>
                              </div>

                              {/* Rep Avatar */}
                              <div className={cn(
                                "w-10 h-10 rounded-[0.875rem] font-display font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs",
                                isCompleted ? "bg-teal-100 text-teal-800" :
                                isCancelled ? "bg-coral-100 text-coral-800" :
                                "bg-slate-100 text-slate-700"
                              )}>
                                {initial}
                              </div>

                              {/* Rep Details */}
                              <div>
                                <h4 className="text-sm font-display font-bold text-ink">
                                  {rep.name || 'Representative'}
                                </h4>
                                <p className="text-xs text-slate-600">
                                  {rep.company || 'Pharma Co.'}
                                </p>
                                <p className="text-[0.6875rem] text-slate-400">
                                  {rep.designation || 'RM'} {rep.therapeuticCategory ? `• ${rep.therapeuticCategory}` : ''}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                              {/* Status Badge */}
                              {isCompleted && (
                                <span className="px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
                                  Completed
                                </span>
                              )}
                              {isCancelled && (
                                <span className="px-3 py-1 rounded-full bg-coral-50 text-coral-700 border border-coral-200 text-xs font-bold">
                                  Cancelled
                                </span>
                              )}
                              {isNoShow && (
                                <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold">
                                  No Show
                                </span>
                              )}
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-ink transition-transform group-hover:translate-x-0.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* ── Visit Details Modal (Reference Image 4 Screen 2) ────────── */}
      {selectedAppt && (
        <VisitDetailsModal
          appt={selectedAppt}
          doctorId={user?.uid}
          onClose={() => setSelectedAppt(null)}
          onRefresh={() => {}}
        />
      )}

    </div>
  );
}
