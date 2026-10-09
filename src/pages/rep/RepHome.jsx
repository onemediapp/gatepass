import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { collection, query, where, orderBy, getDocs, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import { 
  Search, Bell, Clock, Building2, MapPin, Activity, Stethoscope, 
  ChevronRight, X, CheckCircle2, UserCheck, XCircle, Sparkles,
  FileText, Share2, Copy, Check, QrCode
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

export default function RepHome() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [activeRequests, setActiveRequests] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [copiedDcr, setCopiedDcr] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;
    
    // Listen to active (pending or approved but unused) appointments
    const q = query(
      collection(db, 'appointments'),
      where('repId', '==', user.uid),
      where('status', 'in', ['pending', 'approved']),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, async (snap) => {
      const requests = [];
      for (const reqDoc of snap.docs) {
         const requestData = reqDoc.data();
         requests.push({ id: reqDoc.id, ...requestData });
      }
      setActiveRequests(requests);
      setLoading(false);
    });

    // Listen to recent status updates for notifications
    const notifQ = query(
      collection(db, 'appointments'),
      where('repId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const notifUnsub = onSnapshot(notifQ, (snap) => {
      const updates = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentUpdates(updates);
    });

    // Listen to all appointments for DCR generation
    const dcrQ = query(
      collection(db, 'appointments'),
      where('repId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const dcrUnsub = onSnapshot(dcrQ, (snap) => {
      setTodayAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubscribe();
      notifUnsub();
      dcrUnsub();
    };
  }, [user]);

  const generateDcrText = () => {
    const todayStr = format(new Date(), 'dd MMM yyyy');
    let text = `📋 *PHARMA DAILY CALL REPORT (DCR)*\n`;
    text += `👤 *Rep:* ${userData?.name || 'MR'} | ${userData?.company || 'Pharma'}\n`;
    text += `📅 *Date:* ${todayStr}\n`;
    text += `📍 *Territory/HQ:* ${userData?.headquarters || userData?.city || 'India'}\n\n`;
    text += `*DOCTORS VISITED TODAY:*\n`;

    if (todayAppointments.length === 0) {
      text += `No scheduled doctor calls logged today.\n`;
    } else {
      todayAppointments.forEach((a, i) => {
        const docName = a.doctorName || 'Dr. Specialist';
        const clinic = a.clinicName || 'Clinic';
        const st = a.status === 'completed' ? '✅ Met (Completed)' : (a.status === 'approved' ? '🎫 Pass Issued' : '⏳ Scheduled');
        const token = a.token ? `#${a.token}` : 'N/A';
        const prod = a.productFocus ? ` [Focus: ${a.productFocus}]` : '';
        text += `${i + 1}. Dr. ${docName} - ${clinic} | ${st} | Token: ${token}${prod}\n`;
      });
    }

    text += `\n_Generated via Gatepass India Medical OS._`;
    return text;
  };

  const shareDcrOnWhatsApp = () => {
    const text = generateDcrText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyDcr = () => {
    const text = generateDcrText();
    navigator.clipboard.writeText(text);
    setCopiedDcr(true);
    setTimeout(() => setCopiedDcr(false), 2000);
  };

  const firstName = userData?.name?.split(' ')[0] || 'Rep';

  const approvedCount = activeRequests.filter(r => r.status === 'approved').length;

  return (
    <div className="min-h-screen bg-premium-50 pb-24 font-sans text-gray-900 selection:bg-emerald-100">
      <div className="bg-premium-900 pb-[5.5rem] pt-10 px-6 rounded-b-[2.5rem] shadow-[0_10px_30px_rgba(15,23,42,0.1)] relative overflow-hidden">
        {/* Subtle background glow & texture */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.02] mix-blend-overlay pointer-events-none"></div>
        
        <div className="max-w-md mx-auto relative z-10 flex justify-between items-start">
          <div className="animate-in fade-in slide-in-from-left-4 duration-700">
             <p className="text-gray-400 text-xs font-semibold tracking-[0.2em] uppercase mb-1">Good morning</p>
             <h1 className="text-white text-3xl font-display font-bold tracking-tight">{firstName}</h1>
          </div>
          <button 
            onClick={() => setShowNotifications(true)}
            className="w-11 h-11 bg-white/5 rounded-[1.25rem] flex items-center justify-center text-white backdrop-blur-md relative border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 animate-in fade-in slide-in-from-right-4 duration-700"
          >
             <Bell className="w-5 h-5 opacity-90" />
             {activeRequests.length > 0 && (
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
             )}
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto px-5 -mt-12 relative z-20 space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
        {/* Search Bar */}
        <div 
          onClick={() => navigate('/rep/search')}
          className="bg-white/70 backdrop-blur-xl border border-white/80 rounded-[1.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04),0_1px_3px_rgb(0,0,0,0.02)] p-4 flex items-center gap-3 cursor-text hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] transition-all active:scale-[0.98]"
        >
          <Search className="w-5 h-5 text-gray-400 ml-1" />
          <span className="text-gray-400 text-[15px] flex-1 font-medium">Search doctor, specialty...</span>
          <div className="w-9 h-9 rounded-[1rem] bg-premium-50 border border-gray-100 text-premium-900 flex items-center justify-center pointer-events-none shadow-sm">
            <Activity className="w-4 h-4 opacity-70" />
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1 -mx-5 px-5">
           {['All Specialists', 'Cardiologist', 'Diabetologist', 'Physician'].map((filter, index) => (
             <button 
               key={filter} 
               onClick={() => navigate('/rep/search')}
               className={cn(
                 "whitespace-nowrap px-5 py-2.5 rounded-[1rem] text-[13px] font-semibold transition-all active:scale-95 border",
                 index === 0 
                   ? "bg-premium-900 text-white border-transparent shadow-[0_4px_14px_rgba(15,23,42,0.2)]" 
                   : "bg-white text-gray-600 border-gray-200 shadow-sm hover:bg-premium-50 hover:border-gray-300"
               )}
             >
                {filter}
             </button>
           ))}
        </div>

        {/* Active Requests */}
        <div>
           <div className="flex justify-between items-center mb-4 px-1">
             <h2 className="text-xl font-display font-bold text-premium-900 tracking-tight">Active Visits</h2>
             <button onClick={() => navigate('/rep/history')} className="text-[13px] font-bold text-gray-400 hover:text-premium-900 active:scale-95 transition-all flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
             </button>
           </div>
          
           <div className="space-y-3">
             {loading ? (
               [1, 2].map(i => (
                 <div key={i} className="bg-white/60 animate-pulse h-28 rounded-[1.5rem] p-5 border border-gray-100/50"></div>
               ))
             ) : activeRequests.length > 0 ? (
               activeRequests.map(req => (
                 <div 
                   key={req.id} 
                   onClick={() => navigate(`/status/${req.id}`)}
                   className="bg-white shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 rounded-[1.25rem] p-5 cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-gray-200 transition-all flex items-center justify-between group active:scale-[0.98]"
                 >
                   <div className="flex gap-4 w-full items-center">
                     <div className="w-12 h-12 bg-premium-50 rounded-[1rem] flex flex-shrink-0 items-center justify-center text-premium-900 border border-gray-100 group-hover:bg-premium-100 transition-colors shadow-sm">
                       <Clock className="w-5 h-5 opacity-80" />
                     </div>
                     <div className="flex-1 min-w-0 pr-2">
                       <h3 className="font-bold text-premium-900 text-[15px] line-clamp-1 tracking-tight">{req.doctorName || 'Doctor Request'}</h3>
                       <p className="text-[13px] text-gray-500 truncate font-medium mt-0.5 mb-1.5">{req.clinicName || 'Clinic'}</p>
                       
                       <span className={cn(
                         "inline-flex items-center text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded-md border",
                         req.status === 'pending' ? "bg-amber-50/50 text-amber-700 border-amber-200/60" : "bg-emerald-50/50 text-emerald-700 border-emerald-200/60"
                       )}>
                         <span className={cn("w-1 h-1 rounded-full mr-1.5", req.status === 'pending' ? 'bg-amber-500' : 'bg-emerald-500')}></span>
                         {req.status === 'pending' ? 'Reviewing' : 'Approved Gatepass'}
                       </span>
                     </div>
                     <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                   </div>
                 </div>
               ))
             ) : (
               <div className="bg-white/60 border border-dashed border-gray-200 shadow-sm rounded-[1.5rem] py-10 px-6 text-center backdrop-blur-sm">
                 <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 mx-auto mb-3">
                   <Stethoscope className="w-6 h-6" />
                 </div>
                 <h3 className="text-base font-display font-bold text-premium-900 tracking-tight">No active visits</h3>
                 <p className="text-xs text-gray-500 mt-1 mb-4 font-medium">Start connecting with top doctors in your territory.</p>
                 <button 
                   onClick={() => navigate('/rep/search')}
                   className="bg-premium-900 text-white font-medium text-xs px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-all"
                 >
                   Find Specialists
                 </button>
               </div>
             )}
           </div>
        </div>

        {/* Daily Call Report (DCR) Bharat Pharma Section */}
        <div className="bg-white shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100/80 rounded-[1.75rem] p-5 relative overflow-hidden">
           <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2.5">
               <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-xs">
                 <FileText className="w-4 h-4" />
               </div>
               <div>
                 <h3 className="font-bold text-premium-900 text-sm">Daily Call Report (DCR)</h3>
                 <p className="text-[11px] text-gray-500 font-medium">Auto-compiled for ASM reporting</p>
               </div>
             </div>
             <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200/60">
               {todayAppointments.filter(a => a.status === 'completed').length} / {todayAppointments.length} Met
             </span>
           </div>

           <p className="text-xs text-gray-600 mb-4 leading-relaxed">
             Instantly format today's doctor visits, clinic gatepasses, and product discussions for your daily WhatsApp field report.
           </p>

           <div className="flex gap-2.5">
             <button
               onClick={shareDcrOnWhatsApp}
               className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
             >
               <Share2 className="w-3.5 h-3.5" />
               Send on WhatsApp
             </button>
             <button
               onClick={copyDcr}
               className="px-4 py-3 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
             >
               {copiedDcr ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
               {copiedDcr ? 'Copied!' : 'Copy Text'}
             </button>
           </div>
        </div>
      </div>

      {/* Notifications Drawer */}
      {showNotifications && (
        <div className="fixed inset-0 bg-premium-900/60 z-[100] flex items-end sm:items-center justify-center p-4 backdrop-blur-md transition-all duration-300">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-8 duration-300 flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xl font-display font-bold text-premium-900 tracking-tight">Real-time Updates</h3>
              </div>
              <button onClick={() => setShowNotifications(false)} className="p-2 bg-premium-50 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 flex-1 pr-1">
              {recentUpdates.length === 0 ? (
                <p className="text-center py-8 text-gray-400 font-medium text-sm">No recent updates yet.</p>
              ) : (
                recentUpdates.map(up => (
                  <div 
                    key={up.id} 
                    onClick={() => {
                      setShowNotifications(false);
                      navigate(`/status/${up.id}`);
                    }}
                    className="p-3.5 rounded-2xl bg-premium-50/80 border border-gray-100 hover:border-gray-200 transition-all cursor-pointer flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-xl bg-white border border-gray-200/60 flex items-center justify-center flex-shrink-0 text-emerald-600 mt-0.5 shadow-2xs">
                      {(up.status === 'approved' || up.status === 'confirmed') && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {up.status === 'completed' && <UserCheck className="w-4 h-4 text-blue-600" />}
                      {up.status === 'rejected' && <XCircle className="w-4 h-4 text-rose-600" />}
                      {up.status === 'pending' && <Clock className="w-4 h-4 text-amber-600" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-premium-900 text-xs truncate">Dr. {up.doctorName || 'Doctor'}</p>
                      <p className="text-[11px] font-medium text-gray-500 mt-0.5">
                        Status: <span className="font-bold capitalize">{up.status === 'approved' ? 'Gatepass Confirmed' : up.status}</span>
                      </p>
                      {up.token && (
                        <span className="inline-block text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60 mt-1">
                          Token: {up.token}
                        </span>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      
      <RepBottomNav />
    </div>
  );
}
