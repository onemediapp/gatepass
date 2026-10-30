/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeAppointment, updateAppointment } from '../lib/db/appointments';
import { cancelAppointmentTransaction } from '../lib/db/transactions';
import { createReviewRequest } from '../lib/db/reviewRequests';
import { buildWhatsAppUrl, formatWhatsAppMessage } from '../lib/whatsapp';
import { getDoctor } from '../lib/db/doctors';
import { getClinic } from '../lib/db/clinics';
import { useAuth } from '../lib/auth';
import { useWakeLock } from '../hooks/useWakeLock';
import ManageSheet from '../components/ui/ManageSheet';
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
  AlertCircle,
  BellRing
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
  const [showManageSheet, setShowManageSheet] = useState(false);
  const [showReconsiderModal, setShowReconsiderModal] = useState(false);
  const [reconsiderMessage, setReconsiderMessage] = useState('');
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

  const handleConfirmComing = async () => {
    if (!appointment || !user) return;
    setActionLoading(true);
    try {
      await updateAppointment(appointment.id, {
        repConfirmedAt: new Date(),
        lastChangeAt: new Date(),
        lastChangeBy: 'rep'
      });
      setShowManageSheet(false);
    } catch (err) {
      alert(err.message || 'Failed to confirm attendance');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkArrived = async () => {
    if (!appointment || !user) return;
    setActionLoading(true);
    try {
      await updateAppointment(appointment.id, {
        arrivedAt: new Date(),
        lastChangeAt: new Date(),
        lastChangeBy: 'rep'
      });
      setShowManageSheet(false);
    } catch (err) {
      alert(err.message || 'Failed to mark arrival');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelVisit = async (reason) => {
    if (!appointment || !user) return;
    setActionLoading(true);
    try {
      await cancelAppointmentTransaction({
        appointmentId: appointment.id,
        userId: user.uid,
        userRole: user.uid === appointment.doctorId ? 'doctor' : 'rep',
        cancelReason: reason,
        cancelCutoffMinutes: 60
      });
      setShowManageSheet(false);
      setShowCancelModal(false);
    } catch (err) {
      alert(err.message || 'Failed to cancel');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    await handleCancelVisit('Rep cancelled request');
  };

  const handleReschedule = () => {
    const slug = doctor?.profileSlug || appointment.doctorId;
    navigate(`/dr/${slug}/slots?rescheduleOf=${appointment.id}`);
  };

  const handleDismissMoved = async () => {
    if (!appointment) return;
    try {
      await updateAppointment(appointment.id, {
        movedSeenByRep: true
      });
    } catch (err) {
      console.error('Failed to dismiss moved notice:', err);
    }
  };

  const handleSendReconsider = async (e) => {
    e.preventDefault();
    if (!reconsiderMessage.trim() || !appointment || !user) return;
    setActionLoading(true);
    try {
      await createReviewRequest({
        doctorId: appointment.doctorId,
        repId: user.uid,
        repSnapshot: appointment.repSnapshot,
        kind: 'reconsider',
        appointmentId: appointment.id,
        message: reconsiderMessage.trim().slice(0, 240)
      });
      setShowReconsiderModal(false);
      alert('Your request to reconsider has been submitted to Dr. ' + (doctor?.name || 'the Doctor'));
    } catch (err) {
      alert(err.message || 'Failed to send reconsider request');
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
  // 1. APPROVED PASS: THE GATEPASS ⭐ (Flagship Boarding Pass)
  // ════════════════════════════════════════════════════════════════════
  if (appointment.status === 'approved') {
    const { subState, countdownLabel, formattedTimer } = timingInfo || {
      subState: 'valid',
      countdownLabel: 'VALID FOR',
      formattedTimer: '--h --m --s'
    };

    return (
      <div className="min-h-screen bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950 font-sans selection:bg-amber-100 selection:text-sand-600 flex flex-col justify-between p-4 sm:p-6 relative overflow-x-hidden">
        
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* ── Offline Banner ────────────────────────────────────────── */}
        {!isOnline && (
          <div className="max-w-sm mx-auto w-full mb-3 z-30">
            <div className={cn(
              'px-3 py-2 rounded-[1rem] flex items-center justify-center gap-2 text-xs font-semibold text-center shadow-md',
              isOfflineOver60s ? 'bg-coral-50 border border-coral-600/30 text-coral-600' : 'bg-amber-50 border border-amber-500/30 text-amber-700'
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

        {/* ── Top Bar (Close/Home & Action Pills) ────────────────────── */}
        <div className="max-w-sm mx-auto w-full flex items-center justify-between py-2 z-20">
          <button
            onClick={() => navigate(isOwningRep ? '/rep/home' : '/admin/today')}
            className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-90 text-white rounded-full transition-all backdrop-blur-md border border-white/10"
            title="Return"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-white/20 shadow-sm">
            <LiveDot size="sm" />
            <span className="text-white text-[0.6875rem] font-mono font-bold tracking-widest uppercase">
              Live Phone Pass
            </span>
          </div>

          <button
            onClick={handleCopyLink}
            className="p-2.5 bg-white/10 hover:bg-white/20 active:scale-90 text-white rounded-full transition-all backdrop-blur-md border border-white/10"
            title="Copy Pass Link"
          >
            {copiedLink ? <Check className="w-5 h-5 text-teal-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {/* ── Call-in Banner (Doctor is Ready) ───────────────────────── */}
        {appointment.calledInAt && (
          <div className="max-w-sm mx-auto w-full mb-3 z-30">
            <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-4 rounded-[1.25rem] shadow-xl flex items-center gap-3 animate-bounce border border-teal-300/40">
              <BellRing className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-xs uppercase tracking-wider font-mono">Please Proceed Inside Now</p>
                <p className="text-xs text-teal-100 font-medium mt-0.5">Dr. {docName} is ready to see you.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Delay / Pause Banner ─────────────────────────────────────── */}
        {doctor?.todayStatus?.date === appointment.slotDate && (doctor?.todayStatus?.status === 'running_late' || doctor?.todayStatus?.status === 'paused') && (
          <div className="max-w-sm mx-auto w-full mb-3 z-30">
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-navy-950 p-4 rounded-[1.25rem] shadow-lg flex items-center gap-3 border border-amber-300">
              <Clock className="w-5 h-5 shrink-0 text-navy-950" />
              <div>
                <p className="font-bold text-xs">
                  {doctor.todayStatus.status === 'running_late'
                    ? `Dr. ${docName} is running ~${doctor.todayStatus.estimatedDelayMinutes || 30} mins behind schedule`
                    : `Dr. ${docName}'s clinic is temporarily paused`}
                </p>
                {doctor.todayStatus.note && (
                  <p className="text-[0.6875rem] text-navy-950/80 mt-0.5 font-medium">{doctor.todayStatus.note}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Doctor Moved Banner ────────────────────────────────────── */}
        {appointment.movedFrom && !appointment.movedSeenByRep && (
          <div className="max-w-sm mx-auto w-full mb-3 z-30">
            <div className="bg-white text-ink p-4 rounded-[1.25rem] shadow-xl border border-amber-300 space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-bold text-xs">Dr. {docName} rescheduled your visit</p>
              </div>
              <p className="text-xs text-slate-600">
                Rescheduled from {appointment.movedFrom.slotDate} ({appointment.movedFrom.slotStart}–{appointment.movedFrom.slotEnd}) to {formattedDate} ({formattedSlot}).
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleDismissMoved}
                  className="px-3 py-1.5 bg-navy-900 text-white text-xs font-bold rounded-[0.625rem]"
                >
                  Accept New Slot
                </button>
                <button
                  onClick={() => handleCancelVisit('Doctor moved slot not suitable')}
                  className="px-3 py-1.5 bg-white border border-coral-200 text-coral-600 text-xs font-semibold rounded-[0.625rem]"
                >
                  Cancel Visit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Boarding Pass Card ─────────────────────────────────────── */}
        <div className="max-w-sm mx-auto w-full bg-white rounded-[1.75rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.15)] border border-slate-100 flex flex-col relative z-10 animate-in fade-in duration-300">
          
          {/* ── NAVY HEADER with Holographic Shimmer & Animated Check ─── */}
          <div className="bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 pt-8 pb-6 px-6 text-center text-white relative overflow-hidden">
            {/* Holographic sweep sheen */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-sweep pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center">
              {/* Animated draw checkmark */}
              <div className="w-13 h-13 rounded-full bg-teal-500/90 border border-teal-300/40 flex items-center justify-center mb-2.5 shadow-[0_0_16px_rgba(20,184,166,0.6)]">
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

              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <h1 className="text-xl font-display font-bold tracking-widest text-white">
                  GATEPASS · APPROVED
                </h1>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
              <p className="font-mono text-[0.6875rem] font-bold tracking-widest text-teal-300 uppercase mt-0.5">
                Verified Clinical Entry
              </p>
            </div>
          </div>

          {/* ── Perforation Divider with Side Notches ─────────────────── */}
          <div className="relative -my-3 z-20">
            <Perforation bgClass="bg-navy-950" className="my-0" />
          </div>

          {/* ── Ticket Middle Section ─────────────────────────────────── */}
          <div className="p-6 pt-3 space-y-4">
            
            {/* Doctor & Clinic Details */}
            <div className="flex items-start justify-between border-b border-line pb-3.5">
              <div className="min-w-0 pr-3">
                <p className="text-[0.625rem] font-mono uppercase tracking-wider text-slate-400 font-semibold">Doctor</p>
                <h2 className="text-base font-display font-bold text-ink truncate">
                  Dr. {docName}
                </h2>
                <p className="text-xs text-slate-500 truncate font-medium">{docSpecialty}</p>
              </div>

              <div className="text-right min-w-0 pl-3">
                <p className="text-[0.625rem] font-mono uppercase tracking-wider text-slate-400 font-semibold">Clinic</p>
                <p className="text-sm font-bold text-ink truncate">{clinicTitle}</p>
                <p className="text-xs text-slate-500 truncate font-medium">{clinicCity}</p>
              </div>
            </div>

            {/* Date & Slot Details */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50/90 rounded-[1rem] p-3 border border-slate-200/80 shadow-2xs">
              <div className="border-r border-slate-200 pr-2">
                <p className="flex items-center gap-1 text-[0.625rem] text-slate-400 font-mono font-bold uppercase tracking-wider mb-0.5">
                  <Calendar className="w-3 h-3 text-amber-500" /> Date
                </p>
                <p className="text-xs sm:text-sm font-bold text-ink truncate">{formattedDate}</p>
              </div>

              <div className="pl-1">
                <p className="flex items-center gap-1 text-[0.625rem] text-slate-400 font-mono font-bold uppercase tracking-wider mb-0.5">
                  <Clock className="w-3 h-3 text-teal-600" /> Slot
                </p>
                <p className="text-xs sm:text-sm font-bold text-ink truncate">{formattedSlot}</p>
              </div>
            </div>

            {/* ── Token Display (JetBrains Mono, High Legibility) ───────── */}
            <div className="text-center py-2 relative">
              <p className="text-[0.625rem] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-1.5">
                Reception Entry Token
              </p>

              <div className={cn(
                'inline-block px-5 py-2.5 rounded-[1.25rem] transition-all duration-300 shadow-sm',
                subState === 'expired'
                  ? 'bg-slate-100 text-slate-400 line-through border border-slate-200'
                  : subState === 'not_yet_valid'
                  ? 'bg-amber-50/80 text-amber-700 border border-amber-400/40'
                  : subState === 'expiring'
                  ? 'bg-amber-50 text-amber-600 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                  : 'bg-gradient-to-b from-teal-50 to-emerald-50/50 text-teal-700 border border-teal-500/40 shadow-[0_0_20px_rgba(20,184,166,0.15)]'
              )}>
                <div className="font-mono text-[2.75rem] sm:text-[3.25rem] leading-none font-bold tracking-widest tabular-nums">
                  {tokenDisplay}
                </div>
              </div>

              {subState === 'not_yet_valid' && (
                <p className="text-[0.6875rem] font-semibold text-amber-700 mt-1.5 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" /> Reveals active at slot start time
                </p>
              )}
            </div>

            {/* ── Live Countdown Timer ─────────────────────────────────── */}
            <div className="text-center">
              <p className="text-[0.625rem] font-mono uppercase tracking-widest text-slate-400 font-semibold mb-0.5">
                {countdownLabel}
              </p>
              <p className={cn(
                'font-mono text-base sm:text-lg font-bold tracking-tight tabular-nums',
                subState === 'expiring'
                  ? 'text-amber-500 motion-safe:animate-pulse'
                  : subState === 'expired'
                  ? 'text-coral-600'
                  : subState === 'not_yet_valid'
                  ? 'text-amber-600'
                  : 'text-teal-600'
              )}>
                {subState === 'expired' ? 'This pass has expired' : formattedTimer}
              </p>
            </div>
          </div>

          {/* ── Perforation Divider with Side Notches ─────────────────── */}
          <div className="relative -my-3 z-20">
            <Perforation bgClass="bg-navy-950" className="my-0" />
          </div>

          {/* ── Rep Summary & Anti-Fraud Live Seal ─────────────────────── */}
          <div className="p-6 pt-3 bg-slate-50/60 space-y-4">
            
            <div className="border-b border-line pb-3 flex items-center justify-between">
              <div className="min-w-0 pr-2">
                <p className="text-xs font-bold text-ink truncate">
                  {repName}
                </p>
                <p className="text-[0.6875rem] text-slate-500 truncate">
                  {repCompany ? `${repCompany} ` : ''}{repDesignation ? `· ${repDesignation}` : ''}
                </p>
              </div>
              <MonoTag variant="neutral">MR PASS</MonoTag>
            </div>

            {/* Live rotating seal with seconds tick */}
            <LiveSeal
              status={subState}
              secondTick={secondTick}
              isOfflineOver60s={isOfflineOver60s}
            />

            {/* Anti-counterfeit barcode simulation */}
            <div className="pt-1 flex flex-col items-center gap-1 select-none opacity-60">
              <div className="flex items-center gap-0.5 h-5">
                {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 3, 1, 2, 3, 1, 4, 2, 1, 2, 3].map((w, idx) => (
                  <div key={idx} className="bg-slate-700 h-full rounded-xs" style={{ width: `${w * 1.5}px` }} />
                ))}
              </div>
              <span className="font-mono text-[0.5625rem] text-slate-400 tracking-widest uppercase">
                GP-AUTH-SEC-2026 · KURNOOL PROTOCOL
              </span>
            </div>

            <p className="text-center text-[0.6875rem] font-bold text-slate-600">
              Show this live screen at reception desk
            </p>
          </div>
        </div>

        {/* ── Bottom Action CTAs ─────────────────────────────────────── */}
        <div className="max-w-sm mx-auto w-full mt-4 space-y-2.5 z-20">
          {isOwningRep && (
            <button
              onClick={() => setShowManageSheet(true)}
              className="w-full py-3.5 bg-white text-navy-900 font-bold rounded-[1rem] transition-all flex items-center justify-center gap-2 text-xs shadow-lg hover:bg-slate-50 active:scale-[0.98]"
            >
              <Ticket className="w-4 h-4 text-navy-900" />
              <span>Manage Visit & Arrival</span>
            </button>
          )}

          <button
            onClick={handleShareWhatsApp}
            className="w-full py-3 bg-white/10 hover:bg-white/20 active:scale-[0.98] text-white font-semibold rounded-[1rem] transition-all flex items-center justify-center gap-2 text-xs border border-white/20 backdrop-blur-md"
          >
            <Share2 className="w-4 h-4 text-teal-300" />
            <span>Share via WhatsApp</span>
          </button>
        </div>

        {/* ── Manage Visit Sheet ────────────────────────────────────── */}
        <ManageSheet
          isOpen={showManageSheet}
          onClose={() => setShowManageSheet(false)}
          appointment={appointment}
          doctor={doctor}
          clinic={clinic}
          onConfirmComing={handleConfirmComing}
          onMarkArrived={handleMarkArrived}
          onCancelVisit={handleCancelVisit}
          onReschedule={handleReschedule}
          actionLoading={actionLoading}
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // 2. COMPLETED VISIT: Concluded Pass ⭐
  // ════════════════════════════════════════════════════════════════════
  if (appointment.status === 'completed') {
    return (
      <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 flex flex-col p-4 sm:p-6 pb-12">
        <div className="max-w-md mx-auto w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(isOwningRep ? '/rep/home' : '/admin/today')}
            className="p-2.5 bg-white shadow-xs border border-line rounded-[0.875rem] text-ink hover:bg-slate-50 transition-all active:scale-95"
            title="Return"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <StatusChip status="completed" label="Visit Concluded" />
        </div>

        <div className="max-w-md mx-auto w-full space-y-4 my-auto">
          <EdgeCard edge="teal" className="p-6 space-y-4">
            <div className="w-12 h-12 bg-teal-50 border border-teal-500/30 rounded-[1.25rem] flex items-center justify-center text-teal-600 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h1 className="text-xl font-display font-bold text-ink">
                Visit with Dr. {docName} Completed
              </h1>
              <p className="text-xs text-ink-soft mt-1">
                {clinicTitle} · {formattedDate} ({formattedSlot})
              </p>
            </div>

            {/* Token Badge */}
            {appointment.token && (
              <div className="bg-slate-50 p-3 rounded-[0.875rem] border border-slate-200 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider font-semibold">Token Code</span>
                <span className="font-mono text-sm font-bold text-teal-700">#{appointment.token}</span>
              </div>
            )}

            {appointment.outcome && (
              <div className="bg-teal-50/70 border border-teal-200 p-3 rounded-[0.875rem] text-xs">
                <span className="font-semibold text-teal-800 block mb-0.5">Visit Outcome</span>
                <span className="capitalize text-teal-700">{appointment.outcome.replace('_', ' ')}</span>
              </div>
            )}
          </EdgeCard>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => navigate('/rep/home')}
              className="w-full py-3.5 bg-navy-900 text-white rounded-[1rem] text-xs font-bold shadow-md hover:bg-navy-800 transition-all active:scale-95"
            >
              Return to Rep Home
            </button>
            <button
              onClick={() => navigate(`/dr/${doctor?.profileSlug || appointment.doctorId}/slots`)}
              className="w-full py-3 bg-white border border-line text-ink rounded-[1rem] text-xs font-semibold hover:bg-slate-50 transition-all active:scale-95"
            >
              Book Follow-up Slot
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // 3. PENDING REQUEST: Under Review
  // ════════════════════════════════════════════════════════════════════
  if (appointment.status === 'pending') {
    return (
      <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 flex flex-col p-4 sm:p-6 pb-12">
        <div className="max-w-md mx-auto w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(isOwningRep ? '/rep/home' : '/admin/pending')}
            className="p-2.5 bg-white shadow-xs border border-line rounded-[0.875rem] text-ink hover:bg-slate-50 transition-all active:scale-95"
            title="Return"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <StatusChip status="pending" label="Reviewing" />
        </div>

        <div className="max-w-md mx-auto w-full space-y-4 my-auto">
          {/* EdgeCard Amber */}
          <EdgeCard edge="amber" className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <LiveDot color="amber" />
              <span className="text-xs font-bold text-amber-700 uppercase font-mono tracking-wider">
                Request Under Review
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
            <div className="bg-slate-50 rounded-[1rem] p-3.5 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" /> Date
                </span>
                <span className="font-bold text-ink">{formattedDate}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-t border-slate-200/80 pt-2">
                <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-amber-500" /> Requested Slot
                </span>
                <span className="font-bold text-ink">{formattedSlot}</span>
              </div>
            </div>

            {/* Request Summary */}
            <div className="space-y-2 text-xs border-t border-line pt-3">
              <p className="text-[0.625rem] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Request Summary
              </p>
              {appointment.productFocus && (
                <div>
                  <span className="text-slate-500">Product Focus: </span>
                  <span className="font-semibold text-ink">{appointment.productFocus}</span>
                </div>
              )}
              {appointment.therapeuticCategory && (
                <div>
                  <span className="text-slate-500">Category: </span>
                  <span className="font-semibold text-ink">{appointment.therapeuticCategory}</span>
                </div>
              )}
              {appointment.samplesFlag && (
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-medium text-[0.6875rem] border border-teal-200">
                  Samples to share
                </div>
              )}
              {appointment.message && (
                <div className="bg-slate-50 p-3 rounded-[0.75rem] border border-slate-200 text-ink italic mt-1 text-xs">
                  "{appointment.message}"
                </div>
              )}
            </div>

            {/* Reply Expectation */}
            <p className="text-xs text-slate-500 font-medium">
              Doctors usually reply {replyTimeText}. This page updates automatically in real-time.
            </p>
          </EdgeCard>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleCopyLink}
              className="w-full py-3.5 bg-white border border-line hover:bg-slate-50 active:scale-95 text-ink font-semibold rounded-[1rem] transition-all flex items-center justify-center gap-2 text-xs shadow-xs"
            >
              {copiedLink ? <Check className="w-4 h-4 text-teal-600" /> : <Copy className="w-4 h-4 text-slate-400" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Status Link'}</span>
            </button>

            {isOwningRep && (
              <button
                disabled={actionLoading}
                onClick={handleCancel}
                className="w-full py-2.5 bg-transparent text-slate-500 hover:text-coral-600 text-xs font-semibold transition-colors"
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
  // 4. DECLINED REQUEST
  // ════════════════════════════════════════════════════════════════════
  if (appointment.status === 'declined' || appointment.status === 'rejected') {
    const doctorSlug = doctor?.profileSlug || appointment.doctorId;
    const canWhatsApp = Boolean(doctor?.contactSettings?.allowRepWhatsApp || doctor?.whatsappNumber);

    return (
      <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 flex flex-col p-4 sm:p-6 pb-12">
        <div className="max-w-md mx-auto w-full flex items-center justify-between mb-4">
          <button
            onClick={() => navigate(isOwningRep ? '/rep/home' : '/admin/pending')}
            className="p-2.5 bg-white shadow-xs border border-line rounded-[0.875rem] text-ink hover:bg-slate-50 transition-all active:scale-95"
            title="Return"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <StatusChip status="declined" label="Declined" />
        </div>

        <div className="max-w-md mx-auto w-full space-y-4 my-auto">
          <EdgeCard edge="coral" className="p-6 space-y-4">
            <div className="w-12 h-12 bg-coral-50 border border-coral-500/30 rounded-[1.25rem] flex items-center justify-center shadow-xs">
              <XCircle className="w-6 h-6 text-coral-600" />
            </div>

            <div>
              <h1 className="text-xl font-display font-bold text-ink">
                Dr. {docName} couldn't take this slot.
              </h1>
              <p className="text-xs text-ink-soft mt-1">
                Requested for {formattedDate} ({formattedSlot})
              </p>
            </div>

            {appointment.declineReason && (
              <div className="bg-coral-50/70 p-3.5 rounded-[0.875rem] border border-coral-200 text-xs text-ink">
                <span className="font-semibold text-coral-700 block mb-0.5">Note from doctor:</span>
                "{appointment.declineReason}"
              </div>
            )}
          </EdgeCard>

          <div className="space-y-2.5 pt-2">
            <button
              onClick={() => navigate(`/dr/${doctorSlug}/slots`)}
              className="w-full py-3.5 bg-navy-900 hover:bg-navy-800 active:scale-95 text-white font-bold rounded-[1rem] transition-all text-xs shadow-md"
            >
              Pick Another Slot
            </button>

            {/* Reconsider Button */}
            {isOwningRep && doctor?.comms?.allowReviewRequests !== false && (
              <button
                onClick={() => setShowReconsiderModal(true)}
                className="w-full py-3 bg-amber-50 border border-amber-300 text-amber-900 font-semibold rounded-[1rem] transition-all text-xs flex items-center justify-center gap-2 hover:bg-amber-100"
              >
                <span>Ask Doctor to Reconsider</span>
              </button>
            )}

            {canWhatsApp && (
              <button
                onClick={() => {
                  const num = doctor?.whatsappNumber || '';
                  const cleanNum = num.replace(/\D/g, '');
                  const waUrl = buildWhatsAppUrl(cleanNum, `Hi Dr. ${docName}, regarding my request for ${formattedDate}...`);
                  window.open(waUrl, '_blank');
                }}
                className="w-full py-3 bg-white border border-line hover:bg-slate-50 active:scale-95 text-ink font-semibold rounded-[1rem] transition-all text-xs flex items-center justify-center gap-2"
              >
                <span>Message on WhatsApp</span>
              </button>
            )}

            <button
              onClick={() => navigate('/rep/home')}
              className="w-full py-2.5 text-slate-500 text-xs font-medium hover:text-ink transition-colors"
            >
              Return to Rep Home
            </button>
          </div>
        </div>

        {/* ── Reconsider Modal ────────────────────────────────────── */}
        {showReconsiderModal && (
          <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[1.5rem] p-6 max-w-sm w-full space-y-4 shadow-2xl border border-line">
              <h3 className="text-base font-display font-bold text-ink">
                Ask Dr. {docName} to reconsider
              </h3>
              <p className="text-xs text-ink-soft">
                Briefly mention why this discussion is critical for clinical practice (max 240 chars).
              </p>
              <form onSubmit={handleSendReconsider} className="space-y-3">
                <textarea
                  value={reconsiderMessage}
                  onChange={(e) => setReconsiderMessage(e.target.value.slice(0, 240))}
                  placeholder="e.g. New clinical study data for high-risk patients..."
                  rows={3}
                  maxLength={240}
                  className="w-full p-3 text-xs bg-slate-50 border border-line rounded-[0.875rem] focus:outline-none focus:border-navy-900 resize-none"
                  required
                />
                <div className="text-right text-[0.6875rem] text-slate-400 font-mono">
                  {240 - reconsiderMessage.length} left
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setShowReconsiderModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-ink rounded-[0.875rem] text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !reconsiderMessage.trim()}
                    className="px-4 py-2.5 bg-navy-900 text-white rounded-[0.875rem] text-xs font-semibold hover:bg-navy-800 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? 'Sending…' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  // 5. CANCELLED / EXPIRED QUIET STATES
  // ════════════════════════════════════════════════════════════════════
  const isCancelled = appointment.status === 'cancelled';
  const isDoctorCancelled = isCancelled && appointment.cancelledBy === 'doctor';
  const doctorSlug = doctor?.profileSlug || appointment.doctorId;

  return (
    <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 flex flex-col p-4 sm:p-6 pb-12">
      <div className="max-w-md mx-auto w-full flex items-center justify-between mb-4">
        <button
          onClick={() => navigate(isOwningRep ? '/rep/home' : '/admin/today')}
          className="p-2.5 bg-white shadow-xs border border-line rounded-[0.875rem] text-ink hover:bg-slate-50 transition-all active:scale-95"
          title="Return"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <StatusChip status={isCancelled ? 'cancelled' : 'expired'} label={isCancelled ? 'Cancelled' : 'Expired'} />
      </div>

      <div className="max-w-md mx-auto w-full space-y-4 my-auto text-center">
        <div className="w-16 h-16 bg-white border border-line rounded-[1.25rem] flex items-center justify-center mx-auto text-2xl shadow-xs">
          {isCancelled ? '✕' : '⏳'}
        </div>

        <h1 className="text-xl font-display font-bold text-ink">
          {isDoctorCancelled 
            ? `Dr. ${docName} cancelled this visit` 
            : isCancelled 
            ? 'Request Cancelled' 
            : 'Token Expired'}
        </h1>

        {isDoctorCancelled && appointment.cancelReason && (
          <div className="bg-coral-50/70 border border-coral-200 text-ink p-3 rounded-[0.875rem] text-xs max-w-xs mx-auto">
            <span className="font-semibold text-coral-700 block mb-0.5">Reason:</span>
            "{appointment.cancelReason}"
          </div>
        )}

        <p className="text-xs text-ink-soft max-w-xs mx-auto">
          {isDoctorCancelled
            ? 'The doctor had to cancel this appointment. You may pick another available slot.'
            : isCancelled
            ? 'This appointment was cancelled. The slot has been released.'
            : 'Pass has expired or doctor didn\'t respond in time. You can pick another available slot.'}
        </p>

        <div className="pt-4 flex flex-col gap-2 max-w-xs mx-auto">
          {(isDoctorCancelled || appointment.status === 'expired') && doctorSlug && (
            <button
              onClick={() => navigate(`/dr/${doctorSlug}/slots`)}
              className="w-full py-3.5 bg-navy-900 text-white rounded-[1rem] text-xs font-bold shadow-md hover:bg-navy-800 transition-all active:scale-95"
            >
              Pick Another Slot
            </button>
          )}

          <button
            onClick={() => navigate('/rep/home')}
            className="w-full py-3 bg-white border border-line text-ink rounded-[1rem] text-xs font-semibold hover:bg-slate-50 transition-all active:scale-95 shadow-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
