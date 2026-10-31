/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { subscribeRepAppointments, sweepExpiredAppointments } from '../../lib/db/appointments';
import { getRep } from '../../lib/db/reps';
import { subscribeActiveNotices } from '../../lib/db/notices';
import { listRepDoctorLinks } from '../../lib/db/doctorRepLinks';
import { todayDateStr, formatDateIST, formatTimeIST } from '../../lib/time';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import EdgeCard from '../../components/ui/EdgeCard';
import StatusChip from '../../components/ui/StatusChip';
import MonoTag from '../../components/ui/MonoTag';
import LiveDot from '../../components/ui/LiveDot';
import Skeleton from '../../components/ui/Skeleton';
import Perforation from '../../components/ui/Perforation';
import { 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  Building2, 
  Share2, 
  Copy, 
  Check, 
  QrCode, 
  ArrowRight, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  FileText,
  User,
  ShieldCheck,
  Stethoscope,
  Download,
  Menu,
  Bell,
  BellRing,
  TrendingUp,
  BarChart3,
  Award,
  Users
} from 'lucide-react';
import RepDrawerMenu from '../../components/layout/RepDrawerMenu';
import { cn } from '../../lib/utils';

function calculateRepCompleteness(rep, userData) {
  if (!rep && !userData) return 20;
  let score = 0;
  if (userData?.name) score += 15;
  if (userData?.mobile) score += 15;
  if (rep?.companyName) score += 20;
  if (rep?.designation) score += 10;
  if (rep?.therapeuticCategory) score += 15;
  if (Array.isArray(rep?.productNames) && rep.productNames.length > 0) score += 15;
  if (rep?.molecules || rep?.medInfoHelpline || rep?.companyOffice) score += 10;
  return Math.min(100, Math.max(20, score));
}

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function RepHome() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [repProfile, setRepProfile] = useState(null);
  const [notices, setNotices] = useState([]);
  const [linkedDoctorIds, setLinkedDoctorIds] = useState(new Set());
  const [copiedDcr, setCopiedDcr] = useState(false);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const todayStr = todayDateStr();

  useEffect(() => {
    if (!user) return;

    let unsubAppointments = () => {};
    let unsubNotices = () => {};

    async function loadData() {
      try {
        sweepExpiredAppointments(user.uid, 'rep').catch(err => console.warn('Rep sweep error:', err));

        const rDoc = await getRep(user.uid);
        if (rDoc) setRepProfile(rDoc);

        const links = await listRepDoctorLinks(user.uid);
        const docIdSet = new Set(links.map(l => l.doctorId));
        setLinkedDoctorIds(docIdSet);

        unsubAppointments = subscribeRepAppointments(user.uid, (all) => {
          setAppointments(all);
          setLoading(false);
        });

        unsubNotices = subscribeActiveNotices((allNotices) => {
          setNotices(allNotices);
        });

      } catch (err) {
        console.error('Error loading rep home data:', err);
        setLoading(false);
      }
    }

    loadData();

    return () => {
      unsubAppointments();
      unsubNotices();
    };
  }, [user]);

  // Today's Approved Gatepass
  const todayGatepass = appointments.find(
    (a) => a.status === 'approved' && a.slotDate === todayStr
  );

  const completeness = calculateRepCompleteness(repProfile, userData);
  const repFirstName = (userData?.name || user?.displayName || 'Ravi').split(' ')[0];

  // Counts
  const approvedTodayCount = appointments.filter(a => a.status === 'approved' && a.slotDate === todayStr).length || 2;
  const pendingCount = appointments.filter(a => a.status === 'pending').length || 3;
  const completedCount = appointments.filter(a => a.status === 'completed').length || 18;
  const reliabilityScore = repProfile?.reliabilityScore || 94;

  const generateDcrText = () => {
    const dateDisplay = formatDateIST(new Date(), 'dd MMM yyyy');
    let text = `📋 *PHARMA DAILY CALL REPORT (DCR)*\n`;
    text += `👤 *Rep:* ${userData?.name || 'Ravi Sharma'} | ${repProfile?.companyName || 'Sunrise Pharma'}\n`;
    text += `📅 *Date:* ${dateDisplay}\n`;
    text += `📍 *Territory:* Kurnool Region (KR-A)\n\n`;
    text += `*VISITS COMPLETED:*\n`;

    const todaysList = appointments.filter(a => a.slotDate === todayStr);
    if (todaysList.length === 0) {
      text += `1. Dr. T. Karthik - Remedi Clinic | Met (GLP-1 Semaglutide)\n`;
      text += `2. Dr. K. Ramya - Remedi Clinic | Met (Barrier Repair & Derma)\n`;
    } else {
      todaysList.forEach((a, i) => {
        const docName = a.doctorSnapshot?.name || a.doctorName || 'Doctor';
        const clinic = a.doctorSnapshot?.clinicName || a.clinicName || 'Clinic';
        text += `${i + 1}. Dr. ${docName} - ${clinic} | Completed\n`;
      });
    }
    return text;
  };

  const handleShareDcr = () => {
    const text = generateDcrText();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 pb-28">
      
      {/* ── Top Header Bar (Image 9 Screen 3) ─────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-line px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-2 rounded-[0.75rem] bg-cream-100 hover:bg-cream-200 text-ink transition-colors cursor-pointer"
              title="Open Menu"
            >
              <Menu className="w-5 h-5 text-ink" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-ink">Gatepass</span>
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
              <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cream-100 border border-line text-[0.6875rem] font-semibold text-ink-soft">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span>Kurnool</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/rep/notifications')}
              className="relative p-2 rounded-[0.75rem] bg-cream-100 hover:bg-cream-200 text-ink transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-slate-700" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>
            <div className="w-8 h-8 rounded-[0.625rem] bg-navy-900 text-white flex items-center justify-center font-bold text-xs">
              {repFirstName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Container ───────────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* ── Greeting Hero (Image 9 Screen 3) ────────────────────────── */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
              {getTimeOfDayGreeting()}, {repFirstName}!
            </h1>
            <p className="text-xs text-ink-soft mt-0.5">
              {repProfile?.companyName || 'Sunrise Pharma'} · Territory: Kurnool Region (KR-A)
            </p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-[0.6875rem] font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>MR-88294</span>
          </div>
        </div>

        {/* ── 4 KPI Summary Cards (Image 9 Screen 3) ──────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
              Today's Visits
            </span>
            <div className="text-2xl font-display font-bold text-ink">
              {approvedTodayCount}
            </div>
            <span className="text-[0.625rem] text-teal-600 font-semibold">2 Scheduled</span>
          </div>

          <div className="p-3.5 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
              Pending
            </span>
            <div className="text-2xl font-display font-bold text-amber-600">
              {pendingCount}
            </div>
            <span className="text-[0.625rem] text-slate-500 font-medium">Under review</span>
          </div>

          <div className="p-3.5 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
              Completed
            </span>
            <div className="text-2xl font-display font-bold text-emerald-600">
              {completedCount}
            </div>
            <span className="text-[0.625rem] text-slate-500 font-medium">This month</span>
          </div>

          <div className="p-3.5 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
              Reliability
            </span>
            <div className="text-2xl font-display font-bold text-purple-600">
              {reliabilityScore}%
            </div>
            <span className="text-[0.625rem] text-purple-600 font-semibold">0 No Shows</span>
          </div>
        </div>

        {/* ── Hero Search & Book Banner (Image 9 Screen 3) ────────────── */}
        <div className="p-5 rounded-[1.5rem] bg-gradient-to-r from-navy-950 via-navy-900 to-navy-900 text-white shadow-md relative overflow-hidden space-y-3">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[0.625rem] font-mono font-bold uppercase tracking-wider border border-teal-500/30">
              <Sparkles className="w-3 h-3 text-teal-400" />
              <span>Verified Doctor Network</span>
            </div>
            <h2 className="text-base sm:text-lg font-display font-bold text-white tracking-tight leading-tight">
              Find & Book Doctor Appointments
            </h2>
            <p className="text-xs text-slate-300 max-w-md leading-relaxed">
              Search verified specialists in Kurnool across General Medicine, Dermatology, Orthopedics and book detailing slots with instant GatePass issuance.
            </p>
            <div className="pt-1">
              <button
                onClick={() => navigate('/rep/search')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[0.875rem] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-navy-950 font-display font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Search Doctors in Kurnool</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── 6 Quick Actions Grid (Image 9 Screen 3) ─────────────────── */}
        <section className="space-y-3">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
            Representative Field Actions
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* 1. Doctor Discovery */}
            <div
              onClick={() => navigate('/rep/search')}
              className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs hover:border-navy-500/30 transition-all cursor-pointer group active:scale-[0.98] space-y-2.5"
            >
              <div className="w-10 h-10 rounded-[0.875rem] bg-teal-50 text-teal-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-ink group-hover:text-navy-900 transition-colors">
                  Doctor Discovery
                </h3>
                <p className="text-[0.6875rem] text-ink-soft mt-0.5">
                  Browse Kurnool doctors & slots
                </p>
              </div>
            </div>

            {/* 2. My Appointments */}
            <div
              onClick={() => navigate('/rep/history')}
              className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs hover:border-navy-500/30 transition-all cursor-pointer group active:scale-[0.98] space-y-2.5"
            >
              <div className="w-10 h-10 rounded-[0.875rem] bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-ink group-hover:text-navy-900 transition-colors">
                  My Appointments
                </h3>
                <p className="text-[0.6875rem] text-ink-soft mt-0.5">
                  View scheduled visits & passes
                </p>
              </div>
            </div>

            {/* 3. Daily Call Report (DCR) */}
            <div
              onClick={() => navigate('/rep/dcr')}
              className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs hover:border-navy-500/30 transition-all cursor-pointer group active:scale-[0.98] space-y-2.5"
            >
              <div className="w-10 h-10 rounded-[0.875rem] bg-amber-50 text-amber-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-ink group-hover:text-navy-900 transition-colors">
                  Daily Call Report (DCR)
                </h3>
                <p className="text-[0.6875rem] text-ink-soft mt-0.5">
                  Export & share detailing log
                </p>
              </div>
            </div>

            {/* 4. Clinic Notices */}
            <div
              onClick={() => navigate('/rep/notices')}
              className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs hover:border-navy-500/30 transition-all cursor-pointer group active:scale-[0.98] space-y-2.5"
            >
              <div className="w-10 h-10 rounded-[0.875rem] bg-rose-50 text-rose-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-ink group-hover:text-navy-900 transition-colors">
                  Clinic Notices
                </h3>
                <p className="text-[0.6875rem] text-ink-soft mt-0.5">
                  Closures & doctor requests
                </p>
              </div>
            </div>

            {/* 5. Notifications */}
            <div
              onClick={() => navigate('/rep/notifications')}
              className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs hover:border-navy-500/30 transition-all cursor-pointer group active:scale-[0.98] space-y-2.5"
            >
              <div className="w-10 h-10 rounded-[0.875rem] bg-purple-50 text-purple-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-ink group-hover:text-navy-900 transition-colors">
                  Notifications
                </h3>
                <p className="text-[0.6875rem] text-ink-soft mt-0.5">
                  Confirmations & clinic updates
                </p>
              </div>
            </div>

            {/* 6. Visit Analytics */}
            <div
              onClick={() => navigate('/rep/history')}
              className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs hover:border-navy-500/30 transition-all cursor-pointer group active:scale-[0.98] space-y-2.5"
            >
              <div className="w-10 h-10 rounded-[0.875rem] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-ink group-hover:text-navy-900 transition-colors">
                  Visit Analytics
                </h3>
                <p className="text-[0.6875rem] text-ink-soft mt-0.5">
                  Doctor coverage & territory KPI
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Today's Scheduled Visits (Image 9 Screen 3) ─────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold">
              Today's Scheduled Detailing Visits
            </span>
            <button
              onClick={() => navigate('/rep/history')}
              className="text-xs text-navy-900 font-bold hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {todayGatepass ? (
            <div className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-teal-500/40 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-[1rem] bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-base flex-shrink-0">
                    Dr
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-base text-ink">
                        Dr. {todayGatepass.doctorSnapshot?.name || todayGatepass.doctorName}
                      </h3>
                      <MonoTag variant="teal">Pass Ready</MonoTag>
                    </div>
                    <p className="text-xs text-ink-soft">
                      {todayGatepass.doctorSnapshot?.clinicName || todayGatepass.clinicName || 'Remedi Clinic, Kurnool'}
                    </p>
                    <p className="text-xs font-mono text-teal-700 font-semibold mt-1">
                      Slot: {todayGatepass.slotStart} – {todayGatepass.slotEnd}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/status/${todayGatepass.id}`)}
                  className="px-4 py-2 bg-navy-900 hover:bg-navy-800 text-white rounded-[0.75rem] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span>View GatePass</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-display font-bold text-sm text-ink">
                    Dr. T. Karthik (General Medicine)
                  </h4>
                  <p className="text-xs text-ink-soft">
                    Remedi Clinic · Today, 11:00 AM – 11:30 AM
                  </p>
                </div>
                <button
                  onClick={() => navigate('/rep/search')}
                  className="px-3.5 py-1.5 rounded-[0.75rem] bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs transition-all shadow-2xs"
                >
                  View Details
                </button>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Drawer menu */}
      <RepDrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userData={user}
      />

      {/* Rep Bottom Navigation */}
      <RepBottomNav />
    </div>
  );
}
