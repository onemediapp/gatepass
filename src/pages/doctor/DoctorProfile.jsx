import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getDoctor } from '../../lib/db/doctors';
import { getUser } from '../../lib/db/users';
import { getClinic } from '../../lib/db/clinics';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { MapPin, Clock, Phone, MessageCircle, Calendar, ArrowLeft, ShieldCheck, Building2 } from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import Skeleton from '../../components/ui/Skeleton';
import LiveDot from '../../components/ui/LiveDot';
import MonoTag from '../../components/ui/MonoTag';

export default function DoctorProfile() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDoctor() {
      try {
        const data = await getDoctor(doctorId);
        if (!data) {
          setDoctor(null);
          setLoading(false);
          return;
        }
        
        const uData = await getUser(doctorId);
        
        setDoctor({
          id: doctorId,
          ...data,
          name: uData?.name || data.name || 'Doctor',
          photoUrl: uData?.photoUrl || data.photoUrl || null
        });

        if (data.privacy?.showClinicName && data.clinicIds?.length > 0) {
          const clinicsData = [];
          for (const cid of data.clinicIds) {
            const cData = await getClinic(cid);
            if (cData) clinicsData.push(cData);
          }
          setClinics(clinicsData);
        }
        
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'doctors/' + doctorId);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctor();
  }, [doctorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 p-6 flex flex-col items-center justify-center space-y-4 font-sans">
        <Skeleton className="w-24 h-24 rounded-[1.5rem]" />
        <Skeleton className="w-48 h-6 rounded-[0.75rem]" />
        <Skeleton className="w-64 h-4 rounded-[0.5rem]" />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 bg-white shadow-sm border border-line rounded-[1.25rem] flex items-center justify-center mb-4 text-ink-mute">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-display font-bold text-ink">Profile Unavailable</h2>
        <p className="text-ink-soft mt-1 text-sm">This doctor profile could not be found.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 font-bold text-xs text-ink px-5 py-2.5 bg-white border border-line rounded-[0.875rem] shadow-sm hover:bg-cream-50 transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  const p = doctor.privacy || {};
  const displayName = p.showFullName ? doctor.name : 'Doctor';
  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className="min-h-screen font-sans bg-cream-50 pb-24 selection:bg-amber-100 selection:text-sand-600">
      {/* Header Banner */}
      <div className="h-40 bg-navy-900 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-[0.75rem] transition-colors z-20 shadow-sm border border-white/10 active:scale-95"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
      </div>
      
      <div className="max-w-md mx-auto px-4 relative z-10 -mt-16 space-y-4">
        {/* Main Profile Card */}
        <EdgeCard edge="navy" className="p-6 flex flex-col items-center text-center">
          <div className="relative w-24 h-24 -mt-16 mb-3 z-20">
            <div className="w-full h-full bg-navy-100 rounded-[1.25rem] border-2 border-white shadow-md flex items-center justify-center text-navy-900 font-bold text-2xl overflow-hidden font-display">
              {doctor.photoUrl && p.showFullName ? (
                <img src={doctor.photoUrl} alt="" className="w-full h-full object-cover" />
              ) : getInitials(displayName)}
            </div>
            {p.allowAppointmentRequest && (
              <div className="absolute -bottom-1 -right-1 z-30" title="Taking Appointments">
                <LiveDot />
              </div>
            )}
          </div>
          
          <h1 className="text-2xl font-display font-bold text-ink tracking-tight leading-tight">
            {p.showFullName ? `Dr. ${displayName}` : displayName}
          </h1>
          <p className="text-teal-600 text-xs font-semibold mt-1 flex items-center justify-center gap-1.5">
            <span>{p.showSpecialty ? doctor.specialty : 'Specialist'}</span>
            {doctor.qualifications && (
              <>
                <span className="w-1 h-1 bg-teal-600/30 rounded-full" />
                <span className="text-ink-soft font-normal">{doctor.qualifications}</span>
              </>
            )}
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-ink-soft font-medium">
            {p.showCity && doctor.city && (
              <div className="flex items-center gap-1 bg-cream-50 px-3 py-1.5 rounded-[0.625rem] border border-line">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                <span>{doctor.city}{doctor.state ? `, ${doctor.state}` : ''}</span>
              </div>
            )}
            {p.showRepHours && doctor.repHours && (
              <div className="flex items-center gap-1 bg-cream-50 px-3 py-1.5 rounded-[0.625rem] border border-line">
                <Clock className="w-3.5 h-3.5 text-ink-mute" />
                <span>{doctor.repHours}</span>
              </div>
            )}
          </div>
          
          <div className="w-full mt-6">
            {p.allowAppointmentRequest ? (
              <button 
                onClick={() => navigate(`/dr/${doctor.profileSlug || doctor.id}/slots`)}
                className="w-full bg-navy-900 hover:bg-navy-700 text-white font-bold rounded-[0.875rem] px-5 py-3.5 transition-all shadow-sm active:scale-[0.99] flex items-center justify-center gap-2 text-xs"
              >
                <Calendar className="w-4 h-4 text-amber-500" />
                Pick a slot
              </button>
            ) : (
              <div className="w-full bg-cream-50 border border-line text-ink-mute font-medium rounded-[0.875rem] px-4 py-3 text-xs text-center">
                Not taking rep visits currently
              </div>
            )}
          </div>
        </EdgeCard>

        {/* Contact & Clinics Sections */}
        {(p.phoneVisibility !== 'hidden' || p.allowWhatsAppRedirect) && (
          <EdgeCard edge="teal" className="p-5">
            <h3 className="font-display font-bold text-ink mb-3 tracking-tight text-sm flex items-center gap-2">
              <Phone className="w-4 h-4 text-ink-mute" /> Contact & Direct Connect
            </h3>
            <div className="space-y-2">
              {p.allowWhatsAppRedirect && doctor.whatsappNumber && (
                <a
                  href={`https://wa.me/91${doctor.whatsappNumber}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 w-full bg-teal-50 rounded-[0.875rem] p-3 text-teal-600 font-semibold text-xs hover:bg-teal-50/80 transition-colors border border-teal-600/30"
                >
                  <div className="w-8 h-8 bg-white rounded-[0.625rem] flex items-center justify-center shadow-sm text-teal-600">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <span>Direct WhatsApp Connect</span>
                </a>
              )}
              {p.phoneVisibility === 'approved_only' && (
                <div className="flex items-start gap-2.5 bg-cream-50 text-ink-soft p-3 rounded-[0.875rem] border border-line text-xs">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-500 mt-0.5" />
                  <p className="leading-relaxed">Phone number visible after your Gatepass request is approved.</p>
                </div>
              )}
            </div>
          </EdgeCard>
        )}

        {p.showClinicName && clinics.length > 0 && (
          <EdgeCard edge="sand" className="p-5">
            <h3 className="font-display font-bold text-ink mb-3 tracking-tight text-sm flex items-center gap-2">
              <Building2 className="w-4 h-4 text-ink-mute" /> Associated Clinics
            </h3>
            <div className="space-y-3">
              {clinics.map(clinic => (
                <div key={clinic.id} className="flex gap-3 items-start border-b border-line pb-3 last:border-0 last:pb-0">
                  <div className="bg-navy-100 p-2 rounded-[0.625rem] text-navy-900 shadow-sm flex-shrink-0 border border-navy-500/20">
                    <MapPin className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-ink text-xs mb-0.5 leading-tight">{clinic.clinicName}</h4>
                    <p className="text-xs text-ink-soft leading-relaxed">{clinic.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </EdgeCard>
        )}
      </div>
    </div>
  );
}
