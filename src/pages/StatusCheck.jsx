/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeAppointment, cancelAppointment } from '../lib/db/appointments';
import { getDoctor } from '../lib/db/doctors';
import { getClinic } from '../lib/db/clinics';
import { useAuth } from '../lib/auth';
import { useWakeLock } from '../hooks/useWakeLock';
import { 
  serverNow, 
  todayDateStr, 
  formatDateIST, 
  formatTimeIST, 
  formatSlotRange,
  parseSlotTimeToDate
} from '../lib/time';
import { formatTokenDisplay, computeGatepassTiming } from '../lib/gatepass';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  ShieldCheck, 
  ChevronLeft, 
  Ticket, 
  Share2, 
  AlertTriangle, 
  Coffee,
  Copy,
  Check,
  WifiOff,
  UserX,
  LogIn,
  AlertCircle
} from 'lucide-react';
import Skeleton from '../components/ui/Skeleton';
import EdgeCard from '../components/ui/EdgeCard';
import Perforation from '../components/ui/Perforation';
import LiveDot from '../components/ui/LiveDot';
import MonoTag from '../components/ui/MonoTag';
import LiveSeal from '../components/ui/LiveSeal';
import { cn } from '../lib/utils';

export default function StatusCheck() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user, userData, signInWithGoogle, signOut } = useAuth();

  const [appointment, setAppointment] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Anti-fraud live clock states (1-second tick)
  const [nowMs, setNowMs] = useState(serverNow());
  const secondTick = useMemo(() => Math.floor(nowMs / 1000) % 60, [nowMs]);

  // Offline detection states
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineSeconds, setOfflineSeconds] = useState(0);

  // Screen Wake Lock (keeps display active while pass is shown)
  useWakeLock();

  // ── Offline Listener ────────────────────────────────────────────────
  useEffect(() => {
    let offlineInterval = null;

    const handleOnline = () => {
      setIsOnline(true);
      setOfflineSeconds(0);
      if (offlineInterval) clearInterval(offlineInterval);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setOfflineSeconds(1);
      offlineInterval = setInterval(() => {
        setOfflineSeconds(prev => prev + 1);
      }, 1000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (offlineInterval) clearInterval(offlineInterval);
    };
  }, []);

  const isOfflineOver60s = !isOnline && offlineSeconds > 60;

  // ── Offline Hydration from Cache ─────────────────────────────────────
  useEffect(() => {
    if (!appointmentId) return;
    try {
      const raw = localStorage.getItem(`gatepass_cache_${appointmentId}`);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached?.appointment) {
          setAppointment((prev) => prev || cached.appointment);
          if (cached.doctor) setDoctor((prev) => prev || cached.doctor);
          if (cached.clinic) setClinic((prev) => prev || cached.clinic);
          setLoading(false);
        }
      }
    } catch {
      // storage unavailable or parse error
    }
  }, [appointmentId]);

  // ── Real-time Appointment Subscription ──────────────────────────────
  useEffect(() => {
    if (!appointmentId) return;

    const unsub = subscribeAppointment(appointmentId, async (data) => {
      if (!data) {
        // If offline and we have a cached pass, do not clear the state
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          try {
            const raw = localStorage.getItem(`gatepass_cache_${appointmentId}`);
            if (raw) {
              const cached = JSON.parse(raw);
              if (cached?.appointment) {
                setAppointment(cached.appointment);
                if (cached.doctor) setDoctor(cached.doctor);
                if (cached.clinic) setClinic(cached.clinic);
                setLoading(false);
                return;
              }
            }
          } catch {
            // ignore
          }
        }
        setAppointment(null);
        setLoading(false);
        return;
      }

      setAppointment(data);

      let fetchedDoctor = null;
      let fetchedClinic = null;

      if (data.doctorId) {
        try {
          const docData = await getDoctor(data.doctorId);
          if (docData) {
            fetchedDoctor = docData;
            setDoctor(docData);
          }
        } catch (err) {
          console.error('Error fetching doctor doc:', err);
        }
      }

      if (data.clinicId) {
        try {
          const clinicData = await getClinic(data.clinicId);
          if (clinicData) {
            fetchedClinic = clinicData;
            setClinic(clinicData);
          }
        } catch (err) {
          console.error('Error fetching clinic doc:', err);
        }
      }

      // Persist to local cache for resilient offline display
      try {
        localStorage.setItem(`gatepass_cache_${appointmentId}`, JSON.stringify({
          appointment: data,
          doctor: fetchedDoctor,
          clinic: fetchedClinic,
          cachedAt: Date.now()
        }));
      } catch {
        // storage quota or private browsing
      }

      setLoading(false);
    });

    return () => unsub();
  }, [appointmentId]);

  // ── 1-Second Interval for Anti-Fraud Live Tick & Countdown ──────────
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(serverNow());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Timing & Sub-State Calculations ─────────────────────────────────
  const timingInfo = useMemo(() => {
    if (!appointment) return null;

    let startAtMs = appointment.slotStartAt?.toMillis 
      ? appointment.slotStartAt.toMillis() 
      : appointment.slotStartAt ? new Date(appointment.slotStartAt).getTime() : 0;

    let expiresAtMs = appointment.tokenExpiresAt?.toMillis 
      ? appointment.tokenExpiresAt.toMillis() 
      : appointment.tokenExpiresAt ? new Date(appointment.tokenExpiresAt).getTime() : 0;

    return computeGatepassTiming({
      slotDate: appointment.slotDate,
      slotStart: appointment.slotStart,
      slotEnd: appointment.slotEnd,
      slotStartAtMs: startAtMs,
      tokenExpiresAtMs: expiresAtMs,
      serverNowMs: nowMs,
      todayDateStr: todayDateStr(),
    });
  }, [appointment, nowMs]);

  // ── Handlers ────────────────────────────────────────────────────────
  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  }, []);

  const handleShareWhatsApp = useCallback(() => {
    if (!appointment || !doctor) return;
    const docName = doctor.name || appointment.doctorSnapshot?.name || 'the Doctor';
    const clinicName = clinic?.clinicName || appointment.doctorSnapshot?.clinicName || 'Clinic';
    // Share ONLY the status page URL, not the raw token code (anti-fraud rule)
    const text = `Live Gatepass appointment status with Dr. ${docName} at ${clinicName}: ${window.location.href}`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }, [appointment, doctor, clinic]);

  const handleCancel = async () => {
    if (!appointment || !user) return;
    setActionLoading(true);
    try {
      await cancelAppointment(appointment.id, user.uid);
      setShowCancelModal(false);
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
      alert(err.message || 'Failed to cancel appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Loading Skeleton ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 space-y-4 font-sans">
        <Skeleton className="w-16 h-16 rounded-[1rem]" />
        <Skeleton className="w-48 h-6 rounded-[0.5rem]" />
        <Skeleton className="w-64 h-4 rounded-[0.5rem]" />
      </div>
    );
  }

  // ── Not Signed In Screen ────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 bg-navy-100 rounded-[1.25rem] flex items-center justify-center mb-4">
          <LogIn className="w-8 h-8 text-navy-900" />
        </div>
        <h2 className="text-xl font-display font-bold text-ink mb-1">Sign in to view Gatepass</h2>
        <p className="text-ink-soft text-xs max-w-xs mb-6">
          Access is reserved for the representative and the attending doctor.
        </p>
        <button
          onClick={signInWithGoogle}
          className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 text-white rounded-[0.875rem] text-xs font-semibold shadow-sm hover:bg-navy-700 transition-all active:scale-95"
        >
          Sign In with Google
        </button>
      </div>
    );
  }

  // ── Appointment Not Found ───────────────────────────────────────────
  if (!appointment) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="text-xl font-display font-bold text-ink">Request not found</h2>
        <p className="text-ink-soft text-xs mt-1 max-w-xs">
          This appointment link may have expired or does not exist.
        </p>
        <button
          onClick={() => navigate('/rep/home')}
          className="mt-4 px-4 py-2 bg-navy-900 text-white rounded-[0.875rem] text-xs font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  // ── Security Guard: Only Owning Rep or Attending Doctor ──────────────
  const isOwningRep = user.uid === appointment.repId;
  const isTargetDoctor = user.uid === appointment.doctorId;

  if (!isOwningRep && !isTargetDoctor) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 bg-coral-50 border border-coral-600/30 rounded-[1.25rem] flex items-center justify-center mb-4">
          <UserX className="w-8 h-8 text-coral-600" />
        </div>
        <h2 className="text-xl font-display font-bold text-ink mb-1">Not your pass</h2>
        <p className="text-ink-soft text-xs max-w-xs mb-2">
          This Gatepass belongs to another representative or clinic.
        </p>
        <p className="text-ink-mute text-[0.6875rem] font-mono mb-6">
          Signed in as: {user.email}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/rep/home')}
            className="px-4 py-2 bg-navy-900 text-white rounded-[0.875rem] text-xs font-semibold"
          >
            Go to My Home
          </button>
          <button
            onClick={signOut}
            className="px-4 py-2 bg-white border border-line text-ink rounded-[0.875rem] text-xs font-semibold"
          >
            Switch Account
          </button>
        </div>
      </div>
    );
  }

  // ── Formatters ──────────────────────────────────────────────────────
  const repName = appointment.repSnapshot?.name || 'Representative';
  const repCompany = appointment.repSnapshot?.company || '';
  const repDesignation = appointment.repSnapshot?.designation || '';
  const docName = doctor?.name || appointment.doctorSnapshot?.name || 'Doctor';
  const docSpecialty = doctor?.specialty || appointment.doctorSnapshot?.specialty || 'Consultant';
  const clinicTitle = clinic?.clinicName || appointment.doctorSnapshot?.clinicName || 'Clinic';
  const clinicCity = clinic?.city || doctor?.city || appointment.doctorSnapshot?.city || 'Kurnool';

  // Format date: "Tue 28 Oct"
  let formattedDate = appointment.slotDate;
  try {
    const slotD = parseSlotTimeToDate(appointment.slotDate, '12:00');
    formattedDate = formatDateIST(slotD, 'EEE dd MMM');
  } catch {
    formattedDate = appointment.slotDate;
  }

  // Format slot: "2:00 – 2:20 PM"
  const formattedSlot = formatSlotRange(appointment.slotStart, appointment.slotEnd);

  // Format token: e.g. "RM4729" -> "[ RM · 4729 ]"
  const tokenDisplay = formatTokenDisplay(appointment.token);

  // Issue time
  const issuedTimestamp = appointment.tokenIssuedAt || appointment.decidedAt || appointment.createdAt;
  const issuedTimeStr = issuedTimestamp ? formatTimeIST(issuedTimestamp, 'h:mm a') : '10:00 AM';

  // Doctor response time estimate
  const avgReplyHours = doctor?.stats?.avgResponseTimeHours;
  const replyTimeText = avgReplyHours ? `~${avgReplyHours} hours` : 'before clinic hours';

  // ════════════════════════════════════════════════════════════════════
  // 1. APPROVED PASS: THE GATEPASS ⭐ (Full screen boarding pass)
  // ════════════════════════════════════════════════════════════════════
  if (appointment.status === 'approved') {
    const { subState, countdownLabel, formattedTimer } = timingInfo || {
      subState: 'valid',
      countdownLabel: 'VALID FOR',
      formattedTimer: '--h --m --s'
    };

    return (
      <div className="min-h-screen bg-navy-900 font-sans selection:bg-amber-100 selection:text-sand-600 flex flex-col justify-between p-4 sm:p-6 relative overflow-x-hidden">
        
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── Offline Banner ────────────────────────────────────────── */}
        {!isOnline && (
          <div className="max-w-sm mx-auto w-full mb-3 z-30">
            <div className={cn(
              'px-3 py-2 rounded-[0.875rem] flex items-center justify-center gap-2 text-xs font-semibold text-center',
              isOfflineOver60s ? 'bg-coral-50 border border-coral-600/30 text-coral-600' : 'bg-sand-50 border border-sand-600/30 text-sand-600'
            )}>
              <WifiOff className="w-4 h-4 shrink-0" />
              <span>
                {isOfflineOver60s
                  ? 'Reconnect to verify. Offline for > 60s.'
                  : 'Offline — showing cached pass.'}
              </span>
            </div>
          </div>
        )}

        {/* ── Top Bar (Close/Home Pill) ─────────────────────────────── */}
        <div className="max-w-sm mx-auto w-full flex items-center justify-between py-2 z-20">
          <button
            onClick={() => navigate(isOwningRep ? '/rep/home' : '/admin/today')}
            className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all"
            title="Return"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
            <LiveDot />
            <span className="text-white text-[0.6875rem] font-mono font-semibold tracking-wider uppercase">
              Live Phone Pass
            </span>
          </div>

          <button
            onClick={handleCopyLink}
            className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-full transition-all"
            title="Copy Pass Link"
          >
            {copiedLink ? <Check className="w-5 h-5 text-teal-600" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* ── Boarding Pass Card ─────────────────────────────────────── */}
        <div className="max-w-sm mx-auto w-full bg-white rounded-card overflow-hidden shadow-card border border-line flex flex-col relative z-10 animate-in fade-in duration-300">
          
          {/* ── NAVY HEADER with Shimmer Sweep & Animated Check ───────── */}
          <div className="bg-navy-900 pt-7 pb-6 px-6 text-center text-white relative overflow-hidden">
            {/* Shimmer sweep animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer-sweep pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Animated draw checkmark */}
              <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center mb-2.5 shadow-sm">
                <svg
                  className="w-7 h-7 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" className="animate-draw-check" />
                </svg>
              </div>

              <h1 className="text-xl font-display font-bold tracking-wider text-white">
                GATEPASS · APPROVED
              </h1>
              <p className="font-mono text-[0.6875rem] font-semibold tracking-widest text-teal-50 uppercase mt-0.5">
                Verified Clinical Entry
              </p>
            </div>
          </div>

          {/* ── Perforation Divider with Side Notches ─────────────────── */}
          <div className="relative -my-2.5 z-20">
            <Perforation bgClass="bg-navy-900" className="my-0" />
          </div>

          {/* ── Ticket Middle Section ─────────────────────────────────── */}
          <div className="p-6 pt-3 space-y-4">
            
            {/* Doctor & Clinic Details */}
            <div className="flex items-start justify-between border-b border-line pb-3.5">
              <div className="min-w-0 pr-3">
                <p className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute">Doctor</p>
                <h2 className="text-base font-display font-bold text-ink truncate">
                  Dr. {docName}
                </h2>
                <p className="text-xs text-ink-soft truncate">{docSpecialty}</p>
              </div>

              <div className="text-right min-w-0 pl-3">
                <p className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute">Clinic</p>
                <p className="text-sm font-bold text-ink truncate">{clinicTitle}</p>
                <p className="text-xs text-ink-soft truncate">{clinicCity}</p>
              </div>
            </div>

            {/* Date & Slot Details */}
            <div className="grid grid-cols-2 gap-3 bg-cream-50 rounded-[0.875rem] p-3 border border-line">
              <div className="border-r border-line pr-2">
                <p className="flex items-center gap-1 text-[0.625rem] text-ink-mute font-mono font-semibold uppercase tracking-wider mb-0.5">
                  <Calendar className="w-3 h-3 text-amber-500" /> Date
                </p>
                <p className="text-xs sm:text-sm font-bold text-ink truncate">{formattedDate}</p>
              </div>

              <div className="pl-1">
                <p className="flex items-center gap-1 text-[0.625rem] text-ink-mute font-mono font-semibold uppercase tracking-wider mb-0.5">
                  <Clock className="w-3 h-3 text-teal-600" /> Slot
                </p>
                <p className="text-xs sm:text-sm font-bold text-ink truncate">{formattedSlot}</p>
              </div>
            </div>

            {/* ── Token Display (JetBrains Mono, ~3.5rem) ─────────────── */}
            <div className="text-center py-2 relative">
              <p className="text-[0.625rem] font-mono uppercase tracking-widest text-ink-mute mb-1">
                Reception Entry Token
              </p>

              <div className={cn(
                'inline-block px-4 py-2 rounded-[1rem] transition-all',
                subState === 'expired'
                  ? 'bg-cream-50 text-ink-mute/40 line-through'
                  : subState === 'not_yet_valid'
                  ? 'bg-sand-50/70 text-sand-600 filter blur-[1px]'
                  : subState === 'expiring'
                  ? 'bg-amber-50 text-amber-500 border border-amber-500/30'
                  : 'bg-teal-50 text-teal-600 border border-teal-600/30'
              )}>
                <div className="font-mono text-[2.75rem] sm:text-[3.5rem] leading-none font-bold tracking-widest">
                  {tokenDisplay}
                </div>
              </div>

              {subState === 'not_yet_valid' && (
                <p className="text-[0.6875rem] font-medium text-sand-600 mt-1">
                  Reveals at slot start time
                </p>
              )}
            </div>

            {/* ── Live Countdown Timer ─────────────────────────────────── */}
            <div className="text-center">
              <p className="text-[0.625rem] font-mono uppercase tracking-widest text-ink-mute mb-0.5">
                {countdownLabel}
              </p>
              <p className={cn(
                'font-mono text-base sm:text-lg font-bold tracking-tight',
                subState === 'expiring'
                  ? 'text-amber-500 motion-safe:animate-pulse'
                  : subState === 'expired'
                  ? 'text-coral-600'
                  : subState === 'not_yet_valid'
                  ? 'text-sand-600'
                  : 'text-teal-600'
              )}>
                {subState === 'expired' ? 'This pass has expired' : formattedTimer}
              </p>
            </div>
          </div>

          {/* ── Perforation Divider with Side Notches ─────────────────── */}
          <div className="relative -my-2.5 z-20">
            <Perforation bgClass="bg-navy-900" className="my-0" />
          </div>

          {/* ── Rep Summary & Anti-Fraud Live Seal ─────────────────────── */}
          <div className="p-6 pt-3 bg-cream-50/50 space-y-4">
            
            <div className="border-b border-line pb-3">
              <p className="text-xs font-bold text-ink truncate">
                REP: {repName} {repCompany ? `· ${repCompany}` : ''} {repDesignation ? `· ${repDesignation}` : ''}
              </p>
              <p className="text-[0.6875rem] text-ink-mute mt-0.5">
                Issued {issuedTimeStr} · server time
              </p>
            </div>

            {/* Live rotating seal with seconds tick */}
            <LiveSeal
              status={subState}
              secondTick={secondTick}
              isOfflineOver60s={isOfflineOver60s}
            />

            <p className="text-center text-[0.6875rem] font-medium text-ink-soft">
              Show this screen at reception
            </p>
          </div>
        </div>

        {/* ── Bottom Action CTAs ─────────────────────────────────────── */}
        <div className="max-w-sm mx-auto w-full mt-4 space-y-2 z-20">
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-semibold rounded-[0.875rem] transition-all flex items-center justify-center gap-2 text-xs border border-white/15"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>Share via WhatsApp</span>
          </button>

          {isOwningRep && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="w-full py-2.5 text-coral-50 hover:text-white text-xs font-medium transition-colors"
            >
              Cancel Appointment
            </button>
          )}
        </div>

        {/* ── Cancel Confirmation Modal ─────────────────────────────── */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-navy-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-card p-6 max-w-xs w-full text-center space-y-4 shadow-card border border-line">
              <div className="w-12 h-12 rounded-full bg-coral-50 text-coral-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-display font-bold text-ink">Cancel this pass?</h3>
              <p className="text-xs text-ink-soft">
                Your approved slot and token will be released back to the clinic.
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  disabled={actionLoading}
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 bg-cream-50 text-ink rounded-[0.875rem] text-xs font-semibold hover:bg-line transition-colors"
                >
                  Keep Pass
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleCancel}
                  className="px-4 py-2.5 bg-coral-600 text-white rounded-[0.875rem] text-xs font-semibold hover:bg-coral-700 transition-colors"
                >
                  {actionLoading ? 'Cancelling…' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // 2. PENDING REQUEST: Under Review
  // ════════════════════════════════════════════════════════════════════
  if (appointment.status === 'pending') {
    return (
      <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 flex flex-col p-4 sm:p-6 pb-12">
        <div className="max-w-md mx-auto w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(isOwningRep ? '/rep/home' : '/admin/pending')}
            className="p-2 bg-white shadow-sm border border-line rounded-[0.75rem] text-ink hover:bg-cream-50 transition-all active:scale-95"
            title="Return"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <MonoTag variant="amber">Reviewing</MonoTag>
        </div>

        <div className="max-w-md mx-auto w-full space-y-4 my-auto">
          {/* EdgeCard Sand */}
          <EdgeCard edge="sand" className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <LiveDot />
              <span className="text-xs font-semibold text-sand-600 uppercase font-mono tracking-wider">
                Request Pending
              </span>
            </div>

            <div>
              <h1 className="text-xl font-display font-bold text-ink">
                Dr. {docName} is reviewing your request.
              </h1>
              <p className="text-xs text-ink-soft mt-1">
                {clinicTitle} · {clinicCity}
              </p>
            </div>

            {/* Exact Slot */}
            <div className="bg-cream-50 rounded-[0.875rem] p-3.5 border border-line space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-ink-mute flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-sand-600" /> Date
                </span>
                <span className="font-bold text-ink">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-line/60 pt-2">
                <span className="text-ink-mute flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-sand-600" /> Requested Slot
                </span>
                <span className="font-bold text-ink">{formattedSlot}</span>
              </div>
            </div>

            {/* Request Summary */}
            <div className="space-y-2 text-xs border-t border-line pt-3">
              <p className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute">
                Request Summary
              </p>
              {appointment.productFocus && (
                <div>
                  <span className="text-ink-mute">Product Focus: </span>
                  <span className="font-semibold text-ink">{appointment.productFocus}</span>
                </div>
              )}
              {appointment.therapeuticCategory && (
                <div>
                  <span className="text-ink-mute">Category: </span>
                  <span className="font-semibold text-ink">{appointment.therapeuticCategory}</span>
                </div>
              )}
              {appointment.samplesFlag && (
                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-50 text-teal-600 font-medium text-[0.6875rem]">
                  Samples to share
                </div>
              )}
              {appointment.message && (
                <div className="bg-cream-50 p-2.5 rounded-[0.625rem] border border-line text-ink italic mt-1">
                  "{appointment.message}"
                </div>
              )}
            </div>

            {/* Reply Expectation */}
            <p className="text-xs text-ink-mute">
              Doctors usually reply {replyTimeText}. This page updates automatically upon decision.
            </p>
          </EdgeCard>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-3 bg-white border border-line hover:bg-cream-50 active:scale-95 text-ink font-semibold rounded-[0.875rem] transition-all flex items-center justify-center gap-2 text-xs shadow-sm"
            >
              {copiedLink ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4 text-ink-mute" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Status Link'}</span>
            </button>

            {isOwningRep && (
              <button
                disabled={actionLoading}
                onClick={handleCancel}
                className="w-full py-3 bg-transparent text-ink-soft hover:text-coral-600 text-xs font-semibold transition-colors"
              >
                {actionLoading ? 'Cancelling…' : 'Cancel Request'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // 3. DECLINED REQUEST
  // ════════════════════════════════════════════════════════════════════
  if (appointment.status === 'declined' || appointment.status === 'rejected') {
    const doctorSlug = doctor?.profileSlug || appointment.doctorId;
    const canWhatsApp = Boolean(doctor?.contactSettings?.allowRepWhatsApp || doctor?.whatsappNumber);

    return (
      <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 flex flex-col p-4 sm:p-6 pb-12">
        <div className="max-w-md mx-auto w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(isOwningRep ? '/rep/home' : '/admin/pending')}
            className="p-2 bg-white shadow-sm border border-line rounded-[0.75rem] text-ink hover:bg-cream-50 transition-all active:scale-95"
            title="Return"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <MonoTag variant="neutral">Declined</MonoTag>
        </div>

        <div className="max-w-md mx-auto w-full space-y-4 my-auto">
          <EdgeCard edge="coral" className="p-6 space-y-4">
            <div className="w-12 h-12 bg-coral-50 border border-coral-600/30 rounded-[1.25rem] flex items-center justify-center">
              <XCircle className="w-6 h-6 text-coral-600" />
            </div>

            <div>
              <h1 className="text-xl font-display font-bold text-ink">
                Dr. {docName} couldn't take this slot.
              </h1>
              <p className="text-xs text-ink-soft mt-1">
                Requested on {formattedDate} ({formattedSlot})
              </p>
            </div>

            {appointment.declineReason && (
              <div className="bg-coral-50/60 p-3 rounded-[0.75rem] border border-coral-600/20 text-xs text-ink">
                <span className="font-semibold text-coral-600 block mb-0.5">Note from doctor:</span>
                "{appointment.declineReason}"
              </div>
            )}
          </EdgeCard>

          <div className="space-y-2 pt-2">
            <button
              onClick={() => navigate(`/dr/${doctorSlug}/slots`)}
              className="w-full py-3.5 bg-navy-900 hover:bg-navy-700 active:scale-95 text-white font-bold rounded-[0.875rem] transition-all text-xs shadow-sm"
            >
              Pick Another Slot
            </button>

            {canWhatsApp && (
              <button
                onClick={() => {
                  const num = doctor?.whatsappNumber || '';
                  const cleanNum = num.replace(/\D/g, '');
                  const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(`Hi Dr. ${docName}, regarding my request for ${formattedDate}...`)}`;
                  window.open(waUrl, '_blank');
                }}
                className="w-full py-3 bg-white border border-line hover:bg-cream-50 active:scale-95 text-ink font-semibold rounded-[0.875rem] transition-all text-xs flex items-center justify-center gap-2"
              >
                <span>Message on WhatsApp</span>
              </button>
            )}

            <button
              onClick={() => navigate('/rep/home')}
              className="w-full py-2.5 text-ink-soft text-xs font-medium hover:text-ink transition-colors"
            >
              Return to Rep Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // 4. CANCELLED / EXPIRED QUIET STATES
  // ════════════════════════════════════════════════════════════════════
  const isCancelled = appointment.status === 'cancelled';

  return (
    <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 flex flex-col p-4 sm:p-6 pb-12">
      <div className="max-w-md mx-auto w-full flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(isOwningRep ? '/rep/home' : '/admin/today')}
          className="p-2 bg-white shadow-sm border border-line rounded-[0.75rem] text-ink hover:bg-cream-50 transition-all active:scale-95"
          title="Return"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <MonoTag variant="neutral">{isCancelled ? 'Cancelled' : 'Expired'}</MonoTag>
      </div>

      <div className="max-w-md mx-auto w-full space-y-4 my-auto text-center">
        <div className="w-16 h-16 bg-cream-50 border border-line rounded-[1.25rem] flex items-center justify-center mx-auto text-2xl">
          {isCancelled ? '✕' : '⏳'}
        </div>

        <h1 className="text-xl font-display font-bold text-ink">
          {isCancelled ? 'Request Cancelled' : 'Token Expired'}
        </h1>
        <p className="text-xs text-ink-soft max-w-xs mx-auto">
          {isCancelled
            ? 'This appointment was cancelled. The slot has been released.'
            : 'This Gatepass has expired and is no longer valid for reception entry.'}
        </p>

        <div className="pt-4">
          <button
            onClick={() => navigate('/rep/home')}
            className="px-6 py-3 bg-navy-900 text-white rounded-[0.875rem] text-xs font-semibold shadow-sm hover:bg-navy-700 transition-all active:scale-95"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
