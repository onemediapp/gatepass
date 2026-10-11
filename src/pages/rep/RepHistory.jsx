import React, { useState, useEffect } from 'react';
import { subscribeRepAppointments } from '../../lib/db/appointments';
import { useAuth } from '../../lib/auth';
import { Calendar, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import Skeleton from '../../components/ui/Skeleton';
import StatusChip from '../../components/ui/StatusChip';
import EdgeCard from '../../components/ui/EdgeCard';

export default function RepHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeRepAppointments(user.uid, (data) => {
      setHistory(data);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  if (loading) {
    return (
      <div className="pb-24 max-w-md mx-auto p-4 sm:p-6 mt-4 space-y-4 font-sans">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-24 rounded-[1.25rem]" />
        <Skeleton className="w-full h-24 rounded-[1.25rem]" />
        <RepBottomNav />
      </div>
    );
  }

  const getEdge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved':
      case 'confirmed':
        return 'teal';
      case 'rejected':
      case 'declined':
        return 'coral';
      case 'pending':
        return 'sand';
      default:
        return 'navy';
    }
  };

  return (
    <div className="pb-24 font-sans max-w-md mx-auto p-4 sm:p-6 mt-2 selection:bg-amber-100 selection:text-sand-600">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Your Requests</h1>
        <p className="text-ink-soft text-xs mt-0.5">Track confirmed passes, pending slots, and visit records.</p>
      </div>

      {history.length === 0 ? (
        <div className="bg-white rounded-card p-10 text-center border border-line shadow-card space-y-3">
          <div className="w-14 h-14 rounded-[1.25rem] bg-navy-100 text-navy-900 flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7 text-ink-mute" />
          </div>
          <h3 className="font-display font-bold text-base text-ink">No Appointments Yet</h3>
          <p className="text-xs text-ink-soft max-w-xs mx-auto">
            You haven't requested any visits yet. Search for verified doctors and request your first slot.
          </p>
          <div className="pt-2">
            <Link
              to="/rep/search"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-navy-900 hover:bg-navy-700 text-white rounded-[0.875rem] text-xs font-semibold shadow-sm transition-all min-h-[2.75rem]"
            >
              Find Doctors
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <Link to={`/status/${item.id}`} key={item.id} className="block group">
              <EdgeCard edge={getEdge(item.status)} className="p-4 hover:border-ink-mute transition-all">
                <div className="flex justify-between items-center mb-2">
                  <StatusChip status={item.status} />
                  <span className="font-mono text-[0.6875rem] text-ink-mute flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-500" />
                    {item.slotDate || (item.preferredDate ? new Date(item.preferredDate.toMillis()).toLocaleDateString() : 'N/A')}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="min-w-0 flex-1 pr-2">
                    <h3 className="font-bold text-ink text-sm truncate group-hover:text-navy-500 transition-colors">
                      Dr. {item.doctorName || 'Doctor'}
                    </h3>
                    <p className="text-xs text-ink-soft truncate mt-0.5">
                      {item.clinicName || 'Clinic'} {item.slotStartTime ? `· ${item.slotStartTime}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-ink-mute group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </div>
              </EdgeCard>
            </Link>
          ))}
        </div>
      )}

      <RepBottomNav />
    </div>
  );
}
