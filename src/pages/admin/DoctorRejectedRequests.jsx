import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function DoctorRejectedRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', user.uid),
      where('status', '==', 'rejected'),
    );

    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()));
      setLoading(false);
    }, error => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  if (loading) return <div className="text-gray-500 font-medium font-sans flex items-center justify-center p-8">Loading rejected requests...</div>;

  return (
    <div className="pb-10 font-sans">
       <div className="mb-8">
         <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">Rejected Requests</h1>
         <p className="text-gray-500 font-medium mt-2">Appointments that were denied.</p>
       </div>

       {requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400 font-medium bg-white rounded-[1.5rem] border border-gray-100 border-dashed text-[15px]">
            No rejected requests.
          </div>
       ) : (
          <div className="space-y-4">
             {requests.map(req => (
                <div key={req.id} className="bg-white rounded-[1.25rem] p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 flex justify-between items-start gap-4 opacity-70 hover:opacity-100 transition-opacity">
                   <div className="flex-1">
                     <h3 className="font-bold text-premium-900 text-[16px] line-clamp-1">{req.repSnapshot?.name || 'Rep Name'}</h3>
                     <p className="font-medium text-gray-500 text-[13px] mt-1">{req.repSnapshot?.company} • {req.repSnapshot?.designation}</p>
                     <p className="font-medium text-[13px] text-gray-500 mt-3 truncate">Focus: {req.productFocus}</p>
                   </div>
                   <div className="bg-red-50 text-red-600 p-2.5 rounded-[1rem] flex items-center justify-center">
                     <XCircle className="w-6 h-6" />
                   </div>
                </div>
             ))}
          </div>
       )}
    </div>
  );
}
