import React, { useState, useEffect, useMemo } from 'react';
import { subscribeRepAppointments } from '../../lib/db/appointments';
import { useAuth } from '../../lib/auth';
import { Calendar, ChevronRight, Clock, Search, Ticket, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import Skeleton from '../../components/ui/Skeleton';
import StatusChip from '../../components/ui/StatusChip';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import { formatTokenDisplay } from '../../lib/gatepass';
import { cn } from '../../lib/utils';

export default function RepHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeRepAppointments(user.uid, (data) => {
      // Sort newest / upcoming first
      const sorted = [...data].sort((a, b) => {
        const dateA = a.slotDate || '';
        const dateB = b.slotDate || '';
        return dateB.localeCompare(dateA);
      });
      setHistory(sorted);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const counts = useMemo(() => {
    const total = history.length;
    const active = history.filter(h => h.status === 'approved' || h.status === 'confirmed').length;
    const pending = history.filter(h => h.status === 'pending').length;
    const completed = history.filter(h => h.status === 'completed' || h.outcome === 'met').length;
    return { total, active, pending, completed };
  }, [history]);

  const filteredHistory = useMemo(() => {
    if (activeTab === 'active') {
      return history.filter(h => h.status === 'approved' || h.status === 'confirmed');
    }
    if (activeTab === 'pending') {
      return history.filter(h => h.status === 'pending');
    }
    if (activeTab === 'completed') {
      return history.filter(h => h.status === 'completed' || h.outcome === 'met');
    }
    return history;
  }, [history, activeTab]);

  if (loading) {
    return (
      <div className="pb-28 max-w-md mx-auto p-4 sm:p-6 mt-4 space-y-4 font-sans">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-11 rounded-[1rem]" />
        <Skeleton className="w-full h-24 rounded-[1.25rem]" />
        <Skeleton className="w-full h-24 rounded-[1.25rem]" />
        <RepBottomNav />
      </div>
    );
  }

  const getEdge = (item) => {
    if (item.outcome === 'met' || item.status === 'completed') return 'teal';
    switch (item.status?.toLowerCase()) {
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
    <div className="pb-28 font-sans max-w-md mx-auto p-4 sm:p-6 mt-2 selection:bg-amber-100 selection:text-sand-600">
      
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Your Passes</h1>
            <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-full bg-cream-200 text-ink-soft">
              {counts.total}
            </span>
          </div>
          <p className="text-ink-soft text-xs mt-0.5">Track confirmed visits, pending slots, and history.</p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/rep/dcr"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[0.75rem] bg-white border border-line hover:border-navy-500 text-ink text-xs font-semibold shadow-2xs transition-all active:scale-95"
            title="Daily Call Report"
          >
            <FileText className="w-3.5 h-3.5 text-navy-800" />
            <span>DCR</span>
          </Link>
          <Link
            to="/rep/search"
            className="p-2 rounded-[0.75rem] bg-navy-900 text-white hover:bg-navy-800 transition-colors shadow-2xs"
            title="New Request"
          >
            <Search className="w-4 h-4 text-amber-400" />
          </Link>
        </div>
      </div>

      {/* Segmented Filter Pills */}
      {history.length > 0 && (
        <div className="flex items-center gap-1.5 p-1 bg-cream-200/70 rounded-[1rem] border border-line mb-5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-3 py-1.5 rounded-[0.75rem] text-xs font-semibold transition-all whitespace-nowrap",
              activeTab === 'all'
                ? "bg-white text-navy-950 shadow-2xs font-bold"
                : "text-ink-soft hover:text-ink"
            )}
          >
            All ({counts.total})
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={cn(
              "px-3 py-1.5 rounded-[0.75rem] text-xs font-semibold transition-all whitespace-nowrap",
              activeTab === 'active'
                ? "bg-white text-navy-950 shadow-2xs font-bold"
                : "text-ink-soft hover:text-ink"
            )}
          >
            Active ({counts.active})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            className={cn(
              "px-3 py-1.5 rounded-[0.75rem] text-xs font-semibold transition-all whitespace-nowrap",
              activeTab === 'pending'
                ? "bg-white text-navy-950 shadow-2xs font-bold"
                : "text-ink-soft hover:text-ink"
            )}
          >
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={cn(
              "px-3 py-1.5 rounded-[0.75rem] text-xs font-semibold transition-all whitespace-nowrap",
              activeTab === 'completed'
                ? "bg-white text-navy-950 shadow-2xs font-bold"
                : "text-ink-soft hover:text-ink"
            )}
          >
            Visited ({counts.completed})
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <div className="bg-white rounded-[1.25rem] p-10 text-center border border-line shadow-card space-y-3">
          <div className="w-14 h-14 rounded-[1.25rem] bg-navy-100 text-navy-900 flex items-center justify-center mx-auto shadow-2xs">
            <Ticket className="w-7 h-7 text-navy-700" />
          </div>
          <h3 className="font-display font-bold text-base text-ink">No Appointments Yet</h3>
          <p className="text-xs text-ink-soft max-w-xs mx-auto">
            You haven't requested any visits yet. Search for verified doctors and request your first zero-wait slot.
          </p>
          <div className="pt-2">
            <Link
              to="/rep/search"
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white rounded-[0.875rem] text-xs font-bold shadow-md transition-all active:scale-95"
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>Find Doctors</span>
            </Link>
          </div>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="bg-white rounded-[1.25rem] p-8 text-center border border-line shadow-card text-ink-soft text-xs">
          No passes found matching this filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map(item => {
            const rawName = item.doctorSnapshot?.name || item.doctorName || 'Doctor';
            const doctorName = rawName.startsWith('Dr.') ? rawName : `Dr. ${rawName}`;
            const initial = rawName.replace('Dr. ', '').charAt(0) || 'D';
            const tokenStr = item.token ? formatTokenDisplay(item.token) : null;

            return (
              <Link to={`/status/${item.id}`} key={item.id} className="block group">
                <EdgeCard edge={getEdge(item)} className="p-4 hover:border-ink-mute transition-all shadow-card hover:shadow-card-hover hover:-translate-y-0.5">
                  <div className="flex justify-between items-center mb-2.5">
                    <StatusChip status={item.status} />
                    <div className="flex items-center gap-2">
                      {tokenStr && (
                        <span className="font-mono text-[0.625rem] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-[0.375rem] border border-teal-600/20">
                          {tokenStr}
                        </span>
                      )}
                      <span className="font-mono text-[0.6875rem] text-ink-mute flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        {item.slotDate || (item.preferredDate ? new Date(item.preferredDate.toMillis()).toLocaleDateString() : 'N/A')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-[0.875rem] bg-navy-900 text-amber-400 font-display font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                        {initial}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-display font-bold text-ink text-sm truncate group-hover:text-navy-900 transition-colors">
                          {doctorName}
                        </h3>
                        <p className="text-xs text-ink-soft truncate mt-0.5">
                          {item.doctorSnapshot?.clinicName || item.clinicName || 'Clinic'}
                          {item.slotStart ? ` · ${item.slotStart}${item.slotEnd ? `–${item.slotEnd}` : ''}` : ''}
                        </p>
                      </div>
                    </div>

                    <ChevronRight className="w-4 h-4 text-ink-mute group-hover:text-navy-900 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                </EdgeCard>
              </Link>
            );
          })}
        </div>
      )}

      <RepBottomNav />
    </div>
  );
}
