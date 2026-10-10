import { useState, useEffect, useRef } from 'react';
import { subscribeRepAppointmentChanges } from '../../lib/db/appointments';
import { useAuth } from '../../lib/auth';
import { CheckCircle2, UserCheck, XCircle, Bell, ChevronRight, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function RepNotificationListener({ children }) {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
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
          const docName = data.doctorName || 'Doctor';
          let title = '';
          let message = '';
          let type = 'info'; // 'approved', 'completed', 'rejected'

          if (newStatus === 'approved' || newStatus === 'confirmed') {
            title = 'Gatepass Confirmed!';
            message = `Dr. ${docName} approved your appointment request. Token: ${data.token || 'Issued'}`;
            type = 'approved';
          } else if (newStatus === 'completed') {
            title = 'Visit Completed!';
            message = `Dr. ${docName} marked your appointment as completed.`;
            type = 'completed';
          } else if (newStatus === 'rejected') {
            title = 'Request Declined';
            message = `Dr. ${docName} declined your appointment request.`;
            type = 'rejected';
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
            setNotifications(prev => [newNotif, ...prev]);

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
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md animate-in slide-in-from-top-6 fade-in duration-500">
          <div className={`rounded-[1.5rem] p-4 shadow-[0_12px_40px_rgba(0,0,0,0.15)] border flex items-start gap-3.5 backdrop-blur-xl ${
            toast.type === 'approved' 
              ? 'bg-emerald-950/95 text-white border-emerald-500/30' 
              : toast.type === 'completed'
              ? 'bg-blue-950/95 text-white border-blue-500/30'
              : 'bg-rose-950/95 text-white border-rose-500/30'
          }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${
              toast.type === 'approved' 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : toast.type === 'completed'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {toast.type === 'approved' && <CheckCircle2 className="w-5 h-5" />}
              {toast.type === 'completed' && <UserCheck className="w-5 h-5" />}
              {toast.type === 'rejected' && <XCircle className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-display font-bold text-[15px] tracking-tight">{toast.title}</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs font-medium text-gray-300 leading-snug">{toast.message}</p>
              
              <button 
                onClick={() => {
                  setToast(null);
                  navigate(`/status/${toast.appointmentId}`);
                }}
                className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
              >
                View Details <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <button 
              onClick={() => setToast(null)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
