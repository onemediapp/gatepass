import { useState, useEffect } from 'react';
import { subscribeDoctorAppointments, updateAppointment } from '../../lib/db/appointments';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { CheckCircle2, Clock, UserCheck, Filter, Archive } from 'lucide-react';
import { format } from 'date-fns';

function isPastSlot(app) {
  if (app.status === 'archived') return true;
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  if (app.slotDate) return app.slotDate < todayStr;
  if (app.approvedDate?.toDate) {
    return format(app.approvedDate.toDate(), 'yyyy-MM-dd') < todayStr;
  }
  return false;
}

export default function DoctorApprovedRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subFilter, setSubFilter] = useState('all'); // 'all', 'confirmed', 'completed', 'archived'

  useEffect(() => {
    if (!user) return;

    const unsub = subscribeDoctorAppointments(user.uid, (allAppointments) => {
      const allowed = ['approved', 'confirmed', 'completed', 'archived'];
      const docs = allAppointments.filter(a => allowed.includes(a.status));
      docs.sort((a,b) => (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0) - (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0));
      setRequests(docs);
      setLoading(false);
    });

    return () => unsub();
  }, [user]);

  const markCompleted = async (reqId) => {
    try {
      await updateAppointment(reqId, {
        status: 'completed'
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${reqId}`);
    }
  };

  const filteredRequests = requests.filter(req => {
    const isPast = isPastSlot(req);
    if (subFilter === 'confirmed') return (req.status === 'approved' || req.status === 'confirmed') && !isPast;
    if (subFilter === 'completed') return req.status === 'completed' && !isPast;
    if (subFilter === 'past') return isPast;
    if (subFilter === 'all') return !isPast;
    return true;
  });

  if (loading) return <div className="text-gray-400 font-medium font-sans flex items-center justify-center p-8 animate-pulse">Loading approved visits...</div>;

  return (
    <div className="pb-10 font-sans animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black text-premium-900 tracking-tight leading-tight">Approved & Completed Visits</h1>
          <p className="text-gray-500 font-medium mt-1">Appointments with active or completed Gatepasses.</p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200/80 shadow-2xs self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setSubFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subFilter === 'all' ? 'bg-premium-900 text-white shadow-2xs' : 'text-gray-500 hover:text-premium-900'
            }`}
          >
            All ({requests.filter(r => !isPastSlot(r)).length})
          </button>
          <button
            onClick={() => setSubFilter('confirmed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subFilter === 'confirmed' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-gray-500 hover:text-emerald-700'
            }`}
          >
            Confirmed ({requests.filter(r => (r.status === 'approved' || r.status === 'confirmed') && !isPastSlot(r)).length})
          </button>
          <button
            onClick={() => setSubFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subFilter === 'completed' ? 'bg-blue-600 text-white shadow-2xs' : 'text-gray-500 hover:text-blue-700'
            }`}
          >
            Completed ({requests.filter(r => r.status === 'completed' && !isPastSlot(r)).length})
          </button>
          <button
            onClick={() => setSubFilter('past')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subFilter === 'past' ? 'bg-purple-700 text-white shadow-2xs' : 'text-purple-700 hover:bg-purple-50'
            }`}
          >
            Past ({requests.filter(r => isPastSlot(r)).length})
          </button>
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="text-center py-16 text-gray-400 font-medium bg-white/60 backdrop-blur-xl rounded-[2rem] border border-gray-200/50 shadow-sm">
          No matching requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => {
            const isPast = isPastSlot(req);
            const isCompleted = req.status === 'completed' && !isPast;

            return (
              <div key={req.id} className="bg-white rounded-[1.5rem] p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-gray-100 items-start flex flex-col sm:flex-row justify-between gap-4 transition-all hover:shadow-[0_12px_40px_rgb(0,0,0,0.06)] hover:border-gray-200 group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-premium-900 text-base line-clamp-1">
                      {req.repSnapshot?.name || 'Rep Name'}
                    </h3>
                    {req.repSnapshot?.designation && (
                      <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-[0.5rem] bg-premium-100 text-gray-500">{req.repSnapshot.designation}</span>
                    )}
                    {isPast ? (
                      <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                        <Archive className="w-2.5 h-2.5" /> Past
                      </span>
                    ) : isCompleted ? (
                      <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">Completed</span>
                    ) : (
                      <span className="text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Confirmed</span>
                    )}
                  </div>
                  <p className="font-medium text-gray-500 text-xs">{req.repSnapshot?.company}</p>
                  
                  <div className="flex items-center gap-2 mt-4 text-[13px] font-semibold text-gray-600 bg-premium-50 px-3 py-2 rounded-[0.75rem] border border-gray-100/50 w-fit">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Slot: {req.approvedTimeSlot || 'Standard'} on {req.approvedDate ? format(req.approvedDate.toDate(), 'MMM dd, yyyy') : 'N/A'}
                  </div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2.5 w-full sm:w-auto">
                  {req.token && (
                    <div className="bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 text-[11px] uppercase tracking-widest rounded-lg border border-emerald-200/60 shadow-2xs font-mono">
                      Token: {req.token}
                    </div>
                  )}

                  {!isCompleted ? (
                    <button
                      onClick={() => markCompleted(req.id)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  ) : (
                    <div className="text-xs font-bold text-blue-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" /> Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
