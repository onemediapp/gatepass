import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { Check, Calendar, ChevronLeft, MapPin, Copy, ExternalLink, Package } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { cn } from '../../lib/utils';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';

export default function AppointmentRequest() {
  const [searchParams] = useSearchParams();
  const doctorId = searchParams.get('doctorId');
  const clinicIdParams = searchParams.get('clinicId');
  
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  
  const [doctor, setDoctor] = useState(null);
  const [repInfo, setRepInfo] = useState(null);
  const [clinics, setClinics] = useState([]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [generatedId, setGeneratedId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Form State
  const [form, setForm] = useState({
    clinicId: clinicIdParams || '',
    productFocus: '',
    message: '',
    preferredDate: addDays(new Date(), 1).toISOString().split('T')[0], // Tomorrow
    samplesFlag: false,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!doctorId || !user) return;
      setLoading(true);
      try {
        const dSnap = await getDoc(doc(db, 'doctors', doctorId));
        const uSnap = await getDoc(doc(db, 'users', doctorId));
        if (dSnap.exists()) {
           const dData = dSnap.data();
           const uData = uSnap.exists() ? uSnap.data() : {};
           setDoctor({ ...dData, name: uData.name || 'Doctor', privacy: dData.privacy || { showFullName: true } });
           
           if (dData.clinicIds?.length > 0) {
             const cData = [];
             for (const cid of dData.clinicIds) {
                const cDoc = await getDoc(doc(db, 'clinics', cid));
                if (cDoc.exists()) cData.push({ id: cDoc.id, ...cDoc.data() });
             }
             setClinics(cData);
             if (!form.clinicId && cData.length > 0) {
                setForm(prev => ({ ...prev, clinicId: cData[0].id }));
             }
           }
        }
        
        const rSnap = await getDoc(doc(db, 'reps', user.uid));
        if (rSnap.exists()) {
           const rData = rSnap.data();
           setRepInfo(rData);
           setForm(prev => ({ ...prev, samplesFlag: rData.samplesAvailable }));
        } else {
           setRepInfo({ companyName: 'Unknown', designation: 'Rep', therapeuticCategory: 'General' });
        }

      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'multiple');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [doctorId, user]);

  const handleSubmit = async () => {
    if (!form.productFocus || !form.preferredDate) return;
    setIsSubmitting(true);
    
    try {
      const repSnapshot = {
         name: userData.name,
         company: repInfo.companyName,
         designation: repInfo.designation,
         mobile: userData.mobile,
         therapeuticCategory: repInfo.therapeuticCategory
      };

      const appointmentData = {
         doctorId: doctorId,
         clinicId: form.clinicId || '',
         repId: user.uid,
         repSnapshot,
         productFocus: form.productFocus,
         therapeuticCategory: repInfo.therapeuticCategory,
         message: form.message || null,
         samplesFlag: form.samplesFlag,
         preferredDate: new Date(form.preferredDate),
         status: 'pending',
         token: null,
         approvedDate: null,
         approvedTimeSlot: null,
         approvedEndTime: null,
         tokenIssuedAt: null,
         tokenExpiresAt: null,
         doctorNotes: null,
         createdAt: serverTimestamp(),
         approvedAt: null,
         billingStatus: 'pending_charge'
      };

      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
      setGeneratedId(docRef.id);
      setIsSuccess(true);
      
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyLink = () => {
     navigator.clipboard.writeText(`${window.location.origin}/status/${generatedId}`);
     setCopiedLink(true);
     setTimeout(() => setCopiedLink(false), 2000);
  };

  if (loading) return <div className="min-h-screen bg-premium-50 flex items-center justify-center font-sans font-medium text-gray-500">Loading...</div>;
  if (!doctor || !repInfo) return <div className="min-h-screen bg-premium-50 flex items-center justify-center font-sans font-medium text-gray-500">Doctor or Rep information not found.</div>;

  if (isSuccess) {
     return (
       <div className="min-h-screen bg-emerald-600 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700 font-sans">
          {/* Confetti-like background abstraction */}
          <div className="absolute inset-0 overflow-hidden mix-blend-overlay opacity-30 pointer-events-none">
             <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white rounded-full blur-3xl"></div>
             <div className="absolute top-1/2 right-1/4 w-40 h-40 bg-white rounded-full blur-3xl"></div>
          </div>
          
          <div className="relative z-10 w-28 h-28 bg-white rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl animate-in zoom-in-50 duration-500 delay-150">
             <Check className="w-14 h-14 text-emerald-600 animate-in zoom-in duration-500 delay-300" strokeWidth={3.5} />
          </div>
          
          <h1 className="text-white text-4xl font-display font-black mb-3 tracking-tight">Request Sent!</h1>
          <p className="text-emerald-50 text-lg mb-10 font-bold tracking-wide">Ref: GP-{generatedId.substring(0,6).toUpperCase()}</p>
          
          <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] p-6 w-full max-w-sm border border-white/20 mb-10 shadow-[0_8px_32px_rgba(0,0,0,0.1)]">
             <p className="text-white/90 font-medium mb-3">Your tracking link</p>
             <div className="flex bg-black/20 rounded-[1.25rem] p-1.5 backdrop-blur-lg border border-white/10">
               <div className="bg-transparent text-white truncate px-3 py-2 flex-1 text-sm font-medium pt-2.5">
                  {window.location.host}/status/{generatedId.substring(0,8)}...
               </div>
               <button onClick={copyLink} className="bg-white text-emerald-600 p-2.5 rounded-xl ml-2 shadow-sm font-bold flex items-center gap-2 focus:outline-none active:scale-95 transition-all text-[14px]">
                  <Copy className="w-4 h-4" /> {copiedLink ? 'Copied!' : 'Copy'}
               </button>
             </div>
          </div>
          
          <button 
             onClick={() => navigate(`/status/${generatedId}`)}
             className="w-full max-w-sm bg-white text-emerald-700 font-bold py-4 rounded-[1.5rem] shadow-xl hover:shadow-2xl active:scale-[0.98] transition-all flex justify-center items-center gap-2 mb-6 text-[15px]"
          >
             Track Progress <ExternalLink className="w-5 h-5" />
          </button>
          
          <button onClick={() => navigate('/rep/home')} className="text-white/80 font-bold hover:text-white transition-colors py-2 px-4 rounded-full hover:bg-white/10 active:scale-95 text-[14px]">
             Return to Home
          </button>
       </div>
     );
  }

  const minDate = addDays(new Date(), 1).toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-premium-50 flex flex-col font-sans selection:bg-emerald-100">
       <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-30 px-5 pt-safe-4 py-4 flex items-center justify-between shadow-[0_4px_40px_rgb(0,0,0,0.03)]">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-[1rem] hover:bg-gray-50 transition-colors active:scale-95 text-gray-700">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex-1 text-center pr-6">
            <h1 className="font-display font-black text-premium-900 text-[18px] tracking-tight">Request Visit</h1>
            <p className="text-[13px] text-gray-500 font-medium truncate px-2">{doctor.privacy?.showFullName ? `Dr. ${doctor.name}` : 'Doctor'}</p>
          </div>
       </div>

       <div className="flex-1 px-5 pt-6 w-full max-w-md mx-auto space-y-8 pb-32">
         {/* Read-Only Info */}
         <div className="bg-premium-900 p-6 rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.08)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-[40px]"></div>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-4">Sharing Profile Info</p>
            <div className="space-y-3 relative z-10">
               <div className="flex gap-3 text-[14px] items-center"><span className="text-white/50 w-16 font-medium">From</span> <span className="font-bold text-white tracking-wide">{repInfo.companyName}</span></div>
               <div className="flex gap-3 text-[14px] items-center"><span className="text-white/50 w-16 font-medium">As</span> <span className="font-medium text-white">{repInfo.designation}</span></div>
               <div className="flex gap-3 text-[14px] items-center"><span className="text-white/50 w-16 font-medium">Focus</span> <span className="font-bold text-premium-900 bg-white px-2.5 py-1 rounded-[0.5rem] text-[11px] uppercase tracking-widest">{repInfo.therapeuticCategory}</span></div>
            </div>
         </div>

         {/* Editable Fields */}
         <div className="space-y-6">
            {clinics.length > 0 && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                  <MapPin className="w-3.5 h-3.5 text-gray-400"/> Clinic Location
                </label>
                <div className="relative">
                  <select 
                    className="w-full border border-gray-200 rounded-[1rem] pl-4 pr-10 py-3.5 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none text-premium-900 font-medium shadow-sm appearance-none transition-all text-[15px]"
                    value={form.clinicId}
                    onChange={(e) => setForm({...form, clinicId: e.target.value})}
                  >
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.clinicName}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1">Product Focus *</label>
              <textarea 
                className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[100px] resize-none font-medium placeholder:text-gray-400 shadow-sm transition-all text-[15px] text-premium-900"
                placeholder="Which specific products do you want to discuss?"
                value={form.productFocus}
                onChange={(e) => setForm({...form, productFocus: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 px-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400"/> Preferred Date *
              </label>
              <input 
                 type="date"
                 min={minDate}
                 className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none font-medium text-premium-900 shadow-sm transition-all text-[15px]"
                 value={form.preferredDate}
                 onChange={(e) => setForm({...form, preferredDate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest px-1 flex justify-between">
                <span>Notes to Doctor</span>
                <span className="text-gray-300 font-medium">(Opt)</span>
              </label>
              <textarea 
                className="w-full border border-gray-200 rounded-[1rem] px-5 py-4 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none min-h-[80px] resize-none font-medium placeholder:text-gray-400 shadow-sm transition-all text-[15px] text-premium-900"
                placeholder="Any specific context for this visit..."
                value={form.message}
                onChange={(e) => setForm({...form, message: e.target.value})}
              />
            </div>

            <div className="bg-white p-5 rounded-[1.25rem] border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] mt-4">
               <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-premium-50 rounded-[0.75rem] flex items-center justify-center border border-gray-100">
                    <Package className="w-5 h-5 text-premium-900" />
                 </div>
                 <div className="flex-1">
                   <ToggleSwitch 
                      label="Providing Samples"
                      description="I have samples for this visit"
                      checked={form.samplesFlag}
                      onChange={(val) => setForm({...form, samplesFlag: val})}
                   />
                 </div>
               </div>
            </div>
         </div>
       </div>

       <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 backdrop-blur-2xl border-t border-gray-100 z-30 pb-safe-4 shadow-[0_-4px_40px_rgba(0,0,0,0.03)]">
          <div className="max-w-md mx-auto">
             <button
               onClick={handleSubmit}
               disabled={isSubmitting || !form.productFocus}
               className="w-full bg-premium-900 text-white font-bold py-4 rounded-[1.25rem] shadow-[0_4px_14px_rgba(15,23,42,0.2)] hover:bg-black transition-all disabled:opacity-30 disabled:active:scale-100 active:scale-[0.98] flex items-center justify-center gap-2 text-[15px]"
             >
               {isSubmitting ? 'Sending Request...' : 'Send Request'}
             </button>
          </div>
       </div>
    </div>
  );
}
