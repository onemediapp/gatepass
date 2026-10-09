import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { Clock, Calendar, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RepBottomNav } from '../../components/layout/RepBottomNav';

export default function RepHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'appointments'),
          where('repId', '==', user.uid),
          // orderBy('createdAt', 'desc') // requires composite index usually, skipping for MVP unless needed
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setHistory(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadHistory();
  }, [user]);

  if (loading) return <div className="text-gray-400 font-medium p-4 font-sans text-center animate-pulse mt-10">Loading history...</div>;

  return (
    <div className="pb-24 font-sans max-w-2xl mx-auto p-4 sm:p-6 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
       <div className="mb-10">
         <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">Your History</h1>
         <p className="text-gray-500 font-medium mt-1">Past and upcoming appointments.</p>
       </div>

       {history.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-medium bg-white/60 backdrop-blur-xl rounded-[2rem] border border-gray-200/50 shadow-sm">
            No history yet.
          </div>
       ) : (
          <div className="space-y-4">
             {history.map(item => (
                <Link to={`/status/${item.id}`} key={item.id} className="block w-full text-left bg-white rounded-[1.5rem] p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:border-gray-200 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/20 group">
                  <div className="flex justify-between items-start mb-2">
                     <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest rounded-[0.5rem] ${
                        item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' :
                        item.status === 'rejected' ? 'bg-red-50 text-red-700 border border-red-200/60' :
                        'bg-amber-50 text-amber-700 border border-amber-200/60'
                     }`}>
                       {item.status}
                     </span>
                     <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1.5 bg-premium-50 px-2.5 py-1 rounded-md border border-gray-100">
                       <Calendar className="w-3 h-3" />
                       {item.preferredDate ? new Date(item.preferredDate.toMillis()).toLocaleDateString() : 'N/A'}
                     </span>
                  </div>
                  <h3 className="font-bold text-premium-900 mt-3 truncate text-[17px] group-hover:text-emerald-600 transition-colors">{item.doctorName || 'Doctor'}</h3>
                  <p className="text-sm font-medium text-gray-500 truncate mt-0.5">{item.clinicName || 'Clinic'}</p>
                </Link>
             ))}
          </div>
       )}
       <RepBottomNav />
    </div>
  );
}
