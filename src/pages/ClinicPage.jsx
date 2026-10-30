/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClinicBySlug } from '../lib/db/clinics';
import { getDoctor } from '../lib/db/doctors';
import { listDoctorsForClinic } from '../lib/db/doctorClinics';
import { isDoctorOpenNow, formatConciseRange, generatePlainLanguageSummary } from '../lib/schedule';
import { 
  MapPin, 
  Phone, 
  Clock, 
  ArrowRight, 
  Building2, 
  Stethoscope, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import EdgeCard from '../components/ui/EdgeCard';
import Skeleton from '../components/ui/Skeleton';
import MonoTag from '../components/ui/MonoTag';
import LiveDot from '../components/ui/LiveDot';
import Perforation from '../components/ui/Perforation';

export default function ClinicPage() {
  const { slug, clinicSlug } = useParams();
  const navigate = useNavigate();

  const activeSlug = slug || clinicSlug;
  const [clinic, setClinic] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchClinicAndDoctors() {
      if (!activeSlug) {
        setLoading(false);
        return;
      }

      try {
        const cData = await getClinicBySlug(activeSlug);
        if (!cData) {
          setClinic(null);
          setLoading(false);
          return;
        }

        setClinic(cData);

        // Fetch doctors linked to this clinic
        const doctorLinks = await listDoctorsForClinic(cData.id);
        const doctorIdSet = new Set(doctorLinks.map(l => l.doctorId));
        if (cData.ownerDoctorId) {
          doctorIdSet.add(cData.ownerDoctorId);
        }

        const loadedDoctors = [];
        for (const docId of doctorIdSet) {
          try {
            const dr = await getDoctor(docId);
            if (dr && dr.privacy?.visibleInSearch !== false) {
              loadedDoctors.push(dr);
            }
          } catch (e) {}
        }

        setDoctors(loadedDoctors);
      } catch (err) {
        console.error('Error fetching clinic page:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchClinicAndDoctors();
  }, [activeSlug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 p-6 flex flex-col items-center justify-center space-y-4 font-sans">
        <Skeleton className="w-16 h-16 rounded-[1rem]" />
        <Skeleton className="w-48 h-6 rounded-[0.5rem]" />
        <Skeleton className="w-64 h-4 rounded-[0.5rem]" />
      </div>
    );
  }

  if (!clinic) {
    return (
      <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="w-16 h-16 bg-white rounded-[1.25rem] shadow-sm flex items-center justify-center text-ink-mute mb-4 border border-line">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-xl sm:text-2xl font-display font-bold text-ink mb-2">
          Clinic Not Found
        </h1>
        <p className="text-ink-soft text-xs sm:text-sm mb-6 max-w-sm">
          We couldn't find a clinic with the link <span className="font-mono text-ink">/clinic/{activeSlug}</span>.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-navy-900 text-white font-bold px-6 py-3 rounded-[0.875rem] shadow-sm hover:bg-navy-700 transition-all text-xs"
        >
          Go to Gatepass Home
        </button>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'DR';
    return name
      .replace(/^dr\.?\s+/i, '')
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-cream-50 pb-20 font-sans selection:bg-amber-100 selection:text-sand-600">
      
      {/* ── Clinic Header (Midnight Atmospheric Boarding Pass Motif) ── */}
      <section className="bg-gradient-to-b from-navy-950 via-navy-900 to-navy-900 text-white px-5 sm:px-8 pt-9 pb-12 rounded-b-[2rem] border-b border-navy-800 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-[-10%] w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-2xl mx-auto space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-lg text-white">Gatepass</span>
              <span className="w-2 h-2 rounded-[0.2rem] bg-amber-400 transform rotate-45 inline-block shadow-sm" />
            </div>
            <MonoTag variant="neutral" className="bg-white/10 text-white border-white/20 backdrop-blur-md">
              Reception Desk Access
            </MonoTag>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight leading-tight">
              {clinic.clinicName}
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 flex items-start gap-1.5 font-medium">
              <MapPin className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
              <span>{clinic.address}, {clinic.city}, {clinic.state || 'India'}</span>
            </p>
          </div>

          {(clinic.phone || clinic.repHours) && (
            <div className="pt-2 flex flex-wrap gap-2 text-xs">
              {clinic.phone && (
                <div className="flex items-center gap-1.5 font-mono text-white/90 bg-white/10 px-3 py-1.5 rounded-[0.75rem] border border-white/15 backdrop-blur-md">
                  <Phone className="w-3.5 h-3.5 text-amber-400" /> {clinic.phone}
                </div>
              )}
              {clinic.repHours && (
                <div className="flex items-center gap-1.5 font-mono text-white/90 bg-white/10 px-3 py-1.5 rounded-[0.75rem] border border-white/15 backdrop-blur-md">
                  <Clock className="w-3.5 h-3.5 text-teal-400" /> Visiting Hours: {clinic.repHours}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Available Doctors at Clinic ──────────────────────────────── */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold">
            Participating Specialists ({doctors.length})
          </h2>
          <span className="text-[0.6875rem] text-ink-mute">
            Select doctor to pick a slot
          </span>
        </div>

        {doctors.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-[1.25rem] border border-dashed border-line text-ink-mute text-xs space-y-2">
            <Stethoscope className="w-8 h-8 mx-auto opacity-50" />
            <p>No active doctor profiles attached to this clinic yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {doctors.map((dr) => {
              const isOpen = isDoctorOpenNow(dr.repSchedule);
              const displayName = dr.privacy?.showFullName !== false
                ? (dr.name.startsWith('Dr.') ? dr.name : `Dr. ${dr.name}`)
                : `Dr. (${dr.privacy?.showSpecialty ? dr.specialty : 'Specialist'})`;

              const cleanDrSlug = dr.profileSlug || dr.uid;

              return (
                <EdgeCard
                  key={dr.id}
                  edge={isOpen ? 'teal' : 'navy'}
                  className="p-4 sm:p-5 bg-white hover:border-navy-500/30 transition-all cursor-pointer group active:scale-[0.99]"
                  onClick={() => navigate(`/dr/${cleanDrSlug}`)}
                >
                  <div className="flex items-start gap-3.5">
                    
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-[1rem] bg-cream-50 border border-line flex items-center justify-center font-display font-bold text-ink text-base overflow-hidden shadow-sm">
                        {dr.photoUrl && dr.privacy?.showFullName !== false ? (
                          <img src={dr.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(dr.name)
                        )}
                      </div>
                      {isOpen && (
                        <div className="absolute -top-1 -right-1">
                          <LiveDot active={true} />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-sm sm:text-base text-ink group-hover:text-navy-700 transition-colors truncate">
                          {displayName}
                        </h3>
                        {isOpen && <MonoTag variant="teal">Open Now</MonoTag>}
                      </div>

                      <p className="text-xs text-teal-600 font-semibold mt-0.5 truncate">
                        {dr.privacy?.showSpecialty !== false ? dr.specialty : 'Specialist'}
                        {dr.qualifications && (
                          <span className="text-ink-mute font-normal"> · {dr.qualifications}</span>
                        )}
                      </p>

                      <p className="text-[0.6875rem] text-ink-soft mt-1.5 line-clamp-1 leading-relaxed">
                        {generatePlainLanguageSummary(dr.repSchedule)}
                      </p>
                    </div>

                    <div className="self-center p-1.5 rounded-[0.5rem] text-ink-mute group-hover:text-ink group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>

                  </div>
                </EdgeCard>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
