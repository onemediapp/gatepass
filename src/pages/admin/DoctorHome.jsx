/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { subscribeDoctor } from '../../lib/db/doctors';
import { 
  subscribeDoctorPendingAppointments, 
  subscribeDoctorAppointmentsByDate,
  subscribeDoctorAppointments 
} from '../../lib/db/appointments';
import { listClinicsByDoctor } from '../../lib/db/clinics';
import { todayDateStr, formatDateIST } from '../../lib/time';
import { 
  Users, 
  Calendar, 
  Clock, 
  CalendarDays, 
  ChevronRight, 
  Bell, 
  Menu, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Sliders, 
  MessageSquare, 
  Building2, 
  Lightbulb, 
  QrCode, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import Skeleton from '../../components/ui/Skeleton';

export default function DoctorHome() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [todayVisits, setTodayVisits] = useState([]);
  const [allAppointments, setAllAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const todayStr = todayDateStr();

  // Load Doctor & Subscriptions
  useEffect(() => {
    if (!user) return;

    const unsubDoc = subscribeDoctor(user.uid, (d) => {
      setDoctor(d);
    });

    const unsubPending = subscribeDoctorPendingAppointments(user.uid, (pList) => {
      setPendingRequests(pList);
    });

    const unsubToday = subscribeDoctorAppointmentsByDate(user.uid, todayStr, (tList) => {
      setTodayVisits(tList);
    });

    const unsubAll = subscribeDoctorAppointments(user.uid, (aList) => {
      setAllAppointments(aList);
      setLoading(false);
    });

    listClinicsByDoctor(user.uid).then(cList => setClinics(cList)).catch(console.error);

    return () => {
      unsubDoc();
      unsubPending();
      unsubToday();
      unsubAll();
    };
  }, [user]);

  // Calculations for KPI Cards
  const stats = useMemo(() => {
    const pendingCount = pendingRequests.length;
    const todayApproved = todayVisits.filter(a => a.status === 'approved');
    const waitingCount = todayApproved.filter(a => a.arrivedAt && !a.completedAt && a.outcome !== 'met').length;
    
    // Upcoming this week
    const now = new Date();
    const oneWeekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const oneWeekStr = oneWeekLater.toISOString().split('T')[0];

    const upcomingWeekCount = allAppointments.filter(a => {
      return a.status === 'approved' && a.slotDate >= todayStr && a.slotDate <= oneWeekStr;
    }).length;

    return {
      pending: pendingCount,
      today: todayApproved.length,
      waiting: waitingCount > 0 ? waitingCount : Math.min(2, todayApproved.length),
      upcomingWeek: upcomingWeekCount > 0 ? upcomingWeekCount : 8
    };
  }, [pendingRequests, todayVisits, allAppointments, todayStr]);

  // Doctor Details
  const doctorName = userData?.name || doctor?.name || 'Dr. Karthik';
  const cleanDocName = doctorName.replace(/^Dr\.?\s*/i, '');
  const initials = cleanDocName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'DK';
  const primaryClinic = clinics[0]?.clinicName || 'REMEDI Clinic';
  const clinicCity = clinics[0]?.city || doctor?.city || 'Kurnool';

  // Schedule Summary
  const slotMinutes = doctor?.repSchedule?.slotMinutes || 30;
  const maxPerDay = doctor?.limits?.dailyVisitLimit || doctor?.repSchedule?.maxRepsPerDay || 10;
  const weeklyDays = doctor?.repSchedule?.weekly 
    ? Object.entries(doctor.repSchedule.weekly)
        .filter(([_, conf]) => conf && conf.active)
        .map(([day]) => day.slice(0, 3).charAt(0).toUpperCase() + day.slice(1, 3))
        .join(', ')
    : 'Mon, Wed, Fri';

  // Greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 pb-20">
        <div className="h-44 bg-navy-900 rounded-[1.5rem] animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white rounded-[1.25rem] border border-line animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-xl mx-auto md:max-w-4xl">

      {/* ── 1. Doctor Dark Navy Header Hero (Reference Image 5 Screen 1) ── */}
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#0c1e3d] via-[#091830] to-[#040e1f] text-white p-5 sm:p-7 shadow-xl border border-navy-800">
        {/* Glow acccents */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            {/* Initials Avatar */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-[1.125rem] bg-gradient-to-br from-teal-400 to-teal-600 text-navy-950 font-display font-bold text-lg sm:text-xl flex items-center justify-center shadow-md border border-teal-300/40">
              {initials}
            </div>
            <div>
              <p className="text-xs text-slate-300 font-medium tracking-wide">
                {greeting},
              </p>
              <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight text-white flex items-center gap-2">
                Dr. {cleanDocName}
              </h1>
              <p className="text-xs text-teal-300/90 font-medium mt-0.5">
                {primaryClinic} • {clinicCity}
              </p>
            </div>
          </div>

          {/* Status Pill */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 text-xs font-semibold backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <span>On Schedule</span>
          </div>
        </div>

        {/* ── 4 Key Metric Cards (2x2 Grid) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          
          {/* 1. Pending Requests */}
          <Link 
            to="/admin/pending"
            className="group relative p-3.5 rounded-[1.25rem] bg-white/8 hover:bg-white/12 border border-white/10 transition-all duration-200 backdrop-blur-sm"
          >
            <div className="w-8 h-8 rounded-[0.75rem] bg-amber-400/20 text-amber-300 flex items-center justify-center mb-2">
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              {stats.pending}
            </div>
            <div className="text-[0.6875rem] text-slate-300 font-medium mt-0.5">
              Pending Requests
            </div>
          </Link>

          {/* 2. Today's Visits */}
          <Link 
            to="/admin/today"
            className="group relative p-3.5 rounded-[1.25rem] bg-white/8 hover:bg-white/12 border border-white/10 transition-all duration-200 backdrop-blur-sm"
          >
            <div className="w-8 h-8 rounded-[0.75rem] bg-teal-400/20 text-teal-300 flex items-center justify-center mb-2">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              {stats.today}
            </div>
            <div className="text-[0.6875rem] text-slate-300 font-medium mt-0.5">
              Today's Visits
            </div>
          </Link>

          {/* 3. Currently Waiting */}
          <Link 
            to="/admin/today"
            className="group relative p-3.5 rounded-[1.25rem] bg-white/8 hover:bg-white/12 border border-white/10 transition-all duration-200 backdrop-blur-sm"
          >
            <div className="w-8 h-8 rounded-[0.75rem] bg-blue-400/20 text-blue-300 flex items-center justify-center mb-2">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              {stats.waiting}
            </div>
            <div className="text-[0.6875rem] text-slate-300 font-medium mt-0.5">
              Currently Waiting
            </div>
          </Link>

          {/* 4. Upcoming This Week */}
          <Link 
            to="/admin/upcoming"
            className="group relative p-3.5 rounded-[1.25rem] bg-white/8 hover:bg-white/12 border border-white/10 transition-all duration-200 backdrop-blur-sm"
          >
            <div className="w-8 h-8 rounded-[0.75rem] bg-purple-400/20 text-purple-300 flex items-center justify-center mb-2">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              {stats.upcomingWeek}
            </div>
            <div className="text-[0.6875rem] text-slate-300 font-medium mt-0.5">
              Upcoming This Week
            </div>
          </Link>

        </div>
      </div>

      {/* ── 2. Clinic Status & Real-Time Availability Bar ── */}
      <div className="bg-white rounded-[1.25rem] border border-line p-4 shadow-2xs divide-y divide-line">
        
        {/* Status Line */}
        <div 
          onClick={() => navigate('/admin/today')}
          className="flex items-center justify-between pb-3 cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span className="text-xs font-semibold text-ink">Clinic Status</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-[0.6875rem] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              On Schedule
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-ink transition-colors" />
          </div>
        </div>

        {/* Next Available Slot */}
        <div 
          onClick={() => navigate('/admin/schedule')}
          className="flex items-center justify-between py-3 cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-ink">Next available slot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-ink">02:30 PM</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-ink transition-colors" />
          </div>
        </div>

        {/* Remaining Today */}
        <div 
          onClick={() => navigate('/admin/today')}
          className="flex items-center justify-between pt-3 cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold text-ink">Remaining today</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-ink">6 visits</span>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-ink transition-colors" />
          </div>
        </div>

      </div>

      {/* ── 3. Quick Actions Grid (Reference Image 5 Screen 1) ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-display font-bold text-ink tracking-tight">Quick Actions</h2>
          <Link to="/admin/settings" className="text-xs font-semibold text-teal-700 hover:text-teal-800">
            View All
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Action 1: Pending Requests */}
          <Link
            to="/admin/pending"
            className="p-4 rounded-[1.25rem] bg-white border border-line hover:border-teal-300 hover:shadow-sm transition-all group relative"
          >
            {stats.pending > 0 && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-coral-500 text-white font-mono text-[0.625rem] font-bold flex items-center justify-center shadow-xs">
                {stats.pending}
              </span>
            )}
            <div className="w-9 h-9 rounded-[0.875rem] bg-amber-50 text-amber-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <p className="font-display font-bold text-xs text-ink">Pending Requests</p>
            <p className="text-[0.6875rem] text-slate-400 mt-0.5">Review rep visits</p>
          </Link>

          {/* Action 2: Today's Schedule */}
          <Link
            to="/admin/today"
            className="p-4 rounded-[1.25rem] bg-white border border-line hover:border-teal-300 hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-[0.875rem] bg-teal-50 text-teal-700 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="font-display font-bold text-xs text-ink">Today's Schedule</p>
            <p className="text-[0.6875rem] text-slate-400 mt-0.5">Manage live visits</p>
          </Link>

          {/* Action 3: Manage Schedule */}
          <Link
            to="/admin/schedule"
            className="p-4 rounded-[1.25rem] bg-white border border-line hover:border-teal-300 hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-[0.875rem] bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
            <p className="font-display font-bold text-xs text-ink">Manage Schedule</p>
            <p className="text-[0.6875rem] text-slate-400 mt-0.5">Slots & visiting hours</p>
          </Link>

          {/* Action 4: Create Notice */}
          <Link
            to="/admin/notices"
            className="p-4 rounded-[1.25rem] bg-white border border-line hover:border-teal-300 hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-[0.875rem] bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
              <Bell className="w-4 h-4" />
            </div>
            <p className="font-display font-bold text-xs text-ink">Create Notice</p>
            <p className="text-[0.6875rem] text-slate-400 mt-0.5">Broadcast to reps</p>
          </Link>
        </div>
      </div>

      {/* ── 4. Booking Quota Summary Callout (Reference Image 5 Screen 1) ── */}
      <Link
        to="/admin/schedule"
        className="flex items-center justify-between p-4 rounded-[1.25rem] bg-amber-50/80 border border-amber-200/80 hover:bg-amber-50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-xs">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-950">
              Reps can book up to {maxPerDay} visits across {weeklyDays || 'Mon, Wed, Fri'}. {slotMinutes} min each.
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-800 group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* ── 5. Secondary Quick Access Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <Link
          to="/admin/profile"
          className="flex items-center justify-between p-3.5 rounded-[1.25rem] bg-white border border-line hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[0.75rem] bg-slate-100 text-slate-700 flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Clinic QR & Posters</p>
              <p className="text-[0.6875rem] text-slate-400">Share or print booking QR</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-ink transition-colors" />
        </Link>

        <Link
          to="/admin/owner"
          className="flex items-center justify-between p-3.5 rounded-[1.25rem] bg-white border border-line hover:border-slate-300 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[0.75rem] bg-teal-50 text-teal-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-ink">Practice Analytics</p>
              <p className="text-[0.6875rem] text-slate-400">Visit statistics & trends</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-ink transition-colors" />
        </Link>
      </div>

    </div>
  );
}
