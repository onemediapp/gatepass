import React, { useState, useEffect, useRef } from 'react';
import { subscribeRepAppointmentChanges } from '../../lib/db/appointments';
import { useAuth } from '../../lib/auth';
import { CheckCircle2, UserCheck, XCircle, ChevronRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LiveDot from '../ui/LiveDot';

export default function RepNotificationListener({ children }) {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const prevStatusesRef = useRef({});
  const initialLoadRef = useRef(true);

  useEffect(() => {
    if (!user || !userData?.role?.includes('rep')) return;

    const unsub = subscribeRepAppointmentChanges(user.uid, (change) => {
      const data = change.data;
      const id = change.id;
      const newStatus = data.status;
      const prevStatus = prevStatusesRef.current[id];

      // On initial snapshot load, store all current statuses
      if (initialLoadRef.current) {
        prevStatusesRef.current[id] = newStatus;
        return;
      }

      // If modified and status actually changed
      if (change.type === 'modified' && prevStatus && prevStatus !== newStatus) {
        const rawDocName = data.doctorSnapshot?.name || data.doctorName || 'Doctor';
        const docDisplayName = rawDocName.startsWith('Dr.') ? rawDocName : `Dr. ${rawDocName}`;
        let title = '';
        let message = '';
        let type = 'approved'; // 'approved', 'completed', 'declined'

        if (newStatus === 'approved' || newStatus === 'confirmed') {
          title = 'Gatepass Confirmed';
          message = `${docDisplayName} approved your appointment request.`;
          type = 'approved';
        } else if (newStatus === 'completed') {
          title = 'Visit Completed';
          message = `${docDisplayName} marked your appointment as completed.`;
          type = 'completed';
        } else if (newStatus === 'rejected' || newStatus === 'declined') {
          title = 'Request Declined';
          message = `${docDisplayName} couldn't take this slot.`;
          type = 'declined';
        }

        if (title) {
          const newNotif = {
            id: `${id}-${Date.now()}`,
            appointmentId: id,
            title,
            message,
            type,
            timestamp: new Date(),
            doctorName: docName,
            token: data.token
          };

          setToast(newNotif);

          // Auto dismiss toast after 6 seconds
          setTimeout(() => {
            setToast(current => current?.id === newNotif.id ? null : current);
          }, 6000);
        }
      }

      // Update ref
      prevStatusesRef.current[id] = newStatus;
    });

    initialLoadRef.current = false;

    return () => {
      if (unsub) unsub();
    };
  }, [user, userData]);

  return (
    <>
      {children}

      {/* Real-time Floating Toast Notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-navy-900 text-cream-50 rounded-[1.25rem] p-4 shadow-[0_8px_24px_rgba(11,23,48,0.25)] border border-navy-700 flex items-start gap-3.5 border-l-4 border-l-teal-600">
            <div className={`w-9 h-9 rounded-[0.75rem] flex items-center justify-center flex-shrink-0 mt-0.5 ${
              toast.type === 'approved' 
                ? 'bg-teal-50 text-teal-600' 
                : toast.type === 'completed'
                ? 'bg-navy-100 text-navy-900'
                : 'bg-coral-50 text-coral-600'
            }`}>
              {toast.type === 'approved' && <CheckCircle2 className="w-4 h-4" />}
              {toast.type === 'completed' && <UserCheck className="w-4 h-4" />}
              {toast.type === 'declined' && <XCircle className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-display font-bold text-sm tracking-tight text-white">{toast.title}</span>
                <LiveDot />
              </div>
              <p className="text-xs text-navy-100 leading-snug">{toast.message}</p>
              
              <button 
                onClick={() => {
                  setToast(null);
                  navigate(`/status/${toast.appointmentId}`);
                }}
                className="mt-2 inline-flex items-center gap-1 font-mono text-[0.6875rem] font-bold text-amber-500 hover:text-amber-100 transition-colors uppercase tracking-wider"
              >
                View Pass <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <button 
              onClick={() => setToast(null)}
              className="p-1 text-ink-mute hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
