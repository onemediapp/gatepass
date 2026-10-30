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
  Menu
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
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
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
        // Sweep past pending appointments
        sweepExpiredAppointments(user.uid, 'rep').catch(err => console.warn('Rep sweep error:', err));

        // Load Rep profile
        const rDoc = await getRep(user.uid);
        if (rDoc) setRepProfile(rDoc);

        // Load linked doctors
        const links = await listRepDoctorLinks(user.uid);
        const docIdSet = new Set(links.map(l => l.doctorId));
        setLinkedDoctorIds(docIdSet);

        // Subscribe to appointments
        unsubAppointments = subscribeRepAppointments(user.uid, (all) => {
          setAppointments(all);
          setLoading(false);
        });

        // Subscribe to active network notices
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

  // My Recent Requests (all states, limit 5)
  const recentRequests = appointments.slice(0, 5);

  // Filter notices for doctors the rep has interacted with or general notices
  const doctorFeedNotices = notices.filter(
    (n) => linkedDoctorIds.size === 0 || linkedDoctorIds.has(n.doctorId) || n.pinned
  ).slice(0, 4);

  // Completeness score
  const completeness = calculateRepCompleteness(repProfile, userData);

  // Rep First Name
  const repFirstName = (userData?.name || user?.displayName || 'Representative').split(' ')[0];

  // DCR Generation
  const generateDcrText = () => {
    const dateDisplay = formatDateIST(new Date(), 'dd MMM yyyy');
    let text = `📋 *PHARMA DAILY CALL REPORT (DCR)*\n`;
    text += `👤 *Rep:* ${userData?.name || 'MR'} | ${repProfile?.companyName || 'Pharma'}\n`;
    text += `📅 *Date:* ${dateDisplay}\n`;
    text += `📍 *HQ/City:* ${userData?.city || 'India'}\n\n`;
    text += `*VISITS SCHEDULED / COMPLETED:*\n`;

    const todaysList = appointments.filter(a => a.slotDate === todayStr);

    if (todaysList.length === 0) {
      text += `No scheduled doctor calls logged today.\n`;
    } else {
      todaysList.forEach((a, i) => {
        const docName = a.doctorSnapshot?.name || a.doctorName || 'Doctor';
        const clinic = a.doctorSnapshot?.clinicName || a.clinicName || 'Clinic';
        const statusLabel = a.status === 'completed'
          ? '✅ Met (Completed)'
          : a.status === 'approved'
          ? `🎫 Gatepass Issued (Token: ${a.token || 'Active'})`
          : '⏳ Requested';
        const focus = a.productFocus ? ` [Focus: ${a.productFocus}]` : '';
        text += `${i + 1}. Dr. ${docName} - ${clinic} | ${statusLabel}${focus}\n`;
      });
    }

    text += `\n_Generated via Gatepass Kurnool Medical OS_`;
    return text;
  };

  const handleCopyDcr = () => {
    const text = generateDcrText();
    navigator.clipboard.writeText(text);
    setCopiedDcr(true);
    setTimeout(() => setCopiedDcr(false), 2500);
  };

  const handleShareDcr = () => {
    const text = generateDcrText();
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getNoticeEdge = (type) => {
    switch (type) {
      case 'closure': return 'coral';
      case 'not_accepting': return 'sand';
      case 'looking_for': return 'teal';
      default: return 'navy';
    }
  };

  // Quick counts
  const approvedTodayCount = appointments.filter(a => a.status === 'approved' && a.slotDate === todayStr).length;
  const pendingCount = appointments.filter(a => a.status === 'pending').length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  return (
    <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 pb-28">
      
      {/* ── Top Hero Bar (Midnight Atmosphere) ─────────────────────────── */}
      <section className="bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 text-white pt-8 pb-10 px-4 sm:px-6 rounded-b-[2rem] shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-[-20%] w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="w-11 h-11 rounded-[0.875rem] bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/15 flex items-center justify-center font-display font-bold text-white shadow-inner active:scale-95 transition-all cursor-pointer"
                title="Open field menu"
                aria-label="Open field menu"
              >
                <Menu className="w-5 h-5 text-amber-400" />
              </button>
              <div>
                <p className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                  {getTimeOfDayGreeting()}
                </p>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-white tracking-tight">
                  {repFirstName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="px-2.5 py-1.5 rounded-[0.75rem] bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Menu className="w-4 h-4 text-amber-400" />
                <span>Menu</span>
              </button>
              <MonoTag variant="neutral" className="bg-white/10 text-white border-white/20 backdrop-blur-md">
                {repProfile?.companyName || 'Medical Rep'}
              </MonoTag>
            </div>
          </div>

          {/* Large Search Pill Button */}
          <div 
            onClick={() => navigate('/rep/search')}
            className="w-full bg-white/10 hover:bg-white/15 border border-white/20 rounded-[1.25rem] p-3.5 flex items-center gap-3 cursor-pointer transition-all duration-200 active:scale-[0.99] group shadow-inner backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-[0.75rem] bg-amber-400/20 text-amber-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-slate-300 group-hover:text-white transition-colors truncate">
              Search doctors by name, specialty, or clinic...
            </span>
          </div>

          {/* Quick Metrics Capsule Strip */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
            <div className="bg-white/5 border border-white/10 rounded-[1rem] py-2 px-1 backdrop-blur-xs">
              <span className="text-lg font-bold text-teal-400 block leading-tight tabular-nums">{approvedTodayCount}</span>
              <span className="text-[0.625rem] uppercase text-slate-400 font-sans tracking-tight">Today</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[1rem] py-2 px-1 backdrop-blur-xs">
              <span className="text-lg font-bold text-amber-400 block leading-tight tabular-nums">{pendingCount}</span>
              <span className="text-[0.625rem] uppercase text-slate-400 font-sans tracking-tight">Pending</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-[1rem] py-2 px-1 backdrop-blur-xs">
              <span className="text-lg font-bold text-white block leading-tight tabular-nums">{completedCount}</span>
              <span className="text-[0.625rem] uppercase text-slate-400 font-sans tracking-tight">Visited</span>
            </div>
          </div>

        </div>
      </section>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 -mt-3 space-y-5 relative z-20">

        {/* ── Profile Completeness Banner (If < 100%) ──────────────────── */}
        {completeness < 100 && (
          <EdgeCard edge="amber" className="p-4 bg-white space-y-2 shadow-xs border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[0.75rem] bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5 border border-amber-200">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-xs sm:text-sm text-ink leading-tight">
                    Complete your Rep Profile ({completeness}%)
                  </h3>
                  <p className="text-[0.6875rem] sm:text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Add division, product focus & molecules so doctors approve your slots faster.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/rep/profile')}
                className="px-3 py-1.5 bg-navy-900 hover:bg-navy-800 text-white text-[0.6875rem] font-bold rounded-[0.625rem] transition-colors flex-shrink-0 shadow-xs"
              >
                Edit Profile
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </EdgeCard>
        )}

        {/* ── "Today's Gatepass" Strip (When an approved visit is today) ── */}
        {todayGatepass && (
          <section className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-teal-700 font-bold flex items-center gap-1.5">
                <LiveDot active={true} />
                Today's Active Gatepass
              </span>
              <MonoTag variant="teal">Pass Ready</MonoTag>
            </div>

            <EdgeCard edge="teal" className="p-5 bg-white space-y-4 shadow-md border-teal-200/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-display font-bold text-ink leading-tight">
                    Dr. {todayGatepass.doctorSnapshot?.name || todayGatepass.doctorName}
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-teal-600" />
                    {todayGatepass.doctorSnapshot?.clinicName || todayGatepass.clinicName}
                  </p>
                </div>

                {todayGatepass.token && (
                  <div className="px-3.5 py-1.5 bg-teal-50 border border-teal-500/30 rounded-[0.875rem] text-center shadow-2xs">
                    <span className="font-mono text-[0.5625rem] text-teal-700 uppercase block font-bold tracking-wider">
                      Token
                    </span>
                    <span className="font-mono text-base font-bold text-teal-700 tabular-nums">
                      #{todayGatepass.token}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-[0.875rem] border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-mono text-ink font-semibold">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>
                    Slot: {todayGatepass.slotStart} – {todayGatepass.slotEnd}
                  </span>
                </div>
                <span className="text-[0.6875rem] text-slate-500 font-medium">
                  Show at reception
                </span>
              </div>

              <button
                onClick={() => navigate(`/status/${todayGatepass.id}`)}
                className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-[1rem] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
              >
                <span>Open Live Gatepass</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </EdgeCard>
          </section>
        )}

        {/* ── Empty State: "Find your first doctor" ─────────────────────── */}
        {!loading && appointments.length === 0 && (
          <EdgeCard edge="navy" className="p-6 bg-white text-center space-y-4 shadow-sm border-slate-200">
            <div className="w-14 h-14 rounded-[1.25rem] bg-navy-100 text-navy-900 flex items-center justify-center mx-auto shadow-xs">
              <Stethoscope className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base sm:text-lg text-ink">
                Find Your First Doctor
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1 leading-relaxed">
                Explore participating Kurnool specialists, check their weekly visiting hours, and book a verified consultation slot.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
              <button
                onClick={() => navigate('/rep/search')}
                className="flex-1 py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-[0.875rem] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95"
              >
                <Search className="w-4 h-4 text-amber-400" />
                Search Doctors
              </button>
              <button
                onClick={() => navigate('/clinic/remedi-clinic-kurnool')}
                className="flex-1 py-3 px-4 bg-white border border-slate-200 hover:border-navy-500 text-ink rounded-[0.875rem] font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs active:scale-95"
              >
                <QrCode className="w-4 h-4 text-slate-500" />
                Scan Clinic QR
              </button>
            </div>
          </EdgeCard>
        )}

        {/* ── "From Your Doctors" Notices Feed ─────────────────────────── */}
        {doctorFeedNotices.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-semibold">
                From Your Doctors · Clinical Notices
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {doctorFeedNotices.map((notice) => (
                <EdgeCard
                  key={notice.id}
                  edge={getNoticeEdge(notice.type)}
                  className="p-4 bg-white space-y-1.5 flex flex-col justify-between shadow-xs border-slate-200"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1.5">
                      <h4 className="font-display font-bold text-xs sm:text-sm text-ink leading-tight">
                        {notice.title}
                      </h4>
                      <span className="font-mono text-[0.5625rem] uppercase px-1.5 py-0.5 rounded-[0.375rem] bg-slate-100 border border-slate-200 text-slate-600 flex-shrink-0 font-semibold">
                        {notice.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-[0.6875rem] sm:text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {notice.body}
                    </p>
                  </div>

                  {notice.type === 'looking_for' ? (
                    <div className="pt-2 border-t border-line flex items-center justify-between gap-2">
                      <span className="text-[0.625rem] text-slate-400 font-mono">{formatDateIST(notice.createdAt, 'dd MMM')}</span>
                      <button
                        onClick={() => navigate(`/dr/${notice.doctorSlug || notice.doctorId}/slots?notice=${notice.id}`)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white rounded-[0.625rem] text-xs font-semibold shadow-xs transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>I can help with this</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-line flex items-center justify-between text-[0.625rem] text-slate-400">
                      <span className="font-mono">{formatDateIST(notice.createdAt, 'dd MMM')}</span>
                      <button
                        onClick={() => navigate(`/dr/${notice.doctorSlug || notice.doctorId}`)}
                        className="text-navy-900 font-bold hover:underline inline-flex items-center gap-0.5 py-1"
                      >
                        View Doctor <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </EdgeCard>
              ))}
            </div>
          </section>
        )}

        {/* ── My Requests List (EdgeCards) ─────────────────────────────── */}
        {recentRequests.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-semibold">
                My Requests ({appointments.length})
              </span>
              <button
                onClick={() => navigate('/rep/history')}
                className="text-xs font-bold text-navy-900 hover:underline"
              >
                View all
              </button>
            </div>

            <div className="space-y-2.5">
              {recentRequests.map((appt) => {
                const docName = appt.doctorSnapshot?.name || appt.doctorName || 'Doctor';
                const clinicName = appt.doctorSnapshot?.clinicName || appt.clinicName || 'Clinic';
                
                let edgeColor = 'navy';
                if (appt.status === 'approved') edgeColor = 'teal';
                if (appt.status === 'declined') edgeColor = 'coral';

                return (
                  <EdgeCard
                    key={appt.id}
                    edge={edgeColor}
                    className="p-4 bg-white hover:border-slate-300 transition-all duration-200 cursor-pointer group shadow-xs hover:shadow-sm"
                    onClick={() => navigate(`/status/${appt.id}`)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-bold text-sm text-ink truncate group-hover:text-navy-700 transition-colors">
                            Dr. {docName}
                          </h4>
                          <StatusChip status={appt.status} />
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate font-medium">
                          {clinicName}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="font-mono text-xs font-semibold text-ink block">
                          {appt.slotDate}
                        </span>
                        <span className="font-mono text-[0.6875rem] text-slate-400 block">
                          {appt.slotStart} – {appt.slotEnd}
                        </span>
                      </div>
                    </div>

                    {appt.productFocus && (
                      <div className="mt-2.5 pt-2 border-t border-line flex items-center justify-between text-[0.6875rem] text-slate-500">
                        <span className="truncate">Focus: <strong className="text-slate-700">{appt.productFocus}</strong></span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    )}
                  </EdgeCard>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Daily Call Report (DCR) Generator ────────────────────────── */}
        <section className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-semibold">
              Field Reporting Tool
            </span>
            <MonoTag variant="neutral">DCR Export</MonoTag>
          </div>

          <EdgeCard edge="navy" className="p-5 bg-white space-y-4 shadow-xs border-slate-200">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[0.75rem] bg-navy-100 text-navy-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-display font-bold text-sm text-ink leading-tight">
                  Daily Call Report (DCR)
                </h4>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Generate and share your verified daily doctor visits log directly to WhatsApp or your Area Manager.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => navigate('/rep/dcr')}
                className="py-3 px-4 bg-navy-900 hover:bg-navy-800 text-white rounded-[0.875rem] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Open DCR & Download CSV</span>
              </button>

              <div className="flex gap-2 flex-1">
                <button
                  onClick={handleCopyDcr}
                  className="flex-1 py-3 px-3 bg-white border border-line hover:border-navy-500 text-ink rounded-[0.875rem] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
                >
                  {copiedDcr ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-teal-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleShareDcr}
                  className="py-3 px-3.5 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 rounded-[0.875rem] text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] cursor-pointer"
                  title="Share to WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5 text-teal-700" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            </div>
          </EdgeCard>
        </section>

      </main>

      {/* Slide-out Mobile Menu Drawer */}
      <RepDrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        repProfile={repProfile}
        userData={userData}
      />

      {/* Fixed Rep Bottom Nav */}
      <RepBottomNav />

    </div>
  );
}
