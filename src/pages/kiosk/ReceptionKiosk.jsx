/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getClinicBySlug } from '../../lib/db/clinics';
import { getDoctor } from '../../lib/db/doctors';
import { listDoctorsForClinic } from '../../lib/db/doctorClinics';
import { 
  subscribeDoctorAppointmentsByDate, 
  subscribeDoctorPendingAppointments 
} from '../../lib/db/appointments';
import { 
  verifyClinicStaffPin, 
  approveAppointmentAsStaff, 
  declineAppointmentAsStaff,
  markRepArrivedAsStaff, 
  callRepInAsStaff 
} from '../../lib/db/delegation';
import { buildWhatsAppUrl, formatWhatsAppMessage } from '../../lib/whatsapp';
import { todayDateStr, formatSlotRange, formatDateIST, serverNow } from '../../lib/time';
import { formatTokenDisplay } from '../../lib/gatepass';
import { 
  Building2, 
  Clock, 
  Calendar, 
  Lock, 
  KeyRound, 
  CheckCircle2, 
  AlertCircle, 
  BellRing, 
  UserCheck, 
  Share2, 
  Maximize2, 
  Minimize2, 
  Search, 
  User, 
  Briefcase, 
  Package, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles,
  ArrowRight,
  LogOut,
  Coffee,
  Check,
  Send
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import LiveDot from '../../components/ui/LiveDot';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

export default function ReceptionKiosk() {
  const { clinicSlug, slug } = useParams();
  const navigate = useNavigate();
  const activeSlug = clinicSlug || slug;

  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [loading, setLoading] = useState(true);

  // Staff Authentication
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [staffName, setStaffName] = useState('Reception Desk');

  // Appointments State
  const [appointments, setAppointments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'pending' | 'cabin'
  const [actionLoading, setActionLoading] = useState(false);
  const [nowMs, setNowMs] = useState(serverNow());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Broadcast Delay Modal State
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedDelayMins, setSelectedDelayMins] = useState(15);
  const [delayBroadcastSent, setDelayBroadcastSent] = useState(false);

  const todayStr = todayDateStr();

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setNowMs(serverNow()), 5000);
    return () => clearInterval(timer);
  }, []);

  // 1. Load Clinic & Doctors
  useEffect(() => {
    async function init() {
      if (!activeSlug) return;
      try {
        const cData = await getClinicBySlug(activeSlug);
        if (cData) {
          setClinic(cData);
          
          // Check session storage for existing unlocked PIN
          const cachedSession = sessionStorage.getItem(`gatepass_staff_${cData.id}`);
          if (cachedSession) {
            setIsUnlocked(true);
            setStaffName(cachedSession);
          }

          // Fetch Doctors linked to this clinic
          const links = await listDoctorsForClinic(cData.id);
          const docIds = new Set(links.map(l => l.doctorId));
          if (cData.ownerDoctorId) docIds.add(cData.ownerDoctorId);

          const loaded = [];
          for (const dId of docIds) {
            const dr = await getDoctor(dId);
            if (dr) loaded.push(dr);
          }
          setDoctors(loaded);
          if (loaded.length === 1) {
            setSelectedDoctorId(loaded[0].uid);
          }
        }
      } catch (err) {
        console.error('Failed to load clinic kiosk:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [activeSlug]);

  // 2. Subscribe to appointments for the selected doctor(s)
  useEffect(() => {
    if (!clinic || !isUnlocked || doctors.length === 0) return;

    const unsubs = [];
    const targetDocIds = selectedDoctorId === 'all' ? doctors.map(d => d.uid) : [selectedDoctorId];

    let allAppointments = {};
    let allPending = {};

    targetDocIds.forEach(docId => {
      // Today's appointments
      const unsubAppts = subscribeDoctorAppointmentsByDate(docId, todayStr, (list) => {
        allAppointments[docId] = list;
        const merged = Object.values(allAppointments).flat().sort((a, b) => 
          (a.slotStart || '').localeCompare(b.slotStart || '')
        );
        setAppointments(merged);
      });
      unsubs.push(unsubAppts);

      // Pending requests
      const unsubPending = subscribeDoctorPendingAppointments(docId, (list) => {
        allPending[docId] = list;
        const mergedPending = Object.values(allPending).flat();
        setPendingRequests(mergedPending);
      });
      unsubs.push(unsubPending);
    });

    return () => {
      unsubs.forEach(u => u());
    };
  }, [clinic, isUnlocked, doctors, selectedDoctorId, todayStr]);

  // Handle Staff PIN Unlock
  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!clinic) return;
    setPinError('');

    const res = await verifyClinicStaffPin(clinic.id, enteredPin);
    if (res.valid) {
      setIsUnlocked(true);
      setStaffName(res.staffName);
      sessionStorage.setItem(`gatepass_staff_${clinic.id}`, res.staffName);
    } else {
      setPinError('Invalid Staff PIN. Please check with the clinic administrator.');
    }
  };

  const handleLock = () => {
    if (clinic) {
      sessionStorage.removeItem(`gatepass_staff_${clinic.id}`);
    }
    setIsUnlocked(false);
    setEnteredPin('');
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Delegated Staff Actions
  const handleApprove = async (appt) => {
    setActionLoading(true);
    try {
      await approveAppointmentAsStaff({
        appointmentId: appt.id,
        doctorId: appt.doctorId,
        staffName,
        clinicId: clinic?.id
      });
    } catch (err) {
      alert('Approval failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async (appt) => {
    const reason = prompt('Reason for declining visit request:', 'Clinic doctor fully booked');
    if (reason === null) return;
    setActionLoading(true);
    try {
      await declineAppointmentAsStaff({
        appointmentId: appt.id,
        doctorId: appt.doctorId,
        declineReason: reason,
        staffName
      });
    } catch (err) {
      alert('Decline failed: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkArrived = async (apptId) => {
    try {
      await markRepArrivedAsStaff({ appointmentId: apptId, staffName });
    } catch (err) {
      console.error(err);
      alert('Failed to mark arrival: ' + err.message);
    }
  };

  const handleSendIn = async (appt) => {
    try {
      await callRepInAsStaff({ appointmentId: appt.id, staffName });
    } catch (err) {
      console.error(err);
      alert('Failed to call rep into cabin: ' + err.message);
    }
  };

  // Compute breakdown for today's visits
  const currentInCabin = appointments.find(a => a.calledInAt && !a.outcome);
  const arrivedWaiting = appointments.filter(a => a.arrivedAt && !a.calledInAt && !a.outcome);
  const upcomingQueue = appointments.filter(a => !a.arrivedAt && !a.calledInAt && !a.outcome && a.status === 'approved');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 space-y-4">
        <Skeleton className="w-16 h-16 rounded-[1.25rem] bg-slate-800" />
        <Skeleton className="w-48 h-6 rounded-[0.5rem] bg-slate-800" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <Building2 className="w-12 h-12 text-slate-400 mb-2" />
        <h2 className="text-xl font-bold text-ink">Clinic Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">Please verify the clinic address or QR link.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-navy-900 text-white rounded-[0.75rem] text-xs font-bold">
          Return Home
        </button>
      </div>
    );
  }

  // ── PIN Unlock Screen ──────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#070E1E] text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 rounded-[1.75rem] p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 text-center">
          
          <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-amber-400 to-amber-600 text-navy-950 flex items-center justify-center mx-auto shadow-lg">
            <Building2 className="w-8 h-8" />
          </div>

          <div>
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-amber-300 font-bold block">
              Clinic Staff Delegation
            </span>
            <h1 className="text-2xl font-display font-bold text-white mt-1">
              {clinic.clinicName}
            </h1>
            <p className="text-xs text-white/60 mt-1">
              Reception Desk & Detailing Kiosk Terminal
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4 pt-2">
            <div>
              <label className="text-[0.6875rem] font-mono uppercase tracking-wider text-white/70 block mb-2">
                Enter Reception Staff Passcode
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  value={enteredPin}
                  onChange={(e) => setEnteredPin(e.target.value)}
                  placeholder="PIN (Default 2026)"
                  className="w-full bg-white/10 border border-white/20 focus:border-amber-400 rounded-[1rem] px-4 py-3.5 text-center text-xl font-mono tracking-[0.5em] text-white placeholder:text-white/30 outline-none transition-all shadow-inner"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {pinError && (
              <p className="text-xs text-coral-400 font-medium animate-in fade-in">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              disabled={!enteredPin.trim()}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-navy-950 font-display font-bold rounded-[1rem] text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Unlock Reception Console</span>
            </button>
          </form>

          <p className="text-[0.6875rem] text-white/40 border-t border-white/10 pt-4">
            Allows reception staff to approve, reschedule, and call in reps without the doctor's personal Google account.
          </p>
        </div>
      </div>
    );
  }

  // ── Unlocked Reception Kiosk Console ───────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-400 selection:text-navy-950 flex flex-col">
      
      {/* ── Top Flight Ops Bar ────────────────────────────────────────── */}
      <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[0.875rem] bg-gradient-to-br from-amber-400 to-amber-600 text-navy-950 flex items-center justify-center font-bold font-display text-base shadow-sm flex-shrink-0">
            {clinic.clinicName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-display font-bold text-white leading-tight">
                {clinic.clinicName}
              </h1>
              <span className="font-mono text-[0.625rem] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <LiveDot color="teal" size="sm" /> Reception Desk
              </span>
            </div>
            <p className="text-[0.6875rem] text-slate-400 font-mono mt-0.5">
              Staff: {staffName} · {formatDateIST(new Date(), 'EEEE, dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Doctor Filter & Controls */}
        <div className="flex items-center gap-2.5">
          {doctors.length > 1 && (
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-[0.75rem] px-3 py-2 outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="all">All Doctors ({doctors.length})</option>
              {doctors.map(d => (
                <option key={d.uid} value={d.uid}>{d.name}</option>
              ))}
            </select>
          )}

          <button
            onClick={() => setShowDelayModal(true)}
            className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-[0.75rem] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Broadcast Schedule Delay"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Broadcast Delay</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-[0.75rem] bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Toggle Kiosk Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLock}
            className="p-2 rounded-[0.75rem] bg-slate-800 hover:bg-coral-500/20 text-slate-300 hover:text-coral-300 transition-colors"
            title="Lock Console"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Operations Board ────────────────────────────────────── */}
      <main className="flex-1 p-4 sm:p-6 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Top Metric Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-[1.25rem]">
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-slate-400 block">
              Inside Doctor Cabin
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-mono font-bold text-teal-300">
                {currentInCabin ? '1 Active' : 'Cabin Free'}
              </span>
              <span className={cn(
                "w-3 h-3 rounded-full",
                currentInCabin ? "bg-teal-400 shadow-[0_0_10px_rgba(45,212,191,0.8)] animate-pulse" : "bg-slate-700"
              )} />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-[1.25rem]">
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-slate-400 block">
              Waiting at Reception
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-mono font-bold text-amber-300">
                {arrivedWaiting.length} Reps
              </span>
              <LiveDot color="amber" size="sm" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-[1.25rem]">
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-slate-400 block">
              Upcoming Today
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-mono font-bold text-slate-200">
                {upcomingQueue.length} Visits
              </span>
              <Calendar className="w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-[1.25rem]">
            <span className="font-mono text-[0.625rem] uppercase tracking-wider text-slate-400 block">
              Pending Delegated Approvals
            </span>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xl font-mono font-bold text-indigo-300">
                {pendingRequests.length} Requests
              </span>
              <MonoTag variant="neutral">Staff Action</MonoTag>
            </div>
          </div>
        </div>

        {/* ── Active Detailing In Cabin (Spotlight) ────────────────────── */}
        {currentInCabin && (
          <div className="bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border-2 border-teal-500/40 rounded-[1.5rem] p-5 sm:p-6 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-teal-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-lg flex-shrink-0 animate-pulse">
                  <BellRing className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-teal-300 font-bold">
                      CURRENTLY DETAILING IN CABIN
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 text-[0.625rem] font-mono font-bold border border-teal-500/30">
                      LIVE
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-white mt-1">
                    {currentInCabin.repSnapshot?.name || 'Representative'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {currentInCabin.repSnapshot?.company} · {currentInCabin.productFocus ? `"${currentInCabin.productFocus}"` : 'Product Detailing'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono">
                  <span className="text-[0.6875rem] text-slate-400 uppercase block">Called In</span>
                  <span className="text-xs font-bold text-teal-300">
                    {currentInCabin.calledInAt?.toMillis 
                      ? formatDateIST(new Date(currentInCabin.calledInAt.toMillis()), 'hh:mm a') 
                      : 'Just now'}
                  </span>
                </div>
                <div className="px-4 py-2 bg-teal-500/20 border border-teal-500/40 text-teal-200 rounded-[0.875rem] font-mono text-base font-bold">
                  {formatTokenDisplay(currentInCabin.token)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Segmented Control Tabs ──────────────────────────────────── */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('queue')}
            className={cn(
              "px-4 py-2 rounded-[0.875rem] text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'queue' 
                ? "bg-amber-400 text-slate-950 shadow-md font-display" 
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            )}
          >
            <span>Today's Detailing Stream</span>
            <span className="px-1.5 py-0.2 bg-slate-950/20 text-current rounded-full font-mono text-[0.625rem]">
              {appointments.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              "px-4 py-2 rounded-[0.875rem] text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
              activeTab === 'pending' 
                ? "bg-amber-400 text-slate-950 shadow-md font-display" 
                : "text-slate-400 hover:text-white hover:bg-slate-900"
            )}
          >
            <span>Pending Staff Approvals</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-indigo-500 text-white rounded-full font-mono text-[0.625rem]">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Tab 1: Today's Detailing Queue ───────────────────────────── */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            {appointments.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] p-12 text-center text-slate-400 space-y-2">
                <Coffee className="w-8 h-8 mx-auto text-slate-600" />
                <h4 className="font-bold text-white text-base">No scheduled visitors today</h4>
                <p className="text-xs text-slate-500">Approved visits for today will display here in real-time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((appt) => {
                  const rep = appt.repSnapshot || {};
                  const isCabin = appt.calledInAt && !appt.outcome;
                  const isWaiting = appt.arrivedAt && !appt.calledInAt && !appt.outcome;
                  const isMet = appt.outcome === 'met' || appt.status === 'completed';

                  // Generate instant WhatsApp URL
                  const waCallInUrl = rep.mobile ? buildWhatsAppUrl({
                    phone: rep.mobile,
                    message: formatWhatsAppMessage({
                      context: 'doctor_ready_call_in',
                      repName: rep.name,
                      doctorName: appt.doctorSnapshot?.name || 'Doctor',
                      clinicName: clinic.clinicName,
                      token: formatTokenDisplay(appt.token),
                      slotStart: appt.slotStart
                    })
                  }) : null;

                  return (
                    <div 
                      key={appt.id}
                      className={cn(
                        "bg-slate-900 border rounded-[1.25rem] p-5 space-y-4 transition-all",
                        isCabin 
                          ? "border-teal-500/60 bg-teal-950/20 shadow-lg" 
                          : isWaiting 
                          ? "border-amber-500/50 bg-amber-950/10" 
                          : isMet
                          ? "border-slate-800 opacity-60"
                          : "border-slate-800"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display font-bold text-base text-white">
                              {rep.name || 'Medical Rep'}
                            </span>
                            {isWaiting && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[0.625rem] border border-amber-500/30 flex items-center gap-1">
                                <LiveDot color="amber" size="sm" /> Waiting in Lobby
                              </span>
                            )}
                            {isCabin && (
                              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold text-[0.625rem] border border-teal-500/30">
                                In Cabin
                              </span>
                            )}
                            {isMet && (
                              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[0.625rem]">
                                ✓ Completed
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {rep.company} {rep.designation ? `· ${rep.designation}` : ''} {rep.mobile ? `· ${rep.mobile}` : ''}
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-mono font-bold text-white block">
                            {formatSlotRange(appt.slotStart, appt.slotEnd)}
                          </span>
                          <span className="font-mono text-xs font-bold text-teal-300 bg-teal-500/20 px-2.5 py-0.5 rounded-[0.5rem] border border-teal-500/30 mt-1 inline-block">
                            {formatTokenDisplay(appt.token)}
                          </span>
                        </div>
                      </div>

                      {/* Product Focus & Accompaniment */}
                      <div className="text-xs text-slate-300 space-y-1">
                        {appt.productFocus && (
                          <p className="bg-slate-950/60 p-2 rounded-[0.625rem] border border-slate-800">
                            <strong className="text-slate-400">Products: </strong>"{appt.productFocus}"
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-[0.6875rem] text-slate-400 font-mono">
                          {appt.samplesFlag && <span className="text-teal-400">📦 Samples Included</span>}
                          {appt.accompaniedBy && <span className="text-amber-400">👥 Joint Visit (+1)</span>}
                        </div>
                      </div>

                      {/* Reception Actions */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
                        <div className="flex items-center gap-2">
                          {!appt.arrivedAt && !appt.calledInAt && !isMet && (
                            <button
                              onClick={() => handleMarkArrived(appt.id)}
                              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-[0.75rem] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Mark Rep Arrived</span>
                            </button>
                          )}

                          {!appt.calledInAt && !isMet && (
                            <button
                              onClick={() => handleSendIn(appt)}
                              className="px-3.5 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-[0.75rem] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
                            >
                              <BellRing className="w-3.5 h-3.5" />
                              <span>Send In to Cabin</span>
                            </button>
                          )}
                        </div>

                        {/* WhatsApp Instant Alert */}
                        {waCallInUrl && !isMet && (
                          <a
                            href={waCallInUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-[0.75rem] bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all"
                            title="Send Instant WhatsApp Call-In"
                          >
                            <Share2 className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab 2: Pending Delegated Approvals ───────────────────────── */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-[1.5rem] p-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-teal-500" />
                <h4 className="font-bold text-white text-base">Inbox Zero!</h4>
                <p className="text-xs text-slate-500">No pending representative requests waiting for approval.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingRequests.map((appt) => {
                  const rep = appt.repSnapshot || {};
                  return (
                    <div 
                      key={appt.id}
                      className="bg-slate-900 border border-slate-800 rounded-[1.25rem] p-5 space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-display font-bold text-base text-white">
                              {rep.name || 'Medical Representative'}
                            </h4>
                            <span className="font-mono text-[0.625rem] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold">
                              Requested
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {rep.company} · {rep.designation} · {rep.mobile}
                          </p>
                        </div>

                        <div className="text-left sm:text-right font-mono">
                          <span className="text-[0.6875rem] text-slate-400 block uppercase">Requested Slot</span>
                          <span className="text-xs font-bold text-amber-300">
                            {appt.slotDate} ({formatSlotRange(appt.slotStart, appt.slotEnd)})
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-300 bg-slate-950/70 p-3 rounded-[0.75rem] border border-slate-800">
                        <p><strong className="text-slate-400">Products to Detail: </strong>"{appt.productFocus || 'Pharmaceutical line'}"</p>
                        {appt.message && (
                          <p className="mt-1 text-slate-400 italic">"{appt.message}"</p>
                        )}
                      </div>

                      {/* Delegated Approval Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          onClick={() => handleDecline(appt)}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-slate-800 hover:bg-coral-500/20 text-slate-300 hover:text-coral-300 rounded-[0.75rem] text-xs font-semibold transition-all cursor-pointer"
                        >
                          Decline
                        </button>

                        <button
                          onClick={() => handleApprove(appt)}
                          disabled={actionLoading}
                          className="px-5 py-2 bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-300 hover:to-teal-400 text-slate-950 font-display font-bold rounded-[0.75rem] text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve Slot (Issue Pass)</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </main>

      {/* ── Broadcast Delay Modal ─────────────────────────────────────── */}
      {showDelayModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-[1.75rem] p-6 max-w-md w-full space-y-5 shadow-2xl text-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="font-display font-bold text-lg text-white">
                  Broadcast Clinic Delay Alert
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Notify today's scheduled medical representatives via WhatsApp so they don't crowd the waiting room.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[0.6875rem] font-mono uppercase text-slate-400 block">
                Estimated Doctor Delay
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[15, 30, 45].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setSelectedDelayMins(mins)}
                    className={cn(
                      "py-2.5 rounded-[0.75rem] text-xs font-bold transition-all cursor-pointer font-mono",
                      selectedDelayMins === mins 
                        ? "bg-amber-400 text-slate-950 shadow-md" 
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    +{mins} Mins
                  </button>
                ))}
              </div>
            </div>

            {/* List of Reps to notify */}
            <div className="space-y-2 max-h-48 overflow-y-auto divide-y divide-slate-800 text-xs">
              <span className="font-mono text-[0.6875rem] text-slate-400 block">
                Scheduled Reps Today ({appointments.filter(a => a.status === 'approved' && !a.outcome).length}):
              </span>
              {appointments.filter(a => a.status === 'approved' && !a.outcome).map((appt) => {
                const rep = appt.repSnapshot || {};
                const waUrl = rep.mobile ? buildWhatsAppUrl({
                  phone: rep.mobile,
                  message: formatWhatsAppMessage({
                    context: 'doctor_delay_alert',
                    doctorName: appt.doctorSnapshot?.name || 'Doctor',
                    clinicName: clinic.clinicName,
                    slotDate: appt.slotDate,
                    slotStart: appt.slotStart,
                    token: formatTokenDisplay(appt.token),
                    delayMinutes: selectedDelayMins,
                    passUrl: `${window.location.origin}/status/${appt.id}`
                  })
                }) : null;

                return (
                  <div key={appt.id} className="pt-2 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{rep.name || 'Representative'}</p>
                      <p className="text-[0.6875rem] text-slate-400">{rep.company} · {appt.slotStart}</p>
                    </div>

                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded-[0.5rem] text-[0.6875rem] font-bold border border-emerald-500/30 flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    ) : (
                      <span className="text-[0.6875rem] text-slate-500">No mobile</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setShowDelayModal(false)}
                className="px-4 py-2 bg-slate-800 text-slate-300 rounded-[0.75rem] text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
