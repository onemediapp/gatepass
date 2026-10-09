import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { generateUniqueToken } from '../../utils/generateToken';
import { getMidnightIST } from '../../utils/dateUtils';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { 
  CheckCircle2, Clock, XCircle, Search, Filter, Calendar, 
  ArrowRight, QrCode, Check, X, ChevronDown, UserCheck, 
  Copy, Sparkles, AlertCircle, Archive, Coffee, Building2, Share2, AlertTriangle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isToday, isFuture, isPast } from 'date-fns';

export default function DoctorHome() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'completed', 'rejected'
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'upcoming', 'past'
  const [searchQuery, setSearchQuery] = useState('');

  // Approval Modal State
  const [approveModalReq, setApproveModalReq] = useState(null);
  const [approveForm, setApproveForm] = useState({ date: '', timeSlot: '12:00 PM - 2:00 PM', notes: '' });
  const [doctorShifts, setDoctorShifts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Load and listen to doctor profile & shifts
    const unsubDoc = onSnapshot(doc(db, 'doctors', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDoctorProfile(data);
        if (data.shifts) {
          setDoctorShifts(data.shifts.filter(s => s.active));
        }
      }
    }, (err) => console.error(err));

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', user.uid)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort newest created or approved first
      data.sort((a, b) => {
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return timeB - timeA;
      });
      setAppointments(data);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'appointments');
      setLoading(false);
    });

    return () => {
      unsubDoc();
      unsub();
    };
  }, [user]);

  const updateOpdBeacon = async (beaconStatus, message = '') => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'doctors', user.uid), {
        opdBeacon: {
          status: beaconStatus,
          message: message,
          updatedAt: serverTimestamp()
        }
      });
    } catch (e) {
      console.error('Failed to update OPD beacon', e);
    }
  };

  const shareOnWhatsApp = (app) => {
    const repName = app.repSnapshot?.name || 'Medical Rep';
    const repCompany = app.repSnapshot?.company || 'Pharma';
    const token = app.token || 'N/A';
    const slot = app.approvedTimeSlot || 'Today';
    const dateStr = app.approvedDate?.toDate ? format(app.approvedDate.toDate(), 'dd MMM yyyy') : 'Today';
    const statusUrl = `${window.location.origin}/status/${app.id}`;
    
    const text = `🏥 *GATEPASS VERIFIED ENTRY PASS*\n` +
      `*Doctor:* Dr. ${userData?.name || 'Doctor'}\n` +
      `*Status:* Confirmed & Scheduled\n` +
      `*Token:* #${token}\n` +
      `*Date:* ${dateStr}\n` +
      `*Shift Window:* ${slot}\n` +
      `*Visitor:* ${repName} (${repCompany})\n` +
      `*Live Gatepass Slip:* ${statusUrl}\n\n` +
      `_Please present this pass at the clinic reception desk on arrival._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Auto-Archive Logic: 7 Days after Completed status
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

  const isAppointmentArchived = (app) => {
    if (app.status === 'archived') return true;
    if (app.status === 'completed') {
      const completedTime = app.completedAt?.toMillis
        ? app.completedAt.toMillis()
        : (app.completedAt instanceof Date ? app.completedAt.getTime() : null);
      
      const refTime = completedTime || (app.approvedDate?.toMillis ? app.approvedDate.toMillis() : (app.createdAt?.toMillis ? app.createdAt.toMillis() : null));
      if (refTime && (Date.now() - refTime > SEVEN_DAYS_MS)) {
        return true;
      }
    }
    return false;
  };

  // Calculate Status Counts
  const counts = {
    all: appointments.filter(a => !isAppointmentArchived(a)).length,
    pending: appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'approved' || a.status === 'confirmed').length,
    completed: appointments.filter(a => a.status === 'completed' && !isAppointmentArchived(a)).length,
    rejected: appointments.filter(a => a.status === 'rejected').length,
    archived: appointments.filter(a => isAppointmentArchived(a)).length,
  };

  // Filter Logic
  const filteredAppointments = appointments.filter(app => {
    const isArchived = isAppointmentArchived(app);

    // 1. Status Filter
    if (statusFilter === 'all' && isArchived) return false;
    if (statusFilter === 'pending' && app.status !== 'pending') return false;
    if (statusFilter === 'confirmed' && (app.status !== 'approved' && app.status !== 'confirmed')) return false;
    if (statusFilter === 'completed' && (app.status !== 'completed' || isArchived)) return false;
    if (statusFilter === 'rejected' && app.status !== 'rejected') return false;
    if (statusFilter === 'archived' && !isArchived) return false;

    // 2. Date Filter
    const targetDate = app.approvedDate?.toDate ? app.approvedDate.toDate() : (app.preferredDate?.toDate ? app.preferredDate.toDate() : null);
    if (targetDate) {
      if (dateFilter === 'today' && !isToday(targetDate)) return false;
      if (dateFilter === 'upcoming' && (!isFuture(targetDate) || isToday(targetDate))) return false;
      if (dateFilter === 'past' && !isPast(targetDate)) return false;
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const repName = app.repSnapshot?.name?.toLowerCase() || '';
      const repCompany = app.repSnapshot?.company?.toLowerCase() || '';
      const focus = app.productFocus?.toLowerCase() || '';
      const category = app.therapeuticCategory?.toLowerCase() || '';
      const token = app.token?.toLowerCase() || '';

      if (!repName.includes(q) && !repCompany.includes(q) && !focus.includes(q) && !category.includes(q) && !token.includes(q)) {
        return false;
      }
    }

    return true;
  });

  const formatTime12 = (t24) => {
    if (!t24) return '';
    const [hStr, mStr] = t24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  // Actions
  const handleApproveClick = (req) => {
    const initialSlot = doctorShifts.length > 0
      ? `${doctorShifts[0].title} (${formatTime12(doctorShifts[0].startTime)} - ${formatTime12(doctorShifts[0].endTime)})`
      : '12:00 PM - 2:00 PM';

    setApproveForm({
      date: req.preferredDate ? format(req.preferredDate.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      timeSlot: initialSlot,
      notes: ''
    });
    setApproveModalReq(req);
  };

  const confirmApprove = async () => {
    if (!approveModalReq) return;
    setIsProcessing(true);
    try {
      const batch = writeBatch(db);
      const tokenStr = await generateUniqueToken(db);
      const appDate = parseISO(approveForm.date);
      
      const appRef = doc(db, 'appointments', approveModalReq.id);
      const tokenRef = doc(db, 'tokens', tokenStr);
      
      batch.update(appRef, {
        status: 'approved',
        token: tokenStr,
        approvedDate: appDate,
        approvedTimeSlot: approveForm.timeSlot,
        tokenIssuedAt: serverTimestamp(),
        tokenExpiresAt: getMidnightIST(appDate),
        doctorNotes: approveForm.notes || null,
        approvedAt: serverTimestamp(),
      });

      batch.set(tokenRef, {
        tokenCode: tokenStr,
        appointmentId: approveModalReq.id,
        doctorId: user.uid,
        clinicId: approveModalReq.clinicId,
        repId: approveModalReq.repId,
        approvedDate: appDate,
        expiresAt: getMidnightIST(appDate),
        isUsed: false
      });

      await batch.commit();
      setApproveModalReq(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${approveModalReq?.id}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReject = async (reqId) => {
    try {
      await updateDoc(doc(db, 'appointments', reqId), {
        status: 'rejected',
        rejectedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${reqId}`);
    }
  };

  const markCompleted = async (reqId) => {
    try {
      await updateDoc(doc(db, 'appointments', reqId), {
        status: 'completed',
        completedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${reqId}`);
    }
  };

  const copyToken = (token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (loading) {
    return <div className="text-gray-400 font-medium font-sans flex items-center justify-center p-12 animate-pulse">Loading dashboard schedule...</div>;
  }

  return (
    <div className="pb-12 font-sans animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-gray-400 text-xs font-semibold tracking-[0.2em] uppercase mb-1">Gatepass Dashboard</p>
          <h1 className="text-3xl sm:text-4xl font-display font-black text-premium-900 tracking-tight leading-tight">
            Welcome back, <span className="text-emerald-600">Dr. {userData?.name?.split(' ')[0]}</span>
          </h1>
        </div>
        <button 
          onClick={() => navigate('/admin/profile')} 
          className="bg-white border border-gray-200 text-premium-900 px-5 py-3 rounded-[1.25rem] font-bold text-sm shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <QrCode className="w-4 h-4 text-emerald-600" /> Share Gatepass QR
        </button>
      </div>

      {/* Live OPD Beacon & Clinic Protocol Hub */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] p-5 sm:p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Doctor OPD Beacon</span>
              <span className="text-xs text-gray-300">•</span>
              <span className="text-xs text-gray-500 font-medium">Broadcasts live cabin delay to Rep passes & Reception desk</span>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {(!doctorProfile?.opdBeacon || doctorProfile?.opdBeacon?.status === 'on_time') && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  OPD On-Time · Admitting Scheduled Reps
                </div>
              )}
              {doctorProfile?.opdBeacon?.status === 'delayed_30' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Running ~30 Mins Late (Ward Rounds / Patient Rush)
                </div>
              )}
              {doctorProfile?.opdBeacon?.status === 'break' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold text-xs">
                  <Coffee className="w-4 h-4 text-blue-500" />
                  15-Min Quick Tea Break
                </div>
              )}
              {doctorProfile?.opdBeacon?.status === 'emergency' && (
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  Emergency Procedure / OT Pause
                </div>
              )}

              {doctorProfile?.opdBeacon?.message && (
                <span className="text-xs text-gray-500 italic bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100">
                  "{doctorProfile.opdBeacon.message}"
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => updateOpdBeacon('on_time', 'OPD running on schedule')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${(!doctorProfile?.opdBeacon || doctorProfile?.opdBeacon?.status === 'on_time') ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
            >
              On-Time
            </button>
            <button
              onClick={() => updateOpdBeacon('delayed_30', 'Patient rush in OPD')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${doctorProfile?.opdBeacon?.status === 'delayed_30' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
            >
              +30m Delay
            </button>
            <button
              onClick={() => updateOpdBeacon('break', 'Doctor having quick tea break')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${doctorProfile?.opdBeacon?.status === 'break' ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
            >
              Tea Break
            </button>
            <button
              onClick={() => updateOpdBeacon('emergency', 'Attending emergency cases')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${doctorProfile?.opdBeacon?.status === 'emergency' ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'}`}
            >
              Emergency
            </button>

            <div className="h-6 w-px bg-gray-200 hidden sm:block mx-1"></div>

            <button
              onClick={() => navigate('/admin/desk')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              Reception Desk
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <div 
          onClick={() => setStatusFilter('pending')}
          className={`bg-white rounded-[1.5rem] p-5 border transition-all cursor-pointer ${statusFilter === 'pending' ? 'ring-2 ring-amber-500 border-amber-300 shadow-md' : 'border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:border-amber-200'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Pending</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-premium-900">{counts.pending}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('confirmed')}
          className={`bg-white rounded-[1.5rem] p-5 border transition-all cursor-pointer ${statusFilter === 'confirmed' ? 'ring-2 ring-emerald-500 border-emerald-300 shadow-md' : 'border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:border-emerald-200'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Confirmed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-premium-900">{counts.confirmed}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('completed')}
          className={`bg-white rounded-[1.5rem] p-5 border transition-all cursor-pointer ${statusFilter === 'completed' ? 'ring-2 ring-blue-500 border-blue-300 shadow-md' : 'border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:border-blue-200'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Completed</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-premium-900">{counts.completed}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-[1.5rem] p-5 border transition-all cursor-pointer ${statusFilter === 'all' ? 'ring-2 ring-premium-900 border-gray-300 shadow-md' : 'border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:border-gray-300'}`}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Total Visits</span>
            <div className="w-9 h-9 rounded-xl bg-premium-50 text-premium-900 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-display font-black text-premium-900">{counts.all}</p>
        </div>
      </div>

      {/* Main Filter & Schedule Section */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_4px_25px_rgb(0,0,0,0.03)] p-6 sm:p-8">
        
        {/* Filter Title Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-2xl font-display font-bold text-premium-900 tracking-tight flex items-center gap-2">
              Appointment Schedule
            </h2>
            <p className="text-gray-500 font-medium text-sm mt-0.5">
              Filter by status or search reps to manage your daily visits.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Search rep, company, drug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-premium-50 border border-gray-200/80 rounded-[1.25rem] pl-10 pr-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-premium-900 placeholder:text-gray-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-premium-900">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-none">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2.5 rounded-[1rem] font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-premium-900 text-white shadow-sm'
                : 'bg-premium-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({counts.all})
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2.5 rounded-[1rem] font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'pending'
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100/80 border border-amber-200/60'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Pending ({counts.pending})
          </button>

          <button
            onClick={() => setStatusFilter('confirmed')}
            className={`px-4 py-2.5 rounded-[1rem] font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'confirmed'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 border border-emerald-200/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Confirmed ({counts.confirmed})
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-4 py-2.5 rounded-[1rem] font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'completed'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            Completed ({counts.completed})
          </button>

          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-4 py-2.5 rounded-[1rem] font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'rejected'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100/80 border border-rose-200/60'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Rejected ({counts.rejected})
          </button>

          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-4 py-2.5 rounded-[1rem] font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-2 whitespace-nowrap ${
              statusFilter === 'archived'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100/80 border border-purple-200/60'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            Archived ({counts.archived})
          </button>
        </div>

        {/* Secondary Date Filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mr-2 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Date:
          </span>
          {['all', 'today', 'upcoming', 'past'].map((df) => (
            <button
              key={df}
              onClick={() => setDateFilter(df)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${
                dateFilter === df
                  ? 'bg-gray-200 text-premium-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {df}
            </button>
          ))}
        </div>

        {/* Appointments List */}
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-16 px-4 bg-premium-50/50 rounded-[1.5rem] border border-dashed border-gray-200">
            <div className="w-14 h-14 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-4 shadow-sm">
              <Calendar className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-premium-900 text-lg">No Appointments Found</h3>
            <p className="text-gray-500 font-medium text-sm mt-1 max-w-sm mx-auto">
              {statusFilter !== 'all' || searchQuery
                ? 'Try clearing or changing your status or search filter.'
                : 'Share your Gatepass link with reps to start receiving appointment requests.'}
            </p>
            {(statusFilter !== 'all' || searchQuery || dateFilter !== 'all') && (
              <button
                onClick={() => {
                  setStatusFilter('all');
                  setDateFilter('all');
                  setSearchQuery('');
                }}
                className="mt-4 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-premium-900 hover:bg-gray-50 transition-all shadow-sm"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((app) => {
              const isArchived = isAppointmentArchived(app);
              const isPending = app.status === 'pending';
              const isConfirmed = app.status === 'approved' || app.status === 'confirmed';
              const isCompleted = app.status === 'completed' && !isArchived;
              const isRejected = app.status === 'rejected';

              const appDate = app.approvedDate?.toDate
                ? app.approvedDate.toDate()
                : app.preferredDate?.toDate
                ? app.preferredDate.toDate()
                : null;

              return (
                <div
                  key={app.id}
                  className="bg-white rounded-[1.5rem] border border-gray-100 p-5 sm:p-6 shadow-[0_2px_12px_rgb(0,0,0,0.02)] hover:border-gray-200 hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  {/* Rep Info & Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3.5 mb-3">
                      <div className="w-11 h-11 rounded-2xl bg-premium-50 border border-gray-100 text-emerald-700 font-display font-black text-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                        {app.repSnapshot?.name?.[0] || 'R'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-premium-900 text-base truncate">
                            {app.repSnapshot?.name || 'Representative'}
                          </h3>

                          {/* Status Badge */}
                          {isPending && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200/80">
                              Pending
                            </span>
                          )}
                          {isConfirmed && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              Confirmed
                            </span>
                          )}
                          {isCompleted && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-200/80">
                              Completed
                            </span>
                          )}
                          {isRejected && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-rose-50 text-rose-700 border border-rose-200/80">
                              Rejected
                            </span>
                          )}
                          {isArchived && (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-purple-50 text-purple-700 border border-purple-200/80 flex items-center gap-1">
                              <Archive className="w-3 h-3" /> Archived
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-gray-500 mt-0.5">
                          {app.repSnapshot?.company} {app.repSnapshot?.designation ? `• ${app.repSnapshot.designation}` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Product & Time details */}
                    <div className="bg-premium-50/60 rounded-xl p-3.5 space-y-2 text-xs font-medium text-gray-700 border border-gray-100/60">
                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400 w-16">Focus:</span>
                        <span className="font-semibold text-premium-900">{app.productFocus}</span>
                      </div>

                      {app.therapeuticCategory && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400 w-16">Category:</span>
                          <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-gray-700 font-semibold text-[11px]">
                            {app.therapeuticCategory}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-gray-400 w-16">Schedule:</span>
                        <span className="font-semibold text-premium-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-400" />
                          {appDate ? format(appDate, 'MMM dd, yyyy') : 'N/A'}
                          {app.approvedTimeSlot ? ` (${app.approvedTimeSlot})` : ''}
                        </span>
                      </div>

                      {app.token && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="font-bold uppercase tracking-wider text-[10px] text-emerald-600 w-16">Token:</span>
                          <div className="inline-flex items-center gap-1.5 font-mono font-bold bg-white px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-800 shadow-2xs">
                            {app.token}
                            <button 
                              onClick={() => copyToken(app.token)} 
                              title="Copy Token" 
                              className="text-gray-400 hover:text-emerald-700 ml-1"
                            >
                              {copiedToken === app.token ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex flex-row md:flex-col items-end justify-between md:justify-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    
                    {/* Pending Actions */}
                    {isPending && (
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                          onClick={() => confirmReject(app.id)}
                          className="px-4 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all active:scale-95 shadow-2xs flex-1 md:flex-none text-center"
                        >
                          Decline
                        </button>
                        <button
                          onClick={() => handleApproveClick(app)}
                          className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-[0_4px_12px_rgba(5,150,105,0.25)] transition-all active:scale-95 flex-1 md:flex-none text-center"
                        >
                          Approve
                        </button>
                      </div>
                    )}

                    {/* Confirmed Actions */}
                    {isConfirmed && (
                      <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
                        <button
                          onClick={() => shareOnWhatsApp(app)}
                          className="w-full md:w-auto px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
                          title="Share confirmation pass via WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                        </button>
                        <button
                          onClick={() => markCompleted(app.id)}
                          className="w-full md:w-auto px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all active:scale-95 flex items-center justify-center gap-1.5"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Mark Completed
                        </button>
                      </div>
                    )}

                    {/* Completed State Indicator */}
                    {isCompleted && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/80">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                        Visit Completed
                      </div>
                    )}

                    {/* Rejected State Indicator */}
                    {isRejected && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200/80">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Declined
                      </div>
                    )}

                    {/* Archived State Indicator */}
                    {isArchived && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200/80">
                        <Archive className="w-4 h-4 text-purple-600" />
                        Archived (7d+ Completed)
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Approval Bottom Sheet / Modal */}
      {approveModalReq && (
        <div className="fixed inset-0 bg-premium-900/60 z-[100] flex items-end sm:items-center justify-center p-4 backdrop-blur-md transition-all duration-500">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-8 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-display font-bold text-premium-900 tracking-tight">Approve Appointment</h3>
              <button onClick={() => setApproveModalReq(null)} className="p-2 bg-premium-50 hover:bg-gray-200 rounded-[0.75rem] text-gray-500 transition-colors border border-gray-100">
                <X className="w-4 h-4"/>
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Confirmed Date</label>
                <input 
                  type="date"
                  value={approveForm.date}
                  onChange={e => setApproveForm({...approveForm, date: e.target.value})}
                  className="w-full border border-gray-200 rounded-[1rem] px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-premium-50 text-premium-900 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Time Slot</label>
                <div className="relative">
                  <select 
                    value={approveForm.timeSlot}
                    onChange={e => setApproveForm({...approveForm, timeSlot: e.target.value})}
                    className="w-full border border-gray-200 rounded-[1rem] pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-premium-50 text-premium-900 appearance-none text-sm"
                  >
                    {doctorShifts.length > 0 ? (
                      doctorShifts.map(s => {
                        const label = `${s.title} (${formatTime12(s.startTime)} - ${formatTime12(s.endTime)})`;
                        return <option key={s.id} value={label}>{label}</option>;
                      })
                    ) : (
                      <>
                        <option>8:00 AM - 10:00 AM</option>
                        <option>10:00 AM - 12:00 PM</option>
                        <option>12:00 PM - 2:00 PM</option>
                        <option>2:00 PM - 4:00 PM</option>
                        <option>4:00 PM - 6:00 PM</option>
                      </>
                    )}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 flex justify-between">
                  <span>Internal Notes</span>
                  <span className="text-gray-300">Optional</span>
                </label>
                <input 
                  type="text"
                  value={approveForm.notes}
                  onChange={e => setApproveForm({...approveForm, notes: e.target.value})}
                  placeholder="e.g. Discuss new cardiology drug line"
                  className="w-full border border-gray-200 rounded-[1rem] px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-premium-50 text-premium-900 text-sm"
                />
              </div>
            </div>

            <button 
              onClick={confirmApprove}
              disabled={isProcessing}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-[1.25rem] shadow-[0_4px_14px_rgba(5,150,105,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
            >
              {isProcessing ? 'Generating Token...' : 'Confirm & Issue Gatepass'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
