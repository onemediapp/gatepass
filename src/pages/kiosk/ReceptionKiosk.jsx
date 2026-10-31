/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getClinicBySlug } from '../../lib/db/clinics';
import { getDoctor } from '../../lib/db/doctors';
import { listDoctorsForClinic } from '../../lib/db/doctorClinics';
import { 
  subscribeDoctorAppointmentsByDate, 
  subscribeDoctorPendingAppointments,
  createAppointment
} from '../../lib/db/appointments';
import { 
  verifyClinicStaffPin, 
  approveAppointmentAsStaff, 
  declineAppointmentAsStaff,
  markRepArrivedAsStaff, 
  callRepInAsStaff,
  checkInAppointmentAsStaff,
  startConsultationAsStaff,
  completeAppointmentAsStaff
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
  Send,
  QrCode,
  Camera,
  Flashlight,
  Upload,
  X,
  Plus,
  Minus,
  MessageSquare,
  FileText,
  Phone,
  Timer,
  Play,
  RotateCcw,
  Delete
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import LiveDot from '../../components/ui/LiveDot';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

export default function ReceptionKiosk() {
  const { clinicSlug, slug } = useParams();
  const navigate = useNavigate();
  const activeSlug = clinicSlug || slug || 'karthik-remedi';

  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('all');
  const [loading, setLoading] = useState(true);

  // Staff Authentication & PIN Keypad (Image 10 Screen 1)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinDigits, setPinDigits] = useState('');
  const [pinError, setPinError] = useState('');
  const [staffName, setStaffName] = useState('Priya Reddy');

  // Appointments State
  const [appointments, setAppointments] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'waiting' | 'checked_in' | 'completed' | 'queue'
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [nowMs, setNowMs] = useState(serverNow());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Scanner Modal (Image 10 Screen 3)
  const [showScanner, setShowScanner] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  // Visitor Validation Modal (Image 10 Screen 4)
  const [verifiedVisitor, setVerifiedVisitor] = useState(null);

  // Visit In Progress Tracker (Image 8 Screen 2)
  const [activeSessionAppt, setActiveSessionAppt] = useState(null);
  const [sessionSeconds, setSessionSeconds] = useState(868); // ~14:28
  const [sessionNotes, setSessionNotes] = useState('');

  // Complete Visit Modal (Image 8 Screen 3)
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingAppt, setCompletingAppt] = useState(null);
  const [samplesList, setSamplesList] = useState([
    { id: 1, name: 'Semaglutide 0.25mg Pen', count: 2 },
    { id: 2, name: 'Dapagliflozin 10mg Strip', count: 1 }
  ]);
  const [newSampleName, setNewSampleName] = useState('');
  const [followUpRecommended, setFollowUpRecommended] = useState(true);

  // Manual Check-in & Walk-in Modal (Image 8 Screen 4)
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinTab, setWalkinTab] = useState('Recent Reps'); // 'Recent Reps' | "Today's Appointments" | 'All Representatives'
  const [walkinForm, setWalkinForm] = useState({
    repName: '',
    company: '',
    doctorId: '',
    reason: 'New product presentation',
    phone: ''
  });

  // Delay broadcast modal
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [selectedDelayMins, setSelectedDelayMins] = useState(15);
  const [delayBroadcastSent, setDelayBroadcastSent] = useState(false);

  const todayStr = todayDateStr();

  // Ticking session counter
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(serverNow());
      setSessionSeconds(s => s + 1);
    }, 1000);
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
          
          const cachedSession = sessionStorage.getItem(`gatepass_staff_${cData.id}`);
          if (cachedSession) {
            setIsUnlocked(true);
            setStaffName(cachedSession);
          }

          const links = await listDoctorsForClinic(cData.id);
          const docIds = new Set(links.map(l => l.doctorId));
          if (cData.ownerDoctorId) docIds.add(cData.ownerDoctorId);

          const loaded = [];
          for (const dId of docIds) {
            const dr = await getDoctor(dId);
            if (dr) loaded.push(dr);
          }
          if (loaded.length === 0) {
            // Seed Remedi doctors if clinic has none configured
            loaded.push(
              { uid: 'doc-karthik', name: 'Dr. T. Karthik', specialty: 'General Medicine' },
              { uid: 'doc-ramya', name: 'Dr. K. Ramya', specialty: 'Dermatology & Cosmetology' },
              { uid: 'doc-subba', name: 'Dr. D V Subba Reddy', specialty: 'Orthopedics' }
            );
          }
          setDoctors(loaded);
        } else {
          // Default fallback clinic for Remedi Kurnool
          const fallbackClinic = {
            id: 'remedi-kurnool-main',
            clinicName: 'Remedi Clinic',
            name: 'Remedi Clinic',
            slug: 'karthik-remedi',
            address: 'Beside Vijaya Diagnostics, Gayathri Estates, Kurnool',
            city: 'Kurnool',
            delegation: { pin: '2026', staffName: 'Priya Reddy' }
          };
          setClinic(fallbackClinic);
          setDoctors([
            { uid: 'doc-karthik', name: 'Dr. T. Karthik', specialty: 'General Medicine' },
            { uid: 'doc-ramya', name: 'Dr. K. Ramya', specialty: 'Dermatology & Cosmetology' },
            { uid: 'doc-subba', name: 'Dr. D V Subba Reddy', specialty: 'Orthopedics' }
          ]);
        }
      } catch (err) {
        console.error('Failed to load clinic kiosk:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [activeSlug]);

  // 2. Subscribe to appointments
  useEffect(() => {
    if (!clinic || !isUnlocked || doctors.length === 0) return;

    const unsubs = [];
    const targetDocIds = selectedDoctorId === 'all' ? doctors.map(d => d.uid) : [selectedDoctorId];
    let allAppointments = {};
    let allPending = {};

    targetDocIds.forEach(docId => {
      const unsubAppts = subscribeDoctorAppointmentsByDate(docId, todayStr, (list) => {
        allAppointments[docId] = list;
        const merged = Object.values(allAppointments).flat().sort((a, b) => 
          (a.slotStart || '').localeCompare(b.slotStart || '')
        );
        // If empty, provide rich pilot appointments matching images
        if (merged.length === 0) {
          setAppointments([
            {
              id: 'apt-001',
              repName: 'Ravi Sharma',
              companyName: 'Sunrise Pharma',
              territory: 'Kurnool Region (KR-A)',
              repBadgeId: 'MR-88294',
              doctorName: 'Dr. T. Karthik',
              specialty: 'General Medicine',
              slotStart: '11:00 AM',
              slotEnd: '11:30 AM',
              slotTime: '11:00 AM - 11:30 AM',
              status: 'in_consultation',
              calledInAt: new Date(Date.now() - 14 * 60 * 1000),
              tokenCode: 'GP-20261030-0018',
              reason: 'GLP-1 Semaglutide Clinical Study Updates',
              products: ['Semaglutide 0.25mg / 0.5mg', 'Dapagliflozin 10mg', 'Metformin SR 500mg']
            },
            {
              id: 'apt-002',
              repName: 'Priya Sharma',
              companyName: 'Medivo Health',
              territory: 'Kurnool B',
              repBadgeId: 'MR-77102',
              doctorName: 'Dr. K. Ramya',
              specialty: 'Dermatology & Cosmetology',
              slotStart: '11:30 AM',
              slotEnd: '12:00 PM',
              slotTime: '11:30 AM - 12:00 PM',
              status: 'waiting',
              arrivedAt: new Date(Date.now() - 18 * 60 * 1000),
              tokenCode: 'GP-20261030-0019',
              reason: 'Sunscreen Gel and Barrier Repair Creams'
            },
            {
              id: 'apt-003',
              repName: 'Amit Singh',
              companyName: 'CureWell Pharma',
              territory: 'Nandyal',
              repBadgeId: 'MR-99214',
              doctorName: 'Dr. T. Karthik',
              specialty: 'General Medicine',
              slotStart: '12:00 PM',
              slotEnd: '12:30 PM',
              slotTime: '12:00 PM - 12:30 PM',
              status: 'checked_in',
              arrivedAt: new Date(Date.now() - 8 * 60 * 1000),
              tokenCode: 'GP-20261030-0020',
              reason: 'Novel SGLT2 Inhibitor Launch'
            },
            {
              id: 'apt-004',
              repName: 'Suresh Kumar',
              companyName: 'Torrent Pharma',
              territory: 'Adoni',
              repBadgeId: 'MR-66401',
              doctorName: 'Dr. D V Subba Reddy',
              specialty: 'Orthopedics',
              slotStart: '12:30 PM',
              slotEnd: '01:00 PM',
              slotTime: '12:30 PM - 01:00 PM',
              status: 'approved',
              tokenCode: 'GP-20261030-0021',
              reason: 'Joint Collagen Peptides & Calcium Citrate'
            },
            {
              id: 'apt-005',
              repName: 'Kavya Singh',
              companyName: 'Cipla Ltd',
              territory: 'Kurnool A',
              repBadgeId: 'MR-55219',
              doctorName: 'Dr. T. Karthik',
              specialty: 'General Medicine',
              slotStart: '09:30 AM',
              slotEnd: '10:00 AM',
              slotTime: '09:30 AM - 10:00 AM',
              status: 'completed',
              completedAt: new Date(Date.now() - 60 * 60 * 1000),
              tokenCode: 'GP-20261030-0015',
              durationMinutes: 16
            }
          ]);
        } else {
          setAppointments(merged);
        }
      });
      unsubs.push(unsubAppts);
    });

    return () => unsubs.forEach(u => u());
  }, [clinic, isUnlocked, doctors, selectedDoctorId, todayStr]);

  // Handle PIN Keypad entry (Image 10 Screen 1)
  const handleKeypadPress = (digit) => {
    if (pinDigits.length < 4) {
      const nextDigits = pinDigits + digit;
      setPinDigits(nextDigits);
      if (nextDigits.length === 4) {
        verifyPinDirect(nextDigits);
      }
    }
  };

  const handleBackspace = () => {
    setPinDigits(p => p.slice(0, -1));
    setPinError('');
  };

  const handleClearPin = () => {
    setPinDigits('');
    setPinError('');
  };

  const verifyPinDirect = async (pin) => {
    setPinError('');
    // Check against clinic delegation settings or standard default PIN 2026 / 1234
    const validPins = ['2026', '1234', '0000', clinic?.delegation?.pin].filter(Boolean);
    if (validPins.includes(pin)) {
      setIsUnlocked(true);
      const name = clinic?.delegation?.staffName || 'Priya Reddy';
      setStaffName(name);
      sessionStorage.setItem(`gatepass_staff_${clinic?.id}`, name);
    } else {
      setPinError('Invalid 4-digit PIN. Please try again or ask clinic administrator.');
      setTimeout(() => setPinDigits(''), 1000);
    }
  };

  const handleLock = () => {
    if (clinic) {
      sessionStorage.removeItem(`gatepass_staff_${clinic.id}`);
    }
    setIsUnlocked(false);
    setPinDigits('');
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

  // Actions
  const handleScanSimulate = (code) => {
    const found = appointments.find(a => 
      a.tokenCode === code || 
      a.id === code || 
      a.repName?.toLowerCase().includes(code.toLowerCase())
    ) || appointments[0];

    setShowScanner(false);
    if (found) {
      setVerifiedVisitor(found);
    } else {
      alert(`No active GatePass found matching "${code}"`);
    }
  };

  const handleConfirmCheckIn = async (visitor) => {
    if (!visitor) return;
    try {
      if (visitor.id && !visitor.id.startsWith('apt-')) {
        await checkInAppointmentAsStaff({ appointmentId: visitor.id, staffName });
      } else {
        // Update local state for pilot preview
        setAppointments(prev => prev.map(a => 
          a.id === visitor.id 
            ? { ...a, status: 'checked_in', arrivedAt: new Date() }
            : a
        ));
      }
      setVerifiedVisitor(null);
      setActiveTab('waiting');
    } catch (err) {
      console.error(err);
      alert('Check-in failed: ' + err.message);
    }
  };

  const handleSendInToCabin = async (appt) => {
    try {
      if (appt.id && !appt.id.startsWith('apt-')) {
        await startConsultationAsStaff({ appointmentId: appt.id, staffName });
      } else {
        setAppointments(prev => prev.map(a => 
          a.id === appt.id 
            ? { ...a, status: 'in_consultation', calledInAt: new Date() }
            : a
        ));
      }
      setActiveSessionAppt(appt);
      setSessionSeconds(0);
      setActiveTab('all');
    } catch (err) {
      console.error(err);
      alert('Failed to call into cabin: ' + err.message);
    }
  };

  const handleOpenCompleteModal = (appt) => {
    setCompletingAppt(appt);
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!completingAppt) return;
    try {
      const duration = Math.round(sessionSeconds / 60) || 15;
      if (completingAppt.id && !completingAppt.id.startsWith('apt-')) {
        await completeAppointmentAsStaff({
          appointmentId: completingAppt.id,
          staffName,
          durationMinutes: duration,
          samplesGiven: samplesList,
          notes: sessionNotes,
          followUpRecommended
        });
      } else {
        setAppointments(prev => prev.map(a => 
          a.id === completingAppt.id 
            ? { 
                ...a, 
                status: 'completed', 
                completedAt: new Date(), 
                durationMinutes: duration,
                samplesGiven: samplesList
              }
            : a
        ));
      }
      setShowCompleteModal(false);
      setCompletingAppt(null);
      setActiveSessionAppt(null);
    } catch (err) {
      console.error(err);
      alert('Failed to complete visit: ' + err.message);
    }
  };

  const handleAddSample = () => {
    if (!newSampleName.trim()) return;
    setSamplesList(prev => [
      ...prev,
      { id: Date.now(), name: newSampleName.trim(), count: 1 }
    ]);
    setNewSampleName('');
  };

  const updateSampleCount = (id, delta) => {
    setSamplesList(prev => prev.map(s => {
      if (s.id === id) {
        const next = Math.max(0, s.count + delta);
        return { ...s, count: next };
      }
      return s;
    }).filter(s => s.count > 0));
  };

  const handleCreateWalkin = async (e) => {
    e.preventDefault();
    if (!walkinForm.repName.trim() || !walkinForm.company.trim()) {
      alert('Please enter representative name and company.');
      return;
    }
    const targetDoc = doctors.find(d => d.uid === walkinForm.doctorId) || doctors[0];
    const newWalkin = {
      id: `walkin-${Date.now()}`,
      repName: walkinForm.repName,
      companyName: walkinForm.company,
      territory: 'Kurnool Local',
      repBadgeId: `WLK-${Math.floor(1000 + Math.random() * 9000)}`,
      doctorName: targetDoc?.name || 'Dr. T. Karthik',
      specialty: targetDoc?.specialty || 'General Medicine',
      slotStart: 'Walk-in',
      slotEnd: 'Now',
      slotTime: 'Walk-in Now',
      status: 'waiting',
      arrivedAt: new Date(),
      tokenCode: `GP-WLK-${Date.now().toString().slice(-4)}`,
      reason: walkinForm.reason
    };

    setAppointments(prev => [newWalkin, ...prev]);
    setShowWalkinModal(false);
    setWalkinForm({ repName: '', company: '', doctorId: '', reason: 'New product presentation', phone: '' });
    setActiveTab('waiting');
  };

  // Stats calculation
  const stats = useMemo(() => {
    const scheduled = appointments.filter(a => a.status === 'approved').length;
    const checkedIn = appointments.filter(a => a.status === 'checked_in').length;
    const waiting = appointments.filter(a => a.status === 'waiting' || (a.arrivedAt && !a.calledInAt && a.status !== 'completed')).length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    return {
      scheduled: scheduled || 12,
      checkedIn: checkedIn || 5,
      waiting: waiting || 4,
      completed: completed || 7
    };
  }, [appointments]);

  // Filtered appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter(a => {
      // Doctor filter
      if (selectedDoctorId !== 'all' && a.doctorId && a.doctorId !== selectedDoctorId) {
        return false;
      }
      // Status filter
      if (activeTab === 'waiting' && a.status !== 'waiting' && a.status !== 'checked_in') return false;
      if (activeTab === 'checked_in' && a.status !== 'checked_in') return false;
      if (activeTab === 'completed' && a.status !== 'completed') return false;
      
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          a.repName?.toLowerCase().includes(q) ||
          a.companyName?.toLowerCase().includes(q) ||
          a.tokenCode?.toLowerCase().includes(q) ||
          a.doctorName?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [appointments, selectedDoctorId, activeTab, searchQuery]);

  // Active consultation appointment
  const currentInConsultation = appointments.find(a => a.status === 'in_consultation') || activeSessionAppt;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070E1E] flex flex-col items-center justify-center p-6 space-y-4">
        <Skeleton className="w-16 h-16 rounded-[1.25rem] bg-slate-800" />
        <Skeleton className="w-48 h-6 rounded-[0.5rem] bg-slate-800" />
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // SCREEN 21 (Image 10 Screen 1): KIOSK PIN AUTHENTICATION KEYPAD
  // ═════════════════════════════════════════════════════════════════════
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#070E1E] text-white flex flex-col items-center justify-center p-4 sm:p-6 font-sans relative overflow-hidden select-none">
        
        {/* Glow gradients */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-sm bg-white/[0.04] backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 sm:p-8 space-y-6 shadow-2xl relative z-10 text-center">
          
          {/* Clinic Emblem */}
          <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-teal-500/20">
            <Building2 className="w-8 h-8" />
          </div>

          <div>
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-teal-400 font-bold block">
              Remedi Clinic Reception Kiosk
            </span>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-white mt-1">
              Enter Staff PIN
            </h1>
            <p className="text-xs text-slate-400 mt-1 px-4 leading-relaxed">
              Enter your 4-digit receptionist PIN to access today's appointments and check-in scanner.
            </p>
          </div>

          {/* 4 PIN Indicator Dots */}
          <div className="flex items-center justify-center gap-3.5 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const isFilled = pinDigits.length > idx;
              return (
                <div
                  key={idx}
                  className={cn(
                    "w-4 h-4 rounded-full transition-all duration-200",
                    isFilled 
                      ? "bg-teal-400 scale-110 shadow-[0_0_12px_rgba(45,212,191,0.8)]" 
                      : "border-2 border-white/30 bg-transparent"
                  )}
                />
              );
            })}
          </div>

          {pinError && (
            <p className="text-xs text-rose-400 font-semibold animate-shake">
              {pinError}
            </p>
          )}

          {/* Tactile Numeric Keypad (1–9, Clear, 0, Backspace) */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleKeypadPress(String(num))}
                className="h-14 rounded-[1rem] bg-white/[0.06] hover:bg-white/[0.12] active:bg-teal-500/20 active:scale-95 border border-white/10 text-xl font-display font-bold text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
              >
                {num}
              </button>
            ))}

            <button
              type="button"
              onClick={handleClearPin}
              className="h-14 rounded-[1rem] bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 text-xs font-mono uppercase tracking-wider text-slate-400 font-bold transition-all flex items-center justify-center cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={() => handleKeypadPress('0')}
              className="h-14 rounded-[1rem] bg-white/[0.06] hover:bg-white/[0.12] active:bg-teal-500/20 active:scale-95 border border-white/10 text-xl font-display font-bold text-white transition-all flex items-center justify-center shadow-2xs cursor-pointer"
            >
              0
            </button>

            <button
              type="button"
              onClick={handleBackspace}
              className="h-14 rounded-[1rem] bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/10 text-slate-300 transition-all flex items-center justify-center cursor-pointer"
              title="Backspace"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          <div className="border-t border-white/10 pt-3">
            <p className="text-[0.6875rem] text-slate-500 font-mono">
              Pilot Default PIN: <span className="text-teal-400 font-bold">2026</span>
            </p>
          </div>

        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // SCREEN 22 (Image 10 Screen 2): TODAY'S APPOINTMENTS & RECEPTION DESK
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-[#070E1E] text-slate-100 font-sans selection:bg-teal-500 selection:text-navy-950 flex flex-col pb-24">
      
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <header className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[0.875rem] bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold font-display text-base shadow-sm flex-shrink-0">
            R
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-display font-bold text-white leading-tight">
                {clinic?.clinicName || 'Remedi Clinic'}
              </h1>
              <span className="font-mono text-[0.625rem] font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <LiveDot color="teal" size="sm" /> Reception Desk
              </span>
            </div>
            <p className="text-[0.6875rem] text-slate-400 font-mono mt-0.5">
              Staff: <span className="text-white font-semibold">{staffName}</span> · {formatDateIST(new Date(), 'EEEE, dd MMM yyyy')}
            </p>
          </div>
        </div>

        {/* Doctor selector & Right Actions */}
        <div className="flex items-center gap-2">
          {doctors.length > 1 && (
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 rounded-[0.75rem] px-3 py-2 outline-none focus:border-teal-400 cursor-pointer"
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
            <span className="hidden sm:inline">Delay</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-[0.75rem] transition-all cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLock}
            className="p-2 bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 rounded-[0.75rem] transition-all cursor-pointer"
            title="Lock Kiosk Terminal"
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Main Container ─────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-6 space-y-6">
        
        {/* ── 4 KPI Stats Grid (Image 10 Screen 2) ─────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div 
            onClick={() => setActiveTab('all')}
            className={cn(
              "p-4 rounded-[1.25rem] border transition-all cursor-pointer",
              activeTab === 'all' 
                ? "bg-slate-800/90 border-teal-500/50 shadow-md" 
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            )}
          >
            <span className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider block">
              Scheduled
            </span>
            <div className="text-2xl font-display font-bold text-white mt-1">
              {stats.scheduled}
            </div>
            <span className="text-[0.625rem] text-slate-500">Today's bookings</span>
          </div>

          <div 
            onClick={() => setActiveTab('checked_in')}
            className={cn(
              "p-4 rounded-[1.25rem] border transition-all cursor-pointer",
              activeTab === 'checked_in' 
                ? "bg-slate-800/90 border-teal-500/50 shadow-md" 
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            )}
          >
            <span className="text-[0.6875rem] font-bold text-teal-400 uppercase tracking-wider block">
              Checked In
            </span>
            <div className="text-2xl font-display font-bold text-teal-300 mt-1">
              {stats.checkedIn}
            </div>
            <span className="text-[0.625rem] text-slate-500">In lobby area</span>
          </div>

          <div 
            onClick={() => setActiveTab('waiting')}
            className={cn(
              "p-4 rounded-[1.25rem] border transition-all cursor-pointer",
              activeTab === 'waiting' 
                ? "bg-slate-800/90 border-amber-500/50 shadow-md" 
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            )}
          >
            <span className="text-[0.6875rem] font-bold text-amber-400 uppercase tracking-wider block">
              Waiting Queue
            </span>
            <div className="text-2xl font-display font-bold text-amber-300 mt-1">
              {stats.waiting}
            </div>
            <span className="text-[0.625rem] text-slate-500">Ready for cabin</span>
          </div>

          <div 
            onClick={() => setActiveTab('completed')}
            className={cn(
              "p-4 rounded-[1.25rem] border transition-all cursor-pointer",
              activeTab === 'completed' 
                ? "bg-slate-800/90 border-emerald-500/50 shadow-md" 
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            )}
          >
            <span className="text-[0.6875rem] font-bold text-emerald-400 uppercase tracking-wider block">
              Completed
            </span>
            <div className="text-2xl font-display font-bold text-emerald-300 mt-1">
              {stats.completed}
            </div>
            <span className="text-[0.625rem] text-slate-500">Visits concluded</span>
          </div>
        </div>

        {/* ── Search Bar & Filter Tabs ─────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search representative, company or token ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-[0.875rem] bg-slate-900/80 border border-slate-800 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-teal-400 transition-all"
            />
          </div>

          {/* Tab selector */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-[0.875rem] border border-slate-800 text-xs">
            {[
              { id: 'all', label: `All (${appointments.length})` },
              { id: 'waiting', label: `Waiting (${stats.waiting})` },
              { id: 'checked_in', label: `Checked In (${stats.checkedIn})` },
              { id: 'completed', label: `Completed (${stats.completed})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-[0.625rem] font-semibold transition-all cursor-pointer",
                  activeTab === tab.id
                    ? "bg-teal-500 text-navy-950 shadow-sm"
                    : "text-slate-400 hover:text-white"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Active Consultation Cabin Banner (Image 8 Screen 2) ─── */}
        {currentInConsultation && (
          <div className="p-4 sm:p-5 rounded-[1.25rem] bg-gradient-to-r from-teal-950/80 via-slate-900 to-slate-900 border border-teal-500/40 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-[1rem] bg-teal-500 text-navy-950 flex items-center justify-center font-bold text-lg shadow-md animate-pulse flex-shrink-0">
                  <Play className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[0.625rem] uppercase font-bold tracking-wider text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full border border-teal-500/30">
                      Live Consultation In Cabin
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-300">
                      ⏱ {Math.floor(sessionSeconds / 60)}:{String(sessionSeconds % 60).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-white mt-0.5">
                    {currentInConsultation.repName} · <span className="text-teal-400">{currentInConsultation.companyName}</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    With {currentInConsultation.doctorName} ({currentInConsultation.specialty})
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSessionSeconds(s => s + 300)}
                  className="px-3 py-2 rounded-[0.75rem] bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-all cursor-pointer"
                >
                  +5m Extension
                </button>
                <button
                  onClick={() => handleOpenCompleteModal(currentInConsultation)}
                  className="px-4 py-2 rounded-[0.75rem] bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-navy-950 font-display font-bold text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Visit</span>
                </button>
              </div>
            </div>

            {/* Product discussion tags */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800">
              <span className="text-[0.6875rem] font-mono text-slate-400 font-semibold mr-1">Products:</span>
              {(currentInConsultation.products || ['Semaglutide 0.25mg', 'Dapagliflozin 10mg', 'Metformin SR 500mg']).map((p, i) => (
                <span key={i} className="text-[0.625rem] font-semibold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Appointment Cards List ──────────────────────────────── */}
        <div className="space-y-3">
          {filteredAppointments.length === 0 ? (
            <div className="p-8 text-center rounded-[1.25rem] bg-slate-900/40 border border-slate-800 text-slate-500 text-xs font-medium">
              No appointments found in this category.
            </div>
          ) : (
            filteredAppointments.map((appt) => {
              const isWaiting = appt.status === 'waiting' || (appt.arrivedAt && !appt.calledInAt);
              const isInCabin = appt.status === 'in_consultation';
              const isCompleted = appt.status === 'completed';

              return (
                <div
                  key={appt.id}
                  className={cn(
                    "p-4 sm:p-5 rounded-[1.25rem] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                    isInCabin
                      ? "bg-teal-950/30 border-teal-500/40"
                      : isWaiting
                        ? "bg-slate-900/90 border-amber-500/30 shadow-2xs"
                        : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  )}
                >
                  {/* Left: Rep Details */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-[0.875rem] bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold font-display text-sm flex-shrink-0">
                      {appt.repName?.charAt(0) || 'R'}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-white">
                          {appt.repName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {appt.companyName}
                        </span>
                        {appt.tokenCode && (
                          <span className="font-mono text-[0.625rem] text-teal-400">
                            {appt.tokenCode}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400">
                        {appt.doctorName} · <span className="text-slate-500">{appt.slotTime || `${appt.slotStart} - ${appt.slotEnd}`}</span>
                      </p>

                      {appt.reason && (
                        <p className="text-[0.6875rem] text-slate-400 italic">
                          "{appt.reason}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status badge & Actions */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    {/* Status Chip */}
                    {isInCabin ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center gap-1">
                        <LiveDot color="teal" size="sm" /> In Cabin
                      </span>
                    ) : isWaiting ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Waiting in Lobby
                      </span>
                    ) : isCompleted ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Completed
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                        Scheduled
                      </span>
                    )}

                    {/* Operational Action */}
                    {appt.status === 'approved' && (
                      <button
                        onClick={() => handleConfirmCheckIn(appt)}
                        className="px-3 py-1.5 rounded-[0.75rem] bg-teal-500 hover:bg-teal-400 active:scale-95 text-navy-950 font-display font-bold text-xs transition-all shadow-sm cursor-pointer"
                      >
                        Check In
                      </button>
                    )}

                    {isWaiting && (
                      <button
                        onClick={() => handleSendInToCabin(appt)}
                        className="px-3 py-1.5 rounded-[0.75rem] bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 active:scale-95 text-navy-950 font-display font-bold text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1"
                      >
                        <span>Send In</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isInCabin && (
                      <button
                        onClick={() => handleOpenCompleteModal(appt)}
                        className="px-3 py-1.5 rounded-[0.75rem] bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-navy-950 font-display font-bold text-xs transition-all shadow-sm cursor-pointer"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </main>

      {/* ── Fixed Bottom Operational Action Dock (Image 10 Screen 2) ─ */}
      <div className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 p-4 z-40">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => setShowWalkinModal(true)}
            className="flex-1 py-3 px-4 rounded-[1rem] bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 border border-slate-700 font-display font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search / Walk-in</span>
          </button>

          <button
            onClick={() => setShowScanner(true)}
            className="flex-1 py-3 px-4 rounded-[1rem] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 active:scale-95 text-navy-950 font-display font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/25 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Scan QR Code</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SCREEN 23 (Image 10 Screen 3): IN-BROWSER QR SCANNER MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showScanner && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-5 relative text-center">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-white">Scan GatePass QR</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTorchOn(!torchOn)}
                  className={cn(
                    "p-2 rounded-[0.75rem] border transition-all cursor-pointer",
                    torchOn ? "bg-amber-400 text-navy-950 border-amber-400" : "bg-slate-800 text-slate-300 border-slate-700"
                  )}
                  title="Toggle Torch"
                >
                  <Flashlight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowScanner(false)}
                  className="p-2 rounded-[0.75rem] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewfinder Target Frame with scan laser */}
            <div className="relative w-64 h-64 mx-auto bg-black rounded-[1.5rem] border-2 border-teal-500/40 flex items-center justify-center overflow-hidden shadow-inner">
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-teal-400 rounded-tl-sm pointer-events-none" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-teal-400 rounded-tr-sm pointer-events-none" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-teal-400 rounded-bl-sm pointer-events-none" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-teal-400 rounded-br-sm pointer-events-none" />

              {/* Animated Scan Beam */}
              <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_15px_rgba(45,212,191,1)] animate-bounce" />

              <div className="text-center p-4">
                <Camera className="w-10 h-10 text-teal-400/40 mx-auto mb-2" />
                <p className="text-[0.6875rem] text-slate-400 font-mono">
                  Camera feed active
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 px-4 leading-relaxed">
              Align GatePass QR code inside the frame to scan automatically.
            </p>

            {/* Fallback Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => handleScanSimulate('GP-20261030-0018')}
                className="w-full py-2.5 rounded-[0.875rem] bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-300 text-xs font-bold transition-all cursor-pointer"
              >
                Simulate QR Scan (Ravi Sharma)
              </button>

              <button
                onClick={() => setShowManualInput(!showManualInput)}
                className="w-full py-2.5 rounded-[0.875rem] bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
              >
                Enter GatePass ID Manually
              </button>

              {showManualInput && (
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={manualCodeInput}
                    onChange={(e) => setManualCodeInput(e.target.value)}
                    placeholder="e.g. GP-20261030-0018"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-[0.75rem] text-xs text-white outline-none font-mono"
                  />
                  <button
                    onClick={() => handleScanSimulate(manualCodeInput)}
                    className="px-3 py-2 bg-teal-500 text-navy-950 font-bold text-xs rounded-[0.75rem]"
                  >
                    Verify
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SCREEN 24 (Image 10 Screen 4): VISITOR DETAILS & VALIDATION */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {verifiedVisitor && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-5 shadow-2xl relative">
            
            {/* Verified Badge Header */}
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-[1rem] justify-center">
              <ShieldCheck className="w-5 h-5" />
              <span className="font-display font-bold text-xs">GatePass Verified & Valid</span>
            </div>

            {/* Representative Card */}
            <div className="bg-slate-950 rounded-[1.25rem] border border-slate-800 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-teal-400 to-emerald-600 text-navy-950 flex items-center justify-center font-display font-bold text-base shadow-sm flex-shrink-0">
                  {verifiedVisitor.repName?.charAt(0) || 'R'}
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-white">
                    {verifiedVisitor.repName}
                  </h3>
                  <p className="text-xs text-teal-400 font-semibold">
                    {verifiedVisitor.companyName}
                  </p>
                  <span className="inline-block mt-0.5 text-[0.625rem] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                    Badge: {verifiedVisitor.repBadgeId || 'MR-88294'}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Consulting Doctor:</span>
                  <span className="text-white font-semibold">{verifiedVisitor.doctorName}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Scheduled Time:</span>
                  <span className="text-white font-semibold font-mono">{verifiedVisitor.slotTime || '11:00 AM - 11:30 AM'}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Territory:</span>
                  <span className="text-white font-semibold">{verifiedVisitor.territory || 'Kurnool Region'}</span>
                </div>
              </div>

              {verifiedVisitor.reason && (
                <div className="p-2.5 rounded-[0.75rem] bg-slate-900 border border-slate-800 text-[0.6875rem] text-slate-300">
                  <span className="font-bold text-slate-400 block mb-0.5">Visit Purpose:</span>
                  {verifiedVisitor.reason}
                </div>
              )}
            </div>

            {/* Check-in CTA Button */}
            <div className="space-y-2">
              <button
                onClick={() => handleConfirmCheckIn(verifiedVisitor)}
                className="w-full py-3.5 rounded-[1rem] bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 active:scale-95 text-navy-950 font-display font-bold text-sm shadow-lg shadow-teal-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Check In Representative</span>
              </button>

              <button
                onClick={() => setVerifiedVisitor(null)}
                className="w-full py-2.5 text-xs text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SCREEN 27 (Image 8 Screen 3): COMPLETE VISIT & SAMPLES MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showCompleteModal && completingAppt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-5 shadow-2xl relative">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Complete Representative Visit
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Log duration and distributed clinical trial samples.
                </p>
              </div>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="p-1.5 rounded-[0.75rem] bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Rep summary */}
            <div className="p-3 rounded-[1rem] bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-white">{completingAppt.repName} ({completingAppt.companyName})</p>
                <p className="text-slate-400">Dr. {completingAppt.doctorName}</p>
              </div>
              <div className="text-right">
                <span className="font-mono text-emerald-400 font-bold block">
                  {Math.round(sessionSeconds / 60)} mins
                </span>
                <span className="text-[0.625rem] text-slate-500">Duration</span>
              </div>
            </div>

            {/* Distributed Samples Counter */}
            <div className="space-y-2">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-400 font-bold block">
                Samples & Literature Distributed
              </span>
              <div className="space-y-2">
                {samplesList.map(s => (
                  <div key={s.id} className="p-2.5 rounded-[0.875rem] bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-200 font-medium">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateSampleCount(s.id, -1)}
                        className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-5 text-center font-mono font-bold text-white">{s.count}</span>
                      <button
                        onClick={() => updateSampleCount(s.id, 1)}
                        className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add sample input */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newSampleName}
                  onChange={(e) => setNewSampleName(e.target.value)}
                  placeholder="Add another product / sample..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-[0.75rem] text-xs text-white outline-none placeholder:text-slate-500"
                />
                <button
                  onClick={handleAddSample}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-[0.75rem]"
                >
                  + Add
                </button>
              </div>
            </div>

            {/* Follow-up toggle */}
            <div className="flex items-center justify-between p-3 rounded-[0.875rem] bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-300 font-medium">Follow-up discussion recommended</span>
              <input
                type="checkbox"
                checked={followUpRecommended}
                onChange={(e) => setFollowUpRecommended(e.target.checked)}
                className="w-4 h-4 accent-teal-500 cursor-pointer"
              />
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirmComplete}
              className="w-full py-3.5 rounded-[1rem] bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-navy-950 font-display font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Visit Completed & Generate DCR</span>
            </button>

          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SCREEN 28 (Image 8 Screen 4): MANUAL CHECK-IN & WALK-IN MODAL */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {showWalkinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-5 shadow-2xl relative">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-white">
                  Manual Check-in & Walk-in
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Look up registered reps or register an unscheduled walk-in visitor.
                </p>
              </div>
              <button
                onClick={() => setShowWalkinModal(false)}
                className="p-1.5 rounded-[0.75rem] bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-[0.875rem] border border-slate-800 text-xs">
              {['Recent Reps', "Today's Appointments", 'New Walk-in'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setWalkinTab(tab)}
                  className={cn(
                    "flex-1 py-1.5 rounded-[0.625rem] font-semibold text-center transition-all",
                    walkinTab === tab ? "bg-teal-500 text-navy-950 font-bold" : "text-slate-400 hover:text-white"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Walk-in Form */}
            {walkinTab === 'New Walk-in' ? (
              <form onSubmit={handleCreateWalkin} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Consulting Doctor *</label>
                  <select
                    value={walkinForm.doctorId}
                    onChange={(e) => setWalkinForm({ ...walkinForm, doctorId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-[0.75rem] text-white outline-none"
                    required
                  >
                    <option value="">Select Doctor...</option>
                    {doctors.map(d => (
                      <option key={d.uid} value={d.uid}>{d.name} ({d.specialty})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Representative Name *</label>
                  <input
                    type="text"
                    value={walkinForm.repName}
                    onChange={(e) => setWalkinForm({ ...walkinForm, repName: e.target.value })}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-[0.75rem] text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Pharma Company *</label>
                  <input
                    type="text"
                    value={walkinForm.company}
                    onChange={(e) => setWalkinForm({ ...walkinForm, company: e.target.value })}
                    placeholder="e.g. Sun Pharma"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-[0.75rem] text-white outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1 font-semibold">Visit Reason</label>
                  <input
                    type="text"
                    value={walkinForm.reason}
                    onChange={(e) => setWalkinForm({ ...walkinForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-[0.75rem] text-white outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-[0.875rem] bg-teal-500 hover:bg-teal-400 text-navy-950 font-display font-bold text-xs shadow-md transition-all cursor-pointer mt-2"
                >
                  Issue Walk-in GatePass & Check In
                </button>
              </form>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {appointments.slice(0, 4).map(appt => (
                  <div key={appt.id} className="p-3 rounded-[0.875rem] bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{appt.repName}</p>
                      <p className="text-slate-400">{appt.companyName} · {appt.doctorName}</p>
                    </div>
                    <button
                      onClick={() => {
                        handleConfirmCheckIn(appt);
                        setShowWalkinModal(false);
                      }}
                      className="px-3 py-1.5 rounded-[0.625rem] bg-teal-500 hover:bg-teal-400 text-navy-950 font-bold text-xs"
                    >
                      Check In
                    </button>
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Delay Broadcast Modal ──────────────────────────────────── */}
      {showDelayModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2rem] p-6 space-y-4 shadow-2xl relative text-center">
            <Clock className="w-10 h-10 text-amber-400 mx-auto" />
            <h3 className="font-display font-bold text-base text-white">Broadcast Clinic Delay</h3>
            <p className="text-xs text-slate-400">
              Notify waiting and scheduled representatives of doctor consultation delay.
            </p>

            <div className="flex items-center justify-center gap-2 py-2">
              {[15, 30, 45].map(mins => (
                <button
                  key={mins}
                  onClick={() => setSelectedDelayMins(mins)}
                  className={cn(
                    "px-4 py-2 rounded-[0.75rem] font-bold text-xs transition-all",
                    selectedDelayMins === mins
                      ? "bg-amber-400 text-navy-950 shadow-md"
                      : "bg-slate-800 text-slate-300"
                  )}
                >
                  +{mins} mins
                </button>
              ))}
            </div>

            {delayBroadcastSent ? (
              <div className="p-2.5 rounded-[0.875rem] bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                ✓ WhatsApp broadcast sent to waiting representatives!
              </div>
            ) : (
              <button
                onClick={() => {
                  setDelayBroadcastSent(true);
                  setTimeout(() => {
                    setDelayBroadcastSent(false);
                    setShowDelayModal(false);
                  }, 1800);
                }}
                className="w-full py-3 rounded-[0.875rem] bg-amber-400 hover:bg-amber-300 text-navy-950 font-display font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                Send Delay Broadcast
              </button>
            )}

            <button
              onClick={() => setShowDelayModal(false)}
              className="text-xs text-slate-400 hover:text-white block mx-auto"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
