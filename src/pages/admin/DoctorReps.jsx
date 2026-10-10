import { useState, useEffect } from 'react';
import { subscribeDoctorAppointments } from '../../lib/db/appointments';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { Search, Star, Slash } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function DoctorReps() {
  const { user, userData } = useAuth();
  const [reps, setReps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeDoctorAppointments(user.uid, (appointments) => {
      const repMap = new Map();
      appointments.forEach((data) => {
        if (!['approved', 'expired', 'completed'].includes(data.status)) return;
        if (!repMap.has(data.repId)) {
          repMap.set(data.repId, {
            id: data.repId,
            snapshot: data.repSnapshot,
            visits: 1,
            lastVisit: data.slotDate || data.approvedDate
          });
        } else {
          const existing = repMap.get(data.repId);
          existing.visits += 1;
        }
      });
      setReps(Array.from(repMap.values()));
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div className="text-gray-500 font-medium font-sans flex items-center gap-2 p-4">Loading network...</div>;

  return (
    <div className="pb-10 font-sans">
       <div className="mb-8">
         <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">Your Rep Network</h1>
         <p className="text-gray-500 font-medium mt-2">{reps.length} rep{reps.length !== 1 ? 's' : ''} connected</p>
       </div>

       <div className="bg-white rounded-[1.25rem] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 p-4 mb-8 flex items-center gap-3 transition-colors focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
          <Search className="w-5 h-5 text-gray-400 ml-1" />
          <input type="text" placeholder="Search by name or company..." className="flex-1 bg-transparent border-none outline-none font-medium placeholder:text-gray-400 text-premium-900 text-sm" />
       </div>

       {reps.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-medium bg-white rounded-[1.5rem] border border-gray-100 border-dashed text-sm">No representatives in your network yet.</div>
       ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
             {reps.map(rep => (
               <div key={rep.id} className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col group hover:shadow-[0_8px_30px_rgb(0,0,0,0.05)] transition-all">
                  <div className="flex gap-4 items-start mb-5">
                     <div className="w-14 h-14 rounded-[1rem] bg-premium-100 text-premium-900 flex items-center justify-center font-bold text-xl flex-shrink-0 shadow-sm font-display">
                       {rep.snapshot?.name?.[0]}
                     </div>
                     <div className="flex-1 min-w-0 pt-0.5">
                        <h3 className="font-bold text-premium-900 truncate text-base leading-tight mb-1">{rep.snapshot?.name}</h3>
                        <p className="font-medium text-gray-500 text-xs truncate">{rep.snapshot?.company}</p>
                     </div>
                  </div>
                  
                  <div className="mb-6 flex flex-wrap items-center gap-2">
                     <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1.5 bg-gray-50 text-gray-600 rounded-[0.5rem] border border-gray-100">
                       {rep.snapshot?.designation}
                     </span>
                     <span className="text-xs font-bold uppercase tracking-widest px-2.5 py-1.5 bg-emerald-50 text-emerald-700 rounded-[0.5rem] border border-emerald-100">
                       {rep.snapshot?.therapeuticCategory}
                     </span>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-100 flex justify-between items-center">
                     <div className="flex flex-col">
                       <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Total Visits</span>
                       <span className="font-black text-premium-900 text-lg leading-none">{rep.visits}</span>
                     </div>
                     
                     <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-[0.75rem] bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-amber-500 hover:border-amber-200 hover:bg-amber-50 transition-all active:scale-95 shadow-sm"><Star className="w-4 h-4"/></button>
                        <button className="w-10 h-10 rounded-[0.75rem] bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all active:scale-95 shadow-sm"><Slash className="w-4 h-4"/></button>
                     </div>
                  </div>
               </div>
             ))}
          </div>
       )}
    </div>
  );
}
