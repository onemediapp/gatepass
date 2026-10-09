import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../lib/auth';
import { 
  Building2, Clock, CheckCircle2, AlertTriangle, Coffee, 
  Volume2, Search, ArrowRight, ShieldCheck, UserCheck, RefreshCw, 
  ChevronLeft, Sparkles, Phone, ExternalLink, QrCode
} from 'lucide-react';
import { format } from 'date-fns';

export default function ReceptionDesk() {
  const { user, userData } = useAuth();
  const { clinicSlug } = useParams();
  const navigate = useNavigate();

  const [doctorList, setDoctorList] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(user?.uid || '');
  const [doctorData, setDoctorData] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokenInput, setTokenInput] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  const [activeCallChime, setActiveCallChime] = useState(null);
  const [deskFilter, setDeskFilter] = useState('today'); // 'today', 'all'

  // Web Audio chime for calling MR
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {
      console.log('Audio chime not permitted without gesture', e);
    }
  };

  // If user is doctor, pre-select their doctor ID; otherwise load available doctors or clinic doctors
  useEffect(() => {
    async function loadDoctors() {
      try {
        if (clinicSlug) {
          const cSnap = await getDocs(query(collection(db, 'clinics'), where('slug', '==', clinicSlug)));
          if (!cSnap.empty) {
            const clinic = cSnap.docs[0].data();
            if (clinic.ownerDoctorId) {
              setSelectedDoctorId(clinic.ownerDoctorId);
            }
          }
        } else if (user?.uid && userData?.role?.includes('doctor')) {
          setSelectedDoctorId(user.uid);
        } else {
          // Load public doctors for receptionist selection
          const docsSnap = await getDocs(collection(db, 'doctors'));
          const list = [];
          for (const d of docsSnap.docs) {
            let doctorName = d.data().name || d.data().specialty || 'Doctor';
            try {
              const uSnap = await getDoc(doc(db, 'users', d.id));
              if (uSnap.exists() && uSnap.data().name) {
                doctorName = uSnap.data().name;
              }
            } catch (uErr) {
              // Fallback to doctor doc name/specialty if users doc read fails
            }
            list.push({
              id: d.id,
              name: doctorName,
              specialty: d.data().specialty,
              ...d.data()
            });
          }
          setDoctorList(list);
          if (list.length > 0 && !selectedDoctorId) {
            setSelectedDoctorId(list[0].id);
          }
        }
      } catch (err) {
        console.warn('Notice loading doctors for desk:', err);
      }
    }
    loadDoctors();
  }, [user, clinicSlug, userData]);

  // Listen to selected doctor's profile (for OPD Beacon status)
  useEffect(() => {
    if (!selectedDoctorId) return;
    const unsub = onSnapshot(doc(db, 'doctors', selectedDoctorId), async (snap) => {
      if (snap.exists()) {
        let doctorName = snap.data().name || 'Doctor';
        try {
          const uSnap = await getDoc(doc(db, 'users', selectedDoctorId));
          if (uSnap.exists() && uSnap.data().name) {
            doctorName = uSnap.data().name;
          }
        } catch (uErr) {
          // Fallback gracefully
        }
        setDoctorData({
          id: snap.id,
          name: doctorName,
          ...snap.data()
        });
      }
    }, (err) => {
      console.warn('Notice listening to doctor profile:', err);
    });
    return () => unsub();
  }, [selectedDoctorId]);

  // Listen to approved/active appointments for today for this doctor
  useEffect(() => {
    if (!selectedDoctorId) return;
    setLoading(true);

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', selectedDoctorId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter for approved or recently completed
      all.sort((a, b) => {
        const tA = a.approvedDate?.toMillis ? a.approvedDate.toMillis() : (a.createdAt?.toMillis || 0);
        const tB = b.approvedDate?.toMillis ? b.approvedDate.toMillis() : (b.createdAt?.toMillis || 0);
        return tA - tB;
      });
      setAppointments(all);
      setLoading(false);
    }, (err) => {
      console.warn('Notice listening to appointments queue:', err);
      setLoading(false);
    });

    return () => unsub();
  }, [selectedDoctorId]);

  // Filter today's queue
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const queueAppointments = appointments.filter(a => {
    if (a.status !== 'approved' && a.status !== 'completed' && a.status !== 'in_cabin') return false;
    if (deskFilter === 'today') {
      const appDateStr = a.approvedDate?.toDate ? format(a.approvedDate.toDate(), 'yyyy-MM-dd') : null;
      return appDateStr === todayStr || !appDateStr;
    }
    return true;
  });

  const waitingQueue = queueAppointments.filter(a => a.status === 'approved');
  const insideCabin = queueAppointments.filter(a => a.status === 'in_cabin');
  const completedToday = queueAppointments.filter(a => a.status === 'completed');

  // Fast Token Verification / Admission
  const handleVerifyToken = async (e) => {
    e?.preventDefault();
    if (!tokenInput.trim()) return;
    const cleaned = tokenInput.trim().toUpperCase();

    const match = appointments.find(a => a.token?.toUpperCase() === cleaned);
    if (!match) {
      setVerifyResult({ success: false, message: `Token "${cleaned}" not found in system.` });
      return;
    }

    if (match.status === 'completed') {
      setVerifyResult({ 
        success: false, 
        message: `Token ${cleaned} (${match.repSnapshot?.name}) has already completed their visit.` 
      });
      return;
    }

    // Admit inside
    try {
      await updateDoc(doc(db, 'appointments', match.id), {
        status: 'in_cabin',
        admittedAt: serverTimestamp(),
      });
      playChime();
      setVerifyResult({
        success: true,
        message: `Token ${cleaned} Verified! ${match.repSnapshot?.name} (${match.repSnapshot?.company}) admitted inside cabin.`
      });
      setTokenInput('');
    } catch (err) {
      setVerifyResult({ success: false, message: 'Failed to update token: ' + err.message });
    }
  };

  // Actions on appointment
  const handleCallIn = (app) => {
    playChime();
    setActiveCallChime(app.id);
    setTimeout(() => setActiveCallChime(null), 3000);
  };

  const handleAdmit = async (app) => {
    try {
      playChime();
      await updateDoc(doc(db, 'appointments', app.id), {
        status: 'in_cabin',
        admittedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkFinished = async (app) => {
    try {
      await updateDoc(doc(db, 'appointments', app.id), {
        status: 'completed',
        completedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Update OPD Beacon status (if doctor or authorized receptionist)
  const updateBeacon = async (beaconStatus, message = '') => {
    if (!selectedDoctorId) return;
    try {
      await updateDoc(doc(db, 'doctors', selectedDoctorId), {
        opdBeacon: {
          status: beaconStatus,
          message: message,
          updatedAt: serverTimestamp()
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const beacon = doctorData?.opdBeacon || { status: 'on_time', message: '' };

  return (
    <div className="min-h-screen bg-[#0A192F] text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Clinical Reception Bar */}
      <header className="border-b border-slate-800 bg-[#0A192F]/90 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(user ? (userData?.role?.includes('doctor') ? '/admin' : '/rep/home') : '/')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Return to Portal"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg">
              GP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-display font-black tracking-tight text-white">Reception Desk Kiosk</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  LIVE OPD
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Clinic Front Desk Protocol & Medical Representative Token Queue
              </p>
            </div>
          </div>

          {/* Doctor Switcher (if multiple) & Clock */}
          <div className="flex flex-wrap items-center gap-3">
            {doctorList.length > 1 && (
              <select
                value={selectedDoctorId}
                onChange={(e) => setSelectedDoctorId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {doctorList.map((d) => (
                  <option key={d.id} value={d.id}>
                    Dr. {d.name} ({d.specialty || 'General'})
                  </option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-xs font-mono text-slate-300">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{format(new Date(), 'EEEE, dd MMM yyyy')}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Kiosk Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Doctor OPD Live Beacon Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Doctor In Clinic</span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-sm font-bold text-white">Dr. {doctorData?.name || 'Doctor'}</span>
                {doctorData?.specialty && (
                  <span className="text-xs text-slate-400">({doctorData.specialty})</span>
                )}
              </div>

              {/* Current Beacon Pill */}
              <div className="flex items-center gap-3">
                {beacon.status === 'on_time' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    OPD On-Time · Admitting Scheduled Reps
                  </div>
                )}
                {beacon.status === 'delayed_30' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Running ~30 Mins Late (Ward Rounds / Patient Rush)
                  </div>
                )}
                {beacon.status === 'delayed_60' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Running ~60 Mins Late (OT / Emergency)
                  </div>
                )}
                {beacon.status === 'break' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold text-sm">
                    <Coffee className="w-4 h-4" />
                    Doctor on 15-Min Break
                  </div>
                )}
                {beacon.status === 'emergency' && (
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-bold text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Emergency Procedure in Progress · Desk Paused
                  </div>
                )}
              </div>

              {beacon.message && (
                <p className="text-xs text-amber-200/90 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg inline-block">
                  "{beacon.message}"
                </p>
              )}
            </div>

            {/* Quick 1-Tap Beacon Update Controls for Doctor / Staff */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider mr-1">Update Status:</span>
              <button
                onClick={() => updateBeacon('on_time', 'OPD running smoothly')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${beacon.status === 'on_time' ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                On-Time
              </button>
              <button
                onClick={() => updateBeacon('delayed_30', 'Emergency rounds in progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${beacon.status === 'delayed_30' ? 'bg-amber-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                +30m Late
              </button>
              <button
                onClick={() => updateBeacon('break', 'Brief 15 min tea break')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${beacon.status === 'break' ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                Break
              </button>
              <button
                onClick={() => updateBeacon('emergency', 'Doctor in surgery')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${beacon.status === 'emergency' ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
              >
                Emergency
              </button>
            </div>
          </div>
        </div>

        {/* Quick Token Barcode / Number Scanner Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <form onSubmit={handleVerifyToken} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <QrCode className="w-5 h-5 text-emerald-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Scan or Enter Gatepass Token (e.g. 84F2 or GP-102)..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-4 py-3.5 text-sm text-white placeholder-slate-400 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-sm whitespace-nowrap"
            >
              <ShieldCheck className="w-4 h-4" />
              Verify & Admit Inside
            </button>
          </form>

          {verifyResult && (
            <div className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between ${verifyResult.success ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-rose-500/10 border-rose-500/30 text-rose-300'}`}>
              <span>{verifyResult.message}</span>
              <button onClick={() => setVerifyResult(null)} className="text-slate-400 hover:text-white ml-2 text-sm font-bold">×</button>
            </div>
          )}
        </div>

        {/* Current Inside Cabin & Waiting Queue Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Currently Inside Doctor's Cabin */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Currently Inside Cabin
              </h2>
              <span className="text-xs font-bold font-mono text-slate-400">{insideCabin.length} MR</span>
            </div>

            {insideCabin.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-500">
                  <UserCheck className="w-6 h-6" />
                </div>
                <p className="font-semibold text-sm text-slate-300">Doctor Cabin is Free</p>
                <p className="text-xs text-slate-500 mt-1">Ready to call in the next Medical Representative from queue.</p>
              </div>
            ) : (
              insideCabin.map((app) => (
                <div key={app.id} className="bg-emerald-950/40 border-2 border-emerald-500/40 rounded-2xl p-5 shadow-xl relative overflow-hidden">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Active Detailing</span>
                      <h3 className="text-lg font-bold text-white mt-0.5">{app.repSnapshot?.name}</h3>
                      <p className="text-xs text-emerald-300 font-semibold">{app.repSnapshot?.company} · {app.repSnapshot?.designation}</p>
                    </div>
                    <div className="bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 rounded-xl font-mono font-black text-emerald-300 text-lg">
                      {app.token}
                    </div>
                  </div>

                  <div className="text-xs text-slate-300 space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800 mb-4">
                    <p><strong className="text-slate-400">Product Focus:</strong> {app.productFocus || 'Pharma portfolio'}</p>
                    <p><strong className="text-slate-400">Shift Slot:</strong> {app.approvedTimeSlot || 'Today'}</p>
                  </div>

                  <button
                    onClick={() => handleMarkFinished(app)}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Mark Meeting Concluded
                  </button>
                </div>
              ))
            )}

            {/* Completed Count Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Completed Visits Today:</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                {completedToday.length} MRs
              </span>
            </div>
          </div>

          {/* Center & Right Column: Waiting Queue (The Main Live Stage) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-display font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Today's Waiting Queue
                </h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                  {waitingQueue.length} Waiting
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <button
                  onClick={() => setDeskFilter('today')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${deskFilter === 'today' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Today
                </button>
                <button
                  onClick={() => setDeskFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors ${deskFilter === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All Active
                </button>
              </div>
            </div>

            {loading ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                <p className="text-xs">Connecting to clinic database...</p>
              </div>
            ) : waitingQueue.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="font-semibold text-slate-300 text-base">Waiting Lounge Clear</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  No medical representatives are currently queued for this doctor. Verified Gatepass holders will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {waitingQueue.map((app, idx) => {
                  const isChiming = activeCallChime === app.id;
                  return (
                    <div
                      key={app.id}
                      className={`bg-slate-900 border rounded-2xl p-4 sm:p-5 transition-all relative overflow-hidden ${isChiming ? 'border-amber-400 ring-2 ring-amber-400/40 bg-amber-950/20' : 'border-slate-800 hover:border-slate-700'}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Token & Rep Details */}
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex flex-col items-center justify-center font-mono flex-shrink-0">
                            <span className="text-[9px] uppercase text-slate-400 font-bold">Token</span>
                            <span className="text-base font-black text-emerald-400">{idx + 1}</span>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-base leading-tight">
                                {app.repSnapshot?.name}
                              </h4>
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                {app.token}
                              </span>
                            </div>

                            <p className="text-xs text-slate-400 mt-0.5">
                              <strong className="text-emerald-400 font-semibold">{app.repSnapshot?.company}</strong> · {app.repSnapshot?.designation}
                            </p>

                            <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                              <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700">
                                Slot: {app.approvedTimeSlot || 'Today'}
                              </span>
                              {app.productFocus && (
                                <span className="bg-slate-800/80 px-2.5 py-0.5 rounded-md border border-slate-700 text-slate-300">
                                  Focus: {app.productFocus}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons for Compounder / Receptionist */}
                        <div className="flex items-center gap-2 sm:self-center">
                          <button
                            onClick={() => handleCallIn(app)}
                            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-xl border border-slate-700 transition-all active:scale-95 text-xs font-bold flex items-center gap-1.5"
                            title="Chime / Call MR into waiting area"
                          >
                            <Volume2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Call In</span>
                          </button>

                          <button
                            onClick={() => handleAdmit(app)}
                            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                          >
                            <span>Admit to Cabin</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
