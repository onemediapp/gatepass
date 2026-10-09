import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, writeBatch, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { getMidnightIST } from '../../utils/dateUtils';
import { Check, X, Star, Slash, XCircle, Search, Calendar, MapPin, ChevronDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const makeToken = () => 'RM' + Math.floor(1000 + Math.random() * 9000);

export default function DoctorPendingRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [approveModalReq, setApproveModalReq] = useState(null);
  const [approveForm, setApproveForm] = useState({ date: '', timeSlot: '12:00 PM - 2:00 PM', notes: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', user.uid),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, error => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const formatTime12 = (t24) => {
    if (!t24) return '';
    const [hStr, mStr] = t24.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
  };

  const handleApproveClick = (req) => {
     setApproveForm({
        date: req.preferredDate ? format(req.preferredDate.toDate(), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
        timeSlot: '12:00 PM - 2:00 PM',
        notes: ''
     });
     setApproveModalReq(req);
  };

  const confirmApprove = async () => {
     setIsProcessing(true);
     try {
        const batch = writeBatch(db);
        const tokenStr = makeToken();
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
       const batch = writeBatch(db);
       batch.update(doc(db, 'appointments', reqId), {
          status: 'rejected',
          approvedAt: serverTimestamp()
       });
       await batch.commit();
     } catch (error) {
       handleFirestoreError(error, OperationType.UPDATE, `appointments/${reqId}`);
     }
  };

  const markPreferred = async (repId) => {
     try {
        const dRef = doc(db, 'doctors', user.uid);
        const snap = await getDoc(dRef);
        const arr = snap.data()?.preferredRepIds || [];
        if (!arr.includes(repId)) {
           const batch = writeBatch(db);
           batch.update(dRef, { preferredRepIds: [...arr, repId] });
           await batch.commit();
           alert('Marked as Preferred rep');
        }
     } catch(e) {}
  };

  if (loading) return <div className="text-gray-400 font-medium font-sans flex items-center justify-center p-8 animate-pulse">Loading requests...</div>;

  return (
    <div className="pb-10 font-sans selection:bg-emerald-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="mb-10">
         <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">Pending Requests</h1>
         <p className="text-gray-500 font-medium mt-1">{requests.length} request{requests.length !== 1 ? 's' : ''} waiting for your decision</p>
       </div>

       {requests.length === 0 ? (
         <div className="bg-white/60 backdrop-blur-xl border border-gray-200/50 shadow-sm rounded-[2rem] py-16 px-6 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-[1.5rem] flex items-center justify-center text-emerald-500 mx-auto mb-6 border border-emerald-100/50 shadow-sm rotate-3 hover:rotate-0 transition-transform duration-500 ease-out">
              <Check className="w-10 h-10 drop-shadow-sm opacity-80" />
            </div>
            <h3 className="font-display font-bold text-premium-900 text-xl tracking-tight">All Caught Up</h3>
            <p className="text-gray-500 mt-2 font-medium max-w-sm mx-auto">You have no pending appointment requests at this time.</p>
         </div>
       ) : (
         <div className="space-y-6">
            {requests.map(req => (
              <div key={req.id} className="bg-white rounded-[1.5rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 overflow-hidden relative group transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:border-gray-200">
                 <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-emerald-400 to-indigo-500"></div>
                 
                 <div className="p-6 pl-8">
                   <div className="flex justify-between items-start mb-5">
                     <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-premium-50 border border-gray-100 rounded-[1rem] font-display font-bold text-emerald-600 flex items-center justify-center flex-shrink-0 text-xl shadow-sm">
                           {req.repSnapshot?.name?.[0]}
                        </div>
                        <div>
                           <h3 className="font-bold text-premium-900 text-[16px] leading-tight flex items-center gap-2 mb-1 tracking-tight">
                             {req.repSnapshot?.name}
                             {req.repSnapshot?.designation && <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-[0.5rem] bg-premium-100 text-gray-500">{req.repSnapshot.designation}</span>}
                           </h3>
                           <p className="text-sm font-medium text-gray-500">{req.repSnapshot?.company}</p>
                        </div>
                     </div>
                     <div className="flex flex-col items-end text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-premium-50 px-2.5 py-1 rounded-md border border-gray-100">
                        <span>{format(req.createdAt?.toDate() || new Date(), 'HH:mm')}</span>
                     </div>
                   </div>

                   <div className="bg-premium-50/50 rounded-[1rem] p-5 mb-5 space-y-3.5 text-sm border border-gray-100/50">
                     <div className="flex gap-3 text-gray-700 items-start">
                       <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px] w-14 flex-shrink-0 mt-0.5">Focus</span> 
                       <span className="font-semibold text-premium-900">{req.productFocus}</span>
                     </div>
                     {req.message && (
                       <div className="flex gap-3 text-gray-700 items-start">
                         <span className="font-bold text-gray-400 uppercase tracking-widest text-[10px] w-14 flex-shrink-0 mt-0.5">Note</span> 
                         <span className="font-medium text-gray-600 italic">"{req.message}"</span>
                       </div>
                     )}
                     <div className="flex gap-2 items-center flex-wrap pt-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-md shadow-sm">{req.therapeuticCategory}</span>
                        {req.samplesFlag && <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md shadow-sm">Samples</span>}
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-md flex items-center gap-1.5 shadow-sm"><Calendar className="w-3 h-3 opacity-70"/> {format(req.preferredDate?.toDate() || new Date(), 'dd MMM')}</span>
                     </div>
                   </div>

                   <div className="flex gap-3 items-center justify-between mt-2 pt-2 border-t border-transparent">
                     <div className="flex gap-2">
                        <button onClick={() => markPreferred(req.repId)} className="w-10 h-10 rounded-[0.75rem] bg-white border border-gray-200 text-gray-400 hover:text-amber-500 hover:bg-amber-50 hover:border-amber-200 flex items-center justify-center transition-all active:scale-95 shadow-sm" title="Mark Preferred">
                          <Star className="w-4 h-4 fill-current opacity-20" />
                        </button>
                        <button className="w-10 h-10 rounded-[0.75rem] bg-white border border-gray-200 text-gray-400 hover:text-red-500 hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition-all active:scale-95 shadow-sm" title="Block">
                          <Slash className="w-4 h-4" />
                        </button>
                     </div>
                     <div className="flex gap-2.5">
                        <button 
                          onClick={() => confirmReject(req.id)}
                          className="px-5 py-2 font-semibold text-gray-500 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 rounded-[1rem] transition-all active:scale-95 shadow-sm text-sm"
                        >
                          Decline
                        </button>
                        <button 
                          onClick={() => handleApproveClick(req)}
                          className="px-6 py-2 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-[1rem] shadow-[0_4px_14px_rgba(5,150,105,0.3)] transition-all active:scale-[0.98] text-sm"
                        >
                          Approve
                        </button>
                     </div>
                   </div>
                 </div>
              </div>
            ))}
         </div>
       )}

       {/* Approve Bottom Sheet / Modal */}
       {approveModalReq && (
          <div className="fixed inset-0 bg-premium-900/60 z-[100] flex items-end sm:items-center justify-center p-4 backdrop-blur-md transition-all duration-500">
             <div className="bg-white w-full max-w-md rounded-[2rem] p-7 shadow-[0_20px_60px_rgba(0,0,0,0.2)] animate-in slide-in-from-bottom-8 duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]">
                <div className="flex justify-between items-center mb-7">
                   <h2 className="text-2xl font-display font-bold text-premium-900 tracking-tight">Approve Gatepass</h2>
                   <button onClick={() => setApproveModalReq(null)} className="p-2 bg-premium-50 hover:bg-gray-200 rounded-[0.75rem] text-gray-500 transition-colors active:scale-95 border border-gray-100"><X className="w-4 h-4"/></button>
                </div>
                
                <div className="space-y-5 mb-8">
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Confirmed Date</label>
                      <input 
                         type="date"
                         value={approveForm.date}
                         onChange={e => setApproveForm({...approveForm, date: e.target.value})}
                         className="w-full border border-gray-200 rounded-[1rem] px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-premium-50 shadow-inner text-premium-900 transition-all text-sm"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Time Slot</label>
                      <div className="relative">
                        <select 
                           value={approveForm.timeSlot}
                           onChange={e => setApproveForm({...approveForm, timeSlot: e.target.value})}
                           className="w-full border border-gray-200 rounded-[1rem] pl-4 pr-10 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-premium-50 shadow-inner text-premium-900 appearance-none transition-all text-sm"
                        >
                           <option>8:00 AM - 10:00 AM</option>
                           <option>10:00 AM - 12:00 PM</option>
                           <option>12:00 PM - 2:00 PM</option>
                           <option>2:00 PM - 4:00 PM</option>
                           <option>4:00 PM - 6:00 PM</option>
                        </select>
                        <ChevronDown className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 flex justify-between">
                        <span>Internal Notes</span>
                        <span className="text-gray-300">Optional</span>
                      </label>
                      <input 
                         type="text"
                         value={approveForm.notes}
                         onChange={e => setApproveForm({...approveForm, notes: e.target.value})}
                         placeholder="e.g. Discuss only new diabetes drug"
                         className="w-full border border-gray-200 rounded-[1rem] px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium bg-premium-50 shadow-inner placeholder:text-gray-400 text-premium-900 transition-all text-sm"
                      />
                   </div>
                </div>

                <button 
                  onClick={confirmApprove}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-[1.25rem] shadow-[0_4px_14px_rgba(5,150,105,0.3)] transition-all active:scale-[0.98] disabled:opacity-50 text-[15px]"
                >
                  {isProcessing ? 'Generating Token...' : 'Confirm & Generate Gatepass'}
                </button>
             </div>
          </div>
       )}
    </div>
  );
}
