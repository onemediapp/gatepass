import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClinicBySlug } from '../lib/db/clinics';
import { getDoctor } from '../lib/db/doctors';
import { getUser } from '../lib/db/users';
import { MapPin, Phone, Clock, ArrowRight } from 'lucide-react';
import EdgeCard from '../components/ui/EdgeCard';
import Skeleton from '../components/ui/Skeleton';
import MonoTag from '../components/ui/MonoTag';
import Perforation from '../components/ui/Perforation';

export default function ClinicPage() {
  const { clinicSlug } = useParams();
  const navigate = useNavigate();
  
  const [clinic, setClinic] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClinic() {
      try {
        const clinicData = await getClinicBySlug(clinicSlug);
        if (clinicData) {
          setClinic(clinicData);
          
          if (clinicData.ownerDoctorId) {
            const drData = await getDoctor(clinicData.ownerDoctorId);
            if (drData) {
              const usrDoc = await getUser(clinicData.ownerDoctorId);
              setDoctor({ ...drData, name: usrDoc?.name || drData.name });
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchClinic();
  }, [clinicSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 p-6 flex flex-col items-center justify-center space-y-4">
        <Skeleton className="w-16 h-16 rounded-[1rem]" />
        <Skeleton className="w-48 h-6" />
        <Skeleton className="w-64 h-4" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 bg-white rounded-[1.25rem] shadow-sm flex items-center justify-center text-ink-mute mb-4 border border-line">
          <MapPin className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-display font-bold text-ink mb-2">Clinic Not Found</h1>
        <p className="text-ink-soft text-sm mb-6 max-w-sm">
          We couldn't find the clinic you're looking for. The link might be invalid.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-navy-900 text-white font-bold px-6 py-3 rounded-[0.875rem] shadow-sm hover:bg-navy-700 transition-all text-sm"
        >
          Go Home
        </button>
      </div>
    );
  }

  const doctorSlug = doctor?.profileSlug || clinic.ownerDoctorId;

  return (
    <div className="min-h-screen bg-cream-50 pb-20 font-sans">
      {/* Header Boarding Pass Header */}
      <div className="bg-navy-900 text-white px-6 pt-10 pb-8 rounded-b-[1.75rem] border-b border-navy-700 shadow-sm relative overflow-hidden">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <MonoTag variant="neutral" className="bg-white/10 text-white border-white/20">
              Clinic Pass
            </MonoTag>
            <div className="w-2.5 h-2.5 rounded-[0.25rem] bg-amber-500 transform rotate-45" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight leading-tight">
            {clinic.clinicName}
          </h1>

          <p className="text-navy-100 text-sm mt-2 flex items-start gap-1.5">
            <MapPin className="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" />
            <span>{clinic.address}, {clinic.city}</span>
          </p>

          {(clinic.phone || clinic.repHours) && (
            <div className="mt-6 flex flex-col gap-2">
              {clinic.phone && (
                <div className="flex items-center gap-2 text-xs font-mono text-white/90 bg-white/10 px-3.5 py-2.5 rounded-[0.75rem] border border-white/10">
                  <Phone className="w-3.5 h-3.5 text-amber-500" /> {clinic.phone}
                </div>
              )}
              {clinic.repHours && (
                <div className="flex items-center gap-2 text-xs font-mono text-white/90 bg-white/10 px-3.5 py-2.5 rounded-[0.75rem] border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-teal-50" /> MR Hours: {clinic.repHours}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold">
            Doctors Available
          </h2>
        </div>
        
        {doctor ? (
          <EdgeCard edge="teal" className="p-5">
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-[1rem] flex items-center justify-center font-bold text-xl font-display border border-teal-600/20">
                {doctor.name?.[0] || 'D'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink text-base leading-tight mb-0.5">
                  Dr. {doctor?.privacy?.showFullName === false ? doctor.specialty : doctor.name}
                </h3>
                <p className="text-ink-soft text-xs">{doctor.specialty} • {doctor.qualifications}</p>
              </div>
            </div>
            
            <button 
              onClick={() => navigate(doctorSlug ? `/dr/${doctorSlug}` : `/appointment/new?doctorId=${doctor.uid}&clinicId=${clinic.id}`)}
              className="w-full bg-navy-900 text-white font-bold rounded-[0.875rem] px-5 py-3 hover:bg-navy-700 transition-all active:scale-[0.99] flex items-center justify-center gap-2 text-xs shadow-sm"
            >
              Request Slot <ArrowRight className="w-4 h-4 text-amber-500" />
            </button>
          </EdgeCard>
        ) : (
          <div className="text-center py-8 bg-white rounded-[1.25rem] border border-dashed border-line text-ink-mute text-xs">
            No doctors currently attached to this clinic.
          </div>
        )}
      </div>
    </div>
  );
}
