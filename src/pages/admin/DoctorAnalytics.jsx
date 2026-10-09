import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { BarChart3, Users, CheckCircle, Clock } from 'lucide-react';

export default function DoctorAnalytics() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalApproved: 0, pending: 0, uniqueReps: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
       if (!user) return;
       try {
         const q = query(collection(db, 'appointments'), where('doctorId', '==', user.uid));
         const snap = await getDocs(q);
         
         let approved = 0;
         let pending = 0;
         const reps = new Set();
         
         snap.docs.forEach(doc => {
            const data = doc.data();
            if (data.status === 'approved') approved++;
            if (data.status === 'pending') pending++;
            if (data.repId) reps.add(data.repId);
         });
         
         setStats({
            totalApproved: approved,
            pending,
            uniqueReps: reps.size
         });
       } catch (e) {
         console.error(e);
       } finally {
         setLoading(false);
       }
    }
    loadStats();
  }, [user]);

  if (loading) return <div className="text-gray-500 font-medium font-sans flex items-center justify-center p-8">Loading analytics...</div>;

  return (
    <div className="pb-10 font-sans">
       <div className="mb-8">
         <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">Analytics</h1>
         <p className="text-gray-500 font-medium mt-2">Overview of your clinic activity.</p>
       </div>

       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between">
             <div className="w-12 h-12 bg-premium-100 text-premium-900 rounded-[1rem] flex items-center justify-center mb-6">
                <CheckCircle className="w-6 h-6" />
             </div>
             <p className="text-4xl font-display font-black text-premium-900">{stats.totalApproved}</p>
             <p className="font-bold text-gray-400 mt-2 uppercase text-[11px] tracking-widest">Total Approved</p>
          </div>
          
          <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between">
             <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-[1rem] flex items-center justify-center mb-6">
                <Clock className="w-6 h-6" />
             </div>
             <p className="text-4xl font-display font-black text-premium-900">{stats.pending}</p>
             <p className="font-bold text-gray-400 mt-2 uppercase text-[11px] tracking-widest">Pending Requests</p>
          </div>
          
          <div className="bg-white rounded-[1.5rem] p-6 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-gray-100 flex flex-col justify-between">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-[1rem] flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
             </div>
             <p className="text-4xl font-display font-black text-premium-900">{stats.uniqueReps}</p>
             <p className="font-bold text-gray-400 mt-2 uppercase text-[11px] tracking-widest">Unique MRs Engaged</p>
          </div>
       </div>
    </div>
  );
}
