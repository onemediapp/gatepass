import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subscribeAppointment } from '../lib/db/appointments';
import { getDoctor } from '../lib/db/doctors';
import { getClinic } from '../lib/db/clinics';
import { Clock, CheckCircle2, XCircle, MapPin, Calendar, ExternalLink, ShieldCheck, ChevronLeft, Ticket, Share2, AlertTriangle, Coffee } from 'lucide-react';
import { format } from 'date-fns';
import Skeleton from '../components/ui/Skeleton';
import EdgeCard from '../components/ui/EdgeCard';
import Perforation from '../components/ui/Perforation';
import LiveDot from '../components/ui/LiveDot';
import MonoTag from '../components/ui/MonoTag';

export default function StatusCheck() {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [clinic, setClinic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [errorStatus, setErrorStatus] = useState(null);

  const sharePassOnWhatsApp = () => {
    if (!appointment || !doctor) return;
    const token = appointment.token || '';
    const slot = appointment.approvedTimeSlot || 'Today';
    const repName = appointment.repSnapshot?.name || 'Medical Rep';
    const repCompany = appointment.repSnapshot?.company || '';
    const clinicName = clinic?.clinicName || 'Clinic';
    const passUrl = window.location.href;

    const text = `🏥 *VERIFIED CLINICAL GATEPASS*\n\n` +
      `👨‍⚕️ *Doctor:* Dr. ${doctor.name} (${doctor.specialty || 'Consultant'})\n` +
      `📍 *Location:* ${clinicName}\n` +
      `🎫 *Token:* #${token}\n` +
      `⏰ *Slot:* ${slot}\n` +
      `👤 *Medical Rep:* ${repName} (${repCompany})\n` +
      `🔗 *Live Gatepass Link:* ${passUrl}\n\n` +
      `_Presented via Gatepass Medical Protocol._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  useEffect(() => {
    if (!appointmentId) return;

    const unsub = subscribeAppointment(appointmentId, async (data) => {
      if (!data) {
        setLoading(false);
        setErrorStatus('not_found');
        return;
      }
      
      let currentStatus = data.status;

      if (data.status === 'approved' && data.tokenExpiresAt) {
        const expDate = data.tokenExpiresAt.toDate ? data.tokenExpiresAt.toDate() : new Date(data.tokenExpiresAt);
        if (new Date() > expDate) {
          currentStatus = 'expired';
          setIsExpired(true);
        }
      }

      setAppointment({ ...data, computedStatus: currentStatus });

      if (data.doctorId) {
        try {
          const docData = await getDoctor(data.doctorId);
          if (docData) setDoctor(docData);
        } catch (err) {
          console.error(err);
        }
      }

      if (data.clinicId) {
        try {
          const clinicData = await getClinic(data.clinicId);
          if (clinicData) setClinic(clinicData);
        } catch (err) {
          console.error(err);
        }
      }

      setLoading(false);
    });

    return () => unsub();
  }, [appointmentId]);

  useEffect(() => {
    let timerId;
    if (appointment?.computedStatus === 'approved' && appointment?.tokenExpiresAt) {
      const updateTimer = () => {
        const expiresAt = appointment.tokenExpiresAt.toDate ? appointment.tokenExpiresAt.toDate() : new Date(appointment.tokenExpiresAt);
        const now = new Date();
        const diff = expiresAt - now;

        if (diff <= 0) {
          setTimeLeft('00:00:00');
          setIsExpired(true);
          clearInterval(timerId);
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0');
          const seconds = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0');
          setTimeLeft(`${hours}:${minutes}:${seconds}`);
        }
      };

      updateTimer();
      timerId = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [appointment?.computedStatus, appointment?.tokenExpiresAt]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 space-y-4">
        <Skeleton className="w-16 h-16 rounded-[1rem]" />
        <Skeleton className="w-48 h-6 rounded-[0.5rem]" />
        <Skeleton className="w-64 h-4 rounded-[0.5rem]" />
      </div>
    );
  }

  if (errorStatus === 'not_found' || !appointment) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-display font-bold text-ink">Request not found</h2>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-navy-900 text-white rounded-[0.875rem] text-xs font-semibold"
        >
          Return Home
        </button>
      </div>
    );
  }

  const status = isExpired ? 'expired' : appointment.computedStatus;

  if (status === 'approved') {
    return (
      <div className="fixed inset-0 bg-navy-900 z-50 overflow-y-auto font-sans selection:bg-amber-100 selection:text-sand-600">
        {/* Live pulsing border */}
        <div className="absolute inset-1.5 sm:inset-3 border-4 border-teal-600/30 rounded-[2rem] motion-safe:animate-pulse pointer-events-none z-50 mix-blend-screen" />
        
        {/* Glow */}
        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[50%] bg-gradient-to-b from-teal-600/15 to-transparent blur-3xl pointer-events-none" />
        
        <div className="flex flex-col min-h-screen pt-4 pb-10 px-4 sm:px-6 relative z-10">
          
          {/* Top Navigation */}
          <div className="flex justify-between items-center px-2 py-3 mb-2">
            <button
              onClick={() => navigate('/rep/home')}
              className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 active:scale-95 transition-all outline-none"
              title="Return"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
              <LiveDot />
              <span className="text-white text-xs font-mono font-bold tracking-widest uppercase">Live Gatepass</span>
            </div>
            <div className="w-9" />
          </div>

          {/* Boarding Pass Card */}
          <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl mx-auto w-full max-w-sm flex flex-col relative animate-in slide-in-from-bottom-4 duration-500">
            
            {/* Header */}
            <div className="bg-teal-600 pt-8 pb-10 px-6 text-center text-white relative">
              <div className="relative z-10 flex flex-col items-center">
                <CheckCircle2 className="w-12 h-12 text-white mb-2 shadow-sm rounded-full bg-teal-600" strokeWidth={2.5} />
                <h1 className="text-2xl font-display font-bold tracking-wide">APPROVED</h1>
                <p className="font-mono text-xs font-semibold tracking-widest text-teal-50 uppercase mt-0.5">
                  Entry Granted
                </p>
              </div>
            </div>

            {/* Perforated divider */}
            <div className="relative -mt-3.5 z-20">
              <Perforation bgClass="bg-navy-900" className="my-0" />
            </div>

            {/* Ticket body */}
            <div className="bg-white pt-2 pb-6 px-6 z-20">
              {/* Doctor OPD Live Beacon Alert if any */}
              {doctor?.opdBeacon && (
                <div className="mb-4">
                  {doctor.opdBeacon.status === 'delayed_30' && (
                    <div className="bg-sand-50 border border-sand-600/30 rounded-[0.75rem] p-3 text-center">
                      <p className="text-xs font-bold text-sand-600 flex items-center justify-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" /> Doctor Running ~30 Mins Late
                      </p>
                      {doctor.opdBeacon.message && (
                        <p className="text-xs text-ink-soft mt-0.5 font-medium">"{doctor.opdBeacon.message}"</p>
                      )}
                    </div>
                  )}
                  {doctor.opdBeacon.status === 'break' && (
                    <div className="bg-navy-100 border border-navy-500/20 rounded-[0.75rem] p-2.5 text-center">
                      <p className="text-xs font-bold text-navy-900 flex items-center justify-center gap-1.5">
                        <Coffee className="w-3.5 h-3.5" /> Doctor on 15-Min Break
                      </p>
                    </div>
                  )}
                  {doctor.opdBeacon.status === 'on_time' && (
                    <div className="bg-teal-50 border border-teal-600/30 rounded-[0.75rem] p-2 text-center">
                      <p className="text-xs font-bold text-teal-600 flex items-center justify-center gap-1.5">
                        <LiveDot /> Doctor OPD Running On-Time
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Unique Token Display */}
              <div className="text-center my-4">
                <MonoTag variant="neutral" className="mb-2">Your Live Token</MonoTag>
                <div className="inline-block bg-teal-50 rounded-[1.25rem] px-6 py-3 border border-teal-600/30">
                  <p className="font-mono text-4xl sm:text-5xl font-bold text-teal-600 tracking-wider">
                    {appointment.token?.substring(0, 2)}<span className="opacity-30 mx-1">·</span>{appointment.token?.substring(2)}
                  </p>
                </div>
              </div>
              
              {/* Time & Slot Row */}
              <div className="grid grid-cols-2 gap-3 mt-4 bg-cream-50 rounded-[1rem] p-3 border border-line">
                <div className="border-r border-line pr-3">
                  <p className="flex items-center gap-1 text-[0.6875rem] text-ink-mute font-mono font-semibold uppercase tracking-wider mb-1">
                    <Clock className="w-3 h-3 text-teal-600" /> Valid For
                  </p>
                  <p className="text-sm font-bold text-teal-600 font-mono tracking-tight">{timeLeft || '--:--:--'}</p>
                </div>
                <div className="pl-1">
                  <p className="flex items-center gap-1 text-[0.6875rem] text-ink-mute font-mono font-semibold uppercase tracking-wider mb-1">
                    <Calendar className="w-3 h-3 text-amber-500" /> Time Slot
                  </p>
                  <p className="text-sm font-bold text-ink">{appointment.slotStartTime ? `${appointment.slotStartTime}–${appointment.slotEndTime}` : (appointment.approvedTimeSlot || 'Confirmed Slot')}</p>
                </div>
              </div>
            </div>

            {/* Doctor & Visitor Foot */}
            <div className="bg-cream-50/70 px-6 py-5 border-t border-line space-y-3">
              <div className="flex gap-3 items-center pb-3 border-b border-line">
                <div className="w-10 h-10 rounded-[0.75rem] bg-teal-50 border border-teal-600/20 flex items-center justify-center text-teal-600 font-bold font-display text-base">
                  Dr
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-ink text-sm truncate">Dr. {doctor?.name || appointment.doctorName}</p>
                  <p className="text-xs text-ink-soft truncate">{doctor?.specialty || 'Specialist'}</p>
                </div>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex gap-2.5 items-start">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-bold text-ink">{clinic?.clinicName || appointment.clinicName || 'Remedi Clinic'}</span>
                  </div>
                </div>
                
                <div className="flex gap-2.5 items-start">
                  <Ticket className="w-3.5 h-3.5 text-navy-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-ink truncate">{appointment.repSnapshot?.name}</p>
                    <p className="text-ink-soft text-[0.6875rem] truncate">{appointment.repSnapshot?.company} · {appointment.repSnapshot?.designation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action CTAs */}
          <div className="mt-6 mx-auto w-full max-w-sm space-y-2.5">
            <button
              onClick={sharePassOnWhatsApp}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 active:scale-95 text-white font-bold rounded-[0.875rem] shadow-sm transition-all flex items-center justify-center gap-2 text-xs"
            >
              <Share2 className="w-3.5 h-3.5" /> Share Pass via WhatsApp
            </button>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 text-cream-50 py-3 px-4 rounded-[0.875rem] flex justify-center items-center gap-2 font-medium text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-600 motion-safe:animate-pulse" />
              Show this pass at reception
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col p-4 sm:p-6 font-sans selection:bg-amber-100 selection:text-sand-600">
        <div className="flex justify-start mb-2">
          <button
            onClick={() => navigate('/rep/home')}
            className="p-2 bg-white shadow-sm border border-line rounded-[0.75rem] text-ink hover:bg-cream-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center pt-6 text-center max-w-sm mx-auto w-full">
          <div className="w-20 h-20 bg-sand-50 border border-sand-600/30 rounded-[1.25rem] flex items-center justify-center mb-4">
            <Clock className="w-10 h-10 text-sand-600" />
          </div>
          
          <h1 className="text-2xl font-display font-bold text-ink mb-1">Under Review</h1>
          <p className="text-ink-soft text-sm mb-6">Dr. {doctor?.name || appointment.doctorName}</p>
          
          <EdgeCard edge="sand" className="p-5 w-full text-left mb-6">
            <div className="flex items-center justify-between mb-4">
              <MonoTag variant="amber">Request Summary</MonoTag>
              <span className="font-mono text-xs text-ink-mute">Pending</span>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-line pb-2">
                <span className="text-ink-mute">Slot Requested</span>
                <span className="font-bold text-ink">{appointment.slotDate || (appointment.preferredDate ? format(appointment.preferredDate.toDate(), 'dd MMM yyyy') : 'Pending')}</span>
              </div>
              {appointment.productFocus && (
                <div>
                  <span className="text-ink-mute block mb-1">Visit Focus</span>
                  <p className="font-medium text-ink bg-cream-50 p-2.5 rounded-[0.625rem] border border-line">{appointment.productFocus}</p>
                </div>
              )}
            </div>
          </EdgeCard>
          
          <div className="bg-white p-4 rounded-[1rem] w-full border border-line shadow-sm text-xs">
            <p className="text-ink font-semibold">Doctor reviews requests before clinic hours.</p>
            <p className="text-ink-mute mt-0.5">This pass updates automatically when approved.</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'rejected' || status === 'declined') {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col p-4 sm:p-6 font-sans">
        <div className="flex justify-start mb-2">
          <button
            onClick={() => navigate('/rep/home')}
            className="p-2 bg-white shadow-sm border border-line rounded-[0.75rem] text-ink hover:bg-cream-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center pt-6 text-center max-w-sm mx-auto w-full">
          <div className="w-20 h-20 bg-coral-50 border border-coral-600/30 rounded-[1.25rem] flex items-center justify-center mb-4">
            <XCircle className="w-10 h-10 text-coral-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-ink mb-1">Not Approved</h1>
          <p className="text-ink-soft text-sm mb-6">Dr. {doctor?.name || appointment.doctorName}</p>
          
          <EdgeCard edge="coral" className="p-5 w-full text-center mb-6">
            <p className="text-ink-soft text-xs leading-relaxed">
              Dr. {doctor?.name || 'The doctor'} couldn't take this slot. You may pick another time slot.
            </p>
          </EdgeCard>
          
          <div className="w-full space-y-2 mt-auto">
            <button 
              onClick={() => navigate(doctor?.profileSlug ? `/dr/${doctor.profileSlug}/slots` : `/rep/home`)}
              className="w-full bg-navy-900 text-white font-bold py-3.5 rounded-[0.875rem] shadow-sm hover:bg-navy-700 transition-all text-xs"
            >
              Pick Another Slot
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'completed') {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col p-4 sm:p-6 font-sans">
        <div className="flex justify-start mb-2">
          <button
            onClick={() => navigate('/rep/home')}
            className="p-2 bg-white shadow-sm border border-line rounded-[0.75rem] text-ink hover:bg-cream-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center pt-10 text-center max-w-sm mx-auto w-full">
          <div className="w-20 h-20 bg-teal-50 border border-teal-600/30 rounded-[1.25rem] flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-teal-600" />
          </div>
          <h1 className="text-2xl font-display font-bold text-ink mb-1">Visit Completed</h1>
          <p className="text-ink-soft text-sm mb-6">Dr. {doctor?.name || appointment.doctorName}</p>
          
          <EdgeCard edge="teal" className="p-5 w-full text-left mb-6 space-y-2.5 text-xs">
            <div className="flex justify-between items-center border-b border-line pb-2">
              <span className="text-ink-mute">Representative</span>
              <span className="font-bold text-ink">{appointment.repSnapshot?.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-ink-mute">Status</span>
              <span className="font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-600/20 font-mono text-[0.6875rem]">Completed</span>
            </div>
          </EdgeCard>

          <button 
            onClick={() => navigate('/rep/home')}
            className="w-full bg-navy-900 text-white font-bold py-3.5 rounded-[0.875rem] shadow-sm hover:bg-navy-700 transition-all text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (status === 'expired') {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col p-4 sm:p-6 font-sans">
        <div className="flex justify-start mb-2">
          <button
            onClick={() => navigate('/rep/home')}
            className="p-2 bg-white shadow-sm border border-line rounded-[0.75rem] text-ink hover:bg-cream-50 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center pt-12 text-center max-w-sm mx-auto w-full">
          <div className="w-20 h-20 bg-cream-50 border border-line rounded-[1.25rem] flex items-center justify-center mb-4 text-3xl">
            ⏳
          </div>
          <h1 className="text-2xl font-display font-bold text-ink mb-2">Token Expired</h1>
          <p className="text-ink-soft text-xs leading-relaxed mb-6">
            This Gatepass has expired and can no longer be used for reception entry.
          </p>
          
          <button 
            onClick={() => navigate('/rep/home')}
            className="w-full bg-navy-900 text-white font-bold py-3.5 rounded-[0.875rem] shadow-sm hover:bg-navy-700 transition-all text-xs"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
}
