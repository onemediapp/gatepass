import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrors';
import { Clock, CheckCircle2, XCircle, MapPin, Calendar, ExternalLink, ShieldCheck, ChevronLeft, Ticket, Share2, AlertTriangle, Coffee } from 'lucide-react';
import { format } from 'date-fns';

export default function StatusCheck() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  const sharePassOnWhatsApp = () => {
    if (!appointment || !doctor) return;
    const token = appointment.token || '';
    const slot = appointment.approvedTimeSlot || 'Today';
    const repName = appointment.repSnapshot?.name || 'Medical Rep';
    const repCompany = appointment.repSnapshot?.company || '';
    const clinicName = clinic?.clinicName || 'Clinic';
    const passUrl = window.location.href;

    const text = `🏥 *VERIFIED CLINICAL GATEPASS*\n\n` +
      `👨‍⚕️ *Doctor:* Dr. ${doctor.name} (${doctor.specialty || 'Consultant'})\n` +
      `📍 *Location:* ${clinicName}\n` +
      `🎫 *Token:* #${token}\n` +
      `⏰ *Shift:* ${slot}\n` +
      `👤 *Medical Rep:* ${repName} (${repCompany})\n` +
      `🔗 *Live Gatepass Link:* ${passUrl}\n\n` +
      `_Presented via Gatepass India Medical Protocol._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  useEffect(() => {
    if (!appointmentId) return;

    const unsub = onSnapshot(
      doc(db, 'appointments', appointmentId),
      async (snap) => {
        if (!snap.exists()) {
          setLoading(false);
          setErrorStatus('not_found');
          return;
        }
        
        const data = snap.data();
        let currentStatus = data.status;

        // Auto expire if approved but past midnight
        if (data.status === 'approved' && data.tokenExpiresAt) {
           if (new Date() > data.tokenExpiresAt.toDate()) {
              currentStatus = 'expired';
           }
        }
        
        setAppointment({ id: snap.id, ...data, computedStatus: currentStatus });
        
        // Fetch relations if not already fetched
        if (!doctor && data.doctorId) {
           const [dSnap, uSnap, cSnap] = await Promise.all([
             getDoc(doc(db, 'doctors', data.doctorId)),
             getDoc(doc(db, 'users', data.doctorId)),
             data.clinicId ? getDoc(doc(db, 'clinics', data.clinicId)) : Promise.resolve({ exists: () => false })
           ]);
           if (dSnap.exists()) setDoctor({ ...dSnap.data(), name: uSnap.exists() ? uSnap.data().name : 'Unknown' });
           if (cSnap.exists()) setClinic(cSnap.data());
        }
        setLoading(false);
      },
      (error) => {
         handleFirestoreError(error, OperationType.GET, `appointments/${appointmentId}`);
         setLoading(false);
         setErrorStatus('error');
      }
    );

    return () => unsub();
  }, [appointmentId]); 

  // Wake lock & Countdown for Approved State
  useEffect(() => {
    let wakeLock = null;
    let timerId = null;

    if (appointment?.computedStatus === 'approved') {
       const requestWakeLock = async () => {
         try {
           if ('wakeLock' in navigator) {
             wakeLock = await navigator.wakeLock.request('screen');
           }
         } catch(err) {
           console.log('Wake Lock error', err);
         }
       };
       requestWakeLock();

       // Countdown Timer
       const exp = appointment.tokenExpiresAt?.toDate();
       if (exp) {
          timerId = setInterval(() => {
             const now = new Date().getTime();
             const distance = exp.getTime() - now;
             
             if (distance < 0) {
                clearInterval(timerId);
                setTimeLeft('EXPIRED');
                setIsExpired(true);
             } else {
                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((distance % (1000 * 60)) / 1000);
                setTimeLeft(`${h}h ${m}m ${s}s`);
             }
          }, 1000);
       }
    }

    return () => {
       if (wakeLock !== null) wakeLock.release();
       if (timerId) clearInterval(timerId);
    };
  }, [appointment?.computedStatus, appointment?.tokenExpiresAt]);

  if (loading) return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans tracking-tight text-gray-500">Checking status...</div>;
  if (errorStatus === 'not_found') return <div className="min-h-screen bg-[#F4F6F8] flex items-center justify-center font-sans"><h2 className="text-xl font-bold">Request not found</h2></div>;

  const status = isExpired ? 'expired' : appointment.computedStatus;

  if (status === 'approved') {
     return (
       <div className="fixed inset-0 bg-[#0F172A] z-50 overflow-y-auto font-sans">
         {/* Live pulsing border wrapper for the whole screen */}
         <div className="absolute inset-1.5 sm:inset-3 border-[6px] border-[#0E9F6E]/40 rounded-[2.5rem] animate-pulse pointer-events-none z-50 mix-blend-screen"></div>
         
         {/* Background ambiance */}
         <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-[#0E9F6E]/20 to-transparent blur-[80px] pointer-events-none"></div>
         
         <div className="flex flex-col min-h-screen pt-4 pb-10 px-4 sm:px-6 relative z-10">
           
           {/* Top Navigation */}
           <div className="flex justify-between items-center px-2 py-4 mb-4">
              <button onClick={() => navigate('/rep/home')} className="p-2.5 bg-white/10 rounded-full text-white hover:bg-white/20 active:scale-95 transition-all outline-none">
                 <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10">
                 <div className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_10px_#10B981] animate-pulse"></div>
                 <span className="text-white text-xs font-bold tracking-widest uppercase">Live Gatepass</span>
              </div>
              <div className="w-11"></div> {/* Balance spacer p-2.5(10)+w-6(24)=34 + margin? close enough */}
           </div>

           {/* The Ticket */}
           <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl mx-auto w-full max-w-sm flex flex-col relative animate-in slide-in-from-bottom-8 duration-700 ease-out">
              
              {/* Ticket Header Graphic */}
              <div className="bg-[#0E9F6E] pt-10 pb-14 px-6 text-center text-white relative">
                 {/* Internal glow */}
                 <div className="absolute inset-0 overflow-hidden">
                   <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
                   <div className="absolute bottom-0 left-10 w-32 h-32 bg-[#059669] rounded-full blur-2xl"></div>
                 </div>
                 
                 <div className="relative z-10 flex flex-col items-center">
                    <CheckCircle2 className="w-14 h-14 text-white mb-2 shadow-sm rounded-full bg-[#0E9F6E]" strokeWidth={3} />
                    <h1 className="text-[2rem] leading-none font-display font-black tracking-wide mb-1">APPROVED</h1>
                    <p className="font-bold tracking-[0.2em] text-green-100/90 text-xs mt-1">ENTRY GRANTED</p>
                 </div>
              </div>

              {/* Ticket Cutout Details (The perforated middle) */}
              <div className="relative bg-white pt-2 pb-6 px-6 z-20">
                 {/* Left notch */}
                 <div className="absolute -left-4 -top-4 w-8 h-8 rounded-full bg-[#0F172A]"></div>
                 {/* Right notch */}
                 <div className="absolute -right-4 -top-4 w-8 h-8 rounded-full bg-[#0F172A]"></div>
                 {/* Perforation line */}
                 <div className="absolute top-0 left-6 right-6 border-t-2 border-dashed border-gray-200"></div>

                 {/* Doctor OPD Live Beacon Alert */}
                 {doctor?.opdBeacon && (
                   <div className="mt-4 mb-1">
                     {doctor.opdBeacon.status === 'delayed_30' && (
                       <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                         <p className="text-xs font-bold text-amber-800 flex items-center justify-center gap-1.5">
                           <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                           Doctor Running ~30 Mins Late
                         </p>
                         {doctor.opdBeacon.message && (
                           <p className="text-[11px] text-amber-700 mt-0.5 font-medium">"{doctor.opdBeacon.message}"</p>
                         )}
                       </div>
                     )}
                     {doctor.opdBeacon.status === 'break' && (
                       <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 text-center">
                         <p className="text-xs font-bold text-blue-800 flex items-center justify-center gap-1.5">
                           <Coffee className="w-3.5 h-3.5 text-blue-600" />
                           Doctor on 15-Min Tea Break
                         </p>
                       </div>
                     )}
                     {doctor.opdBeacon.status === 'emergency' && (
                       <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                         <p className="text-xs font-bold text-rose-800 flex items-center justify-center gap-1.5">
                           <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                           Emergency Case / OT In Progress
                         </p>
                       </div>
                     )}
                     {doctor.opdBeacon.status === 'on_time' && (
                       <div className="bg-emerald-50 border border-emerald-200/60 rounded-xl p-2 text-center">
                         <p className="text-[11px] font-bold text-emerald-800 flex items-center justify-center gap-1">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                           Doctor OPD Running On-Time
                         </p>
                       </div>
                     )}
                   </div>
                 )}

                 {/* The Huge Token */}
                 <div className="text-center mt-8 mb-6">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Your Unique Token</p>
                    <div className="inline-block bg-[#F0FDF4] rounded-[1.5rem] px-8 py-4 border-2 border-[#BBF7D0] shadow-inner">
                      <p className="font-mono text-5xl font-black text-[#166534] tracking-widest drop-shadow-sm">
                        {appointment.token?.substring(0, 2)}<span className="opacity-20 mx-1">·</span>{appointment.token?.substring(2)}
                      </p>
                    </div>
                 </div>
                 
                 {/* Time & Slot Row */}
                 <div className="grid grid-cols-2 gap-4 mt-6 bg-[#F8FAFC] rounded-[1.25rem] p-4 border border-gray-100">
                    <div className="border-r border-gray-200 pr-4">
                      <p className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1.5"><Clock className="w-3.5 h-3.5"/> Valid For</p>
                      <p className="text-base font-black text-gray-900 font-mono tracking-tight text-[#166534]">{timeLeft}</p>
                    </div>
                    <div className="pl-2">
                      <p className="flex items-center gap-1.5 text-[11px] text-gray-500 font-bold uppercase tracking-widest mb-1.5"><Calendar className="w-3.5 h-3.5"/> Time Slot</p>
                      <p className="text-base font-bold text-gray-900">{appointment.approvedTimeSlot || 'Anytime today'}</p>
                    </div>
                 </div>
              </div>

              {/* Information Foot */}
              <div className="bg-gray-50 px-6 py-6 border-t border-gray-100">
                 <div className="flex gap-4 items-center mb-5 pb-5 border-b border-gray-200/60">
                   <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-xl shadow-sm text-emerald-700 font-bold">
                     👨‍⚕️
                   </div>
                   <div className="flex-1">
                     <p className="font-bold text-gray-900 text-lg leading-tight">Dr. {doctor?.name}</p>
                     <p className="text-sm font-medium text-gray-500 mt-0.5">{doctor?.specialty || 'Specialist'}</p>
                   </div>
                 </div>
                 
                 <div className="space-y-4">
                   <div className="flex gap-4 items-start">
                     <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                     <div>
                       <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Location</p>
                       <p className="font-bold text-gray-900 text-sm">{clinic?.clinicName || 'CLINIC NOT SPECIFIED'}</p>
                     </div>
                   </div>
                   
                   <div className="flex gap-4 items-start">
                     <Ticket className="w-5 h-5 text-gray-400 mt-0.5" />
                     <div>
                       <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Visitor</p>
                       <p className="font-bold text-gray-900 text-sm">{appointment.repSnapshot.name}</p>
                       <p className="text-xs font-semibold text-gray-500">{appointment.repSnapshot.company} · {appointment.repSnapshot.designation}</p>
                     </div>
                   </div>
                 </div>
              </div>
           </div>
           
           {/* Bottom Security Badges outside ticket */}
           <div className="mt-8 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-200/50 font-medium">
                 <ShieldCheck className="w-4 h-4" />
                 <span>Issued: {appointment.tokenIssuedAt ? format(appointment.tokenIssuedAt.toDate(), 'HH:mm (IST)') : '--:--'} (Server Time)</span>
              </div>
              <p className="text-[10px] text-emerald-200/30 uppercase tracking-widest font-mono">ID: {appointment.token}</p>
           </div>
           
           <div className="mt-auto pt-8 mx-auto w-full max-w-sm space-y-3">
              {appointment.status === 'in_cabin' && (
                <div className="bg-emerald-500 text-white font-black text-center py-3.5 px-6 rounded-[1.25rem] shadow-xl animate-bounce text-sm">
                  🎉 You are currently inside Doctor's Cabin!
                </div>
              )}

              <button
                onClick={sharePassOnWhatsApp}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold rounded-[1.25rem] shadow-lg transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Share2 className="w-4 h-4" />
                Share Pass via WhatsApp
              </button>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white py-4 px-6 rounded-[1.5rem] flex justify-center items-center gap-3 font-semibold text-sm">
                 <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                 Present this pass at reception
              </div>
           </div>
         </div>
       </div>
     )
  }

  if (status === 'pending') {
     return (
       <div className="min-h-screen bg-premium-50 flex flex-col p-6 font-sans selection:bg-amber-100">
          <div className="flex justify-start mb-4">
             <button onClick={() => navigate('/rep/home')} className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-[1rem] text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
                <ChevronLeft className="w-5 h-5" />
             </button>
          </div>
          <div className="flex-1 flex flex-col items-center pt-10 text-center max-w-sm mx-auto w-full">
             <div className="w-28 h-28 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] flex items-center justify-center mb-8 rotate-3 transition-transform hover:rotate-0">
               <div className="w-24 h-24 bg-amber-50 rounded-[1.5rem] flex items-center justify-center border border-amber-100/50">
                  <Clock className="w-12 h-12 text-amber-500" />
               </div>
             </div>
             
             <h1 className="text-[2rem] font-display font-black text-premium-900 mb-2 leading-tight tracking-tight">Under Review</h1>
             <p className="text-gray-500 font-bold mb-8 text-lg">Dr. {doctor?.name}</p>
             
             <div className="bg-white rounded-[2rem] p-7 w-full shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 text-left mb-8">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                   <Clock className="w-4 h-4 text-amber-500"/> Request Summary
                </p>
                <div className="space-y-4">
                   <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                     <p className="text-xs font-semibold text-gray-500">Submitted</p>
                     <p className="font-bold text-premium-900">{format(appointment.createdAt?.toDate() || new Date(), 'dd MMM, HH:mm')}</p>
                   </div>
                   <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                     <p className="text-xs font-semibold text-gray-500">Target Date</p>
                     <p className="font-bold text-premium-900">{format(appointment.preferredDate?.toDate() || new Date(), 'dd MMM yyyy')}</p>
                   </div>
                   <div>
                     <p className="text-xs font-semibold text-gray-500 mb-2">Visit Focus</p>
                     <p className="font-medium text-premium-900 text-[15px] bg-premium-100 p-3.5 rounded-[1rem] border border-gray-100 leading-snug">{appointment.productFocus}</p>
                   </div>
                </div>
             </div>
             
             <div className="bg-white shadow-sm p-5 rounded-[1.5rem] w-full border border-gray-100">
               <p className="text-premium-900 font-bold text-sm">Decision typically within 24 hours.</p>
               <p className="text-xs font-medium text-gray-500 mt-1">This page updates automatically.</p>
             </div>
          </div>
       </div>
     );
  }

  if (status === 'rejected') {
     const isWaAllowed = doctor?.privacy?.allowWhatsAppRedirect && doctor?.whatsappNumber;
     const waMessage = encodeURIComponent(`Hello Dr. ${doctor?.name}, I am ${appointment.repSnapshot.name} from ${appointment.repSnapshot.company} (${appointment.repSnapshot.designation}). My Gatepass request was not approved. I would like to discuss ${appointment.productFocus}. Could you spare a few minutes?`);

     return (
       <div className="min-h-screen bg-premium-50 flex flex-col p-6 font-sans">
          <div className="flex justify-start mb-4">
             <button onClick={() => navigate('/rep/home')} className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-[1rem] text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
                <ChevronLeft className="w-5 h-5" />
             </button>
          </div>
          <div className="flex-1 flex flex-col items-center pt-10 text-center max-w-sm mx-auto w-full">
             <div className="w-28 h-28 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] flex items-center justify-center mb-8">
               <div className="w-24 h-24 bg-red-50 rounded-[1.5rem] flex items-center justify-center border border-red-100/50">
                 <XCircle className="w-12 h-12 text-red-500" strokeWidth={2.5} />
               </div>
             </div>
             <h1 className="text-[2rem] font-display font-black text-premium-900 mb-2 leading-tight tracking-tight">Not Approved</h1>
             <p className="text-gray-500 font-bold mb-8 text-lg">Dr. {doctor?.name}</p>
             
             <div className="bg-white rounded-[2rem] p-7 w-full shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 mb-8 py-8">
                <p className="text-gray-600 font-medium text-[15px] leading-relaxed">This request was declined by the doctor, or the preferred slot was unavailable.</p>
             </div>
             
             <div className="w-full space-y-3 mt-auto">
               {isWaAllowed && (
                 <a 
                   href={`https://wa.me/91${doctor.whatsappNumber}?text=${waMessage}`}
                   target="_blank" rel="noreferrer"
                   className="w-full bg-[#25D366] text-white font-bold py-4 rounded-[1.25rem] shadow-sm hover:shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-[15px]"
                 >
                   Send WhatsApp <ExternalLink className="w-5 h-5" />
                 </a>
               )}
               <button 
                 onClick={() => navigate(`/appointment/new?doctorId=${appointment.doctorId}`)}
                 className="w-full bg-white border border-gray-200 text-premium-900 shadow-sm font-bold py-4 rounded-[1.25rem] transition-all hover:bg-premium-50 active:scale-[0.98] text-[15px]"
               >
                 Submit New Request
               </button>
             </div>
          </div>
       </div>
     );
  }

  if (status === 'completed') {
     return (
       <div className="min-h-screen bg-premium-50 flex flex-col p-6 font-sans">
          <div className="flex justify-start mb-4">
             <button onClick={() => navigate('/rep/home')} className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-[1rem] text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
                <ChevronLeft className="w-5 h-5" />
             </button>
          </div>
          <div className="flex-1 flex flex-col items-center pt-16 text-center max-w-sm mx-auto w-full">
             <div className="w-28 h-28 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] flex items-center justify-center mb-8">
               <div className="w-24 h-24 bg-blue-50 rounded-[1.5rem] flex items-center justify-center border border-blue-100/50">
                 <CheckCircle2 className="w-12 h-12 text-blue-600" />
               </div>
             </div>
             <h1 className="text-[2rem] font-display font-black text-premium-900 mb-2 leading-tight tracking-tight">Visit Completed</h1>
             <p className="text-gray-500 font-bold mb-6 text-lg">Dr. {doctor?.name}</p>
             
             <div className="bg-white rounded-[2rem] p-6 w-full shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-gray-100 mb-8 text-left space-y-3 text-sm">
                <div className="flex justify-between items-center text-gray-600 border-b border-gray-50 pb-2">
                   <span className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Representative</span>
                   <span className="font-bold text-premium-900">{appointment.repSnapshot?.name}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 border-b border-gray-50 pb-2">
                   <span className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Product Focus</span>
                   <span className="font-bold text-premium-900">{appointment.productFocus}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600">
                   <span className="font-semibold text-gray-400 text-xs uppercase tracking-wider">Status</span>
                   <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full text-xs">Completed</span>
                </div>
             </div>

             <button 
               onClick={() => navigate('/rep/home')}
               className="w-full bg-premium-900 text-white font-bold py-4 rounded-[1.25rem] shadow-[0_4px_14px_rgba(15,23,42,0.2)] hover:bg-black transition-all active:scale-[0.98] mt-auto text-[15px]"
             >
               Return to Dashboard
             </button>
          </div>
       </div>
     );
  }

  if (status === 'expired') {
     return (
       <div className="min-h-screen bg-premium-50 flex flex-col p-6 font-sans">
          <div className="flex justify-start mb-4">
             <button onClick={() => navigate('/rep/home')} className="p-2.5 bg-white shadow-sm border border-gray-100 rounded-[1rem] text-gray-700 hover:bg-gray-50 active:scale-95 transition-all">
                <ChevronLeft className="w-5 h-5" />
             </button>
          </div>
          <div className="flex-1 flex flex-col items-center pt-20 text-center max-w-sm mx-auto w-full">
             <div className="w-28 h-28 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] flex items-center justify-center mb-8 grayscale opacity-70">
               <div className="text-5xl">⏳</div>
             </div>
             <h1 className="text-[2rem] font-display font-black text-premium-900 mb-4 leading-tight tracking-tight">Token Expired</h1>
             <p className="text-gray-500 font-medium text-[15px] leading-relaxed mb-8">This Gatepass was valid on {appointment.approvedDate ? format(appointment.approvedDate.toDate(), 'dd MMM yyyy') : 'an older date'} and can no longer be used for entry.</p>
             
             <button 
               onClick={() => navigate(`/appointment/new?doctorId=${appointment.doctorId}`)}
               className="w-full bg-premium-900 text-white font-bold py-4 rounded-[1.25rem] shadow-[0_4px_14px_rgba(15,23,42,0.2)] hover:bg-black transition-all active:scale-[0.98] mt-auto text-[15px]"
             >
               Start New Request
             </button>
          </div>
       </div>
     );
  }

  return null;
}
