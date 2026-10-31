/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listVisibleDoctors } from '../../lib/db/doctors';
import { getClinic } from '../../lib/db/clinics';
import { isDoctorOpenNow, formatResponseTimeBucket } from '../../lib/schedule';
import { 
  Search, 
  MapPin, 
  SearchX, 
  Filter, 
  ArrowLeft, 
  Clock, 
  Building2, 
  ChevronRight, 
  Stethoscope, 
  Sparkles,
  ShieldCheck,
  Menu,
  Heart,
  ChevronDown
} from 'lucide-react';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import RepDrawerMenu from '../../components/layout/RepDrawerMenu';
import { useAuth } from '../../lib/auth';
import EdgeCard from '../../components/ui/EdgeCard';
import LiveDot from '../../components/ui/LiveDot';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

export default function DoctorSearch() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('Kurnool');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [clinicNamesMap, setClinicNamesMap] = useState({});

  const specialties = ['All', 'Physician', 'Dermatologist', 'Orthopedic', 'Cardiologist', 'More'];

  useEffect(() => {
    let isCancelled = false;
    setIsSearching(true);

    const handler = setTimeout(async () => {
      try {
        const docs = await listVisibleDoctors({
          city: selectedCity === 'All' ? undefined : selectedCity,
          specialty: selectedSpecialty === 'All' ? undefined : selectedSpecialty,
        });

        if (isCancelled) return;

        let filtered = docs.filter((d) => {
          if (!d.privacy?.visibleInSearch) return false;
          if (!searchTerm.trim()) return true;
          const term = searchTerm.trim().toLowerCase();
          const nameMatch = d.name?.toLowerCase().includes(term);
          const specMatch = d.specialty?.toLowerCase().includes(term);
          const cityMatch = d.city?.toLowerCase().includes(term);
          return nameMatch || specMatch || cityMatch;
        });

        // If results are empty, provide reference doctors from Remedi Clinic pilot
        if (filtered.length === 0 && !searchTerm) {
          filtered = [
            {
              id: 'doc-karthik',
              profileSlug: 'karthik-remedi',
              name: 'Dr. T. Karthik',
              specialty: 'Consultant Physician • Diabetes Specialist',
              qualifications: 'MBBS, MD (General Medicine)',
              clinicName: 'Remedi Clinic',
              city: 'Kurnool',
              distance: '1.2 km',
              availableToday: true,
              availableSlots: ['11:00 AM', '12:00 PM', '6:00 PM'],
              privacy: { visibleInSearch: true, showSpecialty: true }
            },
            {
              id: 'doc-ramya',
              profileSlug: 'ramya-remedi',
              name: 'Dr. K. Ramya',
              specialty: 'Dermatologist & Cosmetologist',
              qualifications: 'MBBS, MD. DVL',
              clinicName: 'Remedi Clinic',
              city: 'Kurnool',
              distance: '1.2 km',
              availableToday: true,
              availableSlots: ['11:30 AM', '12:30 PM', '7:00 PM'],
              privacy: { visibleInSearch: true, showSpecialty: true }
            },
            {
              id: 'doc-subba',
              profileSlug: 'subba-remedi',
              name: 'Dr. D V Subba Reddy',
              specialty: 'Orthopedic Surgeon',
              qualifications: 'MS (Orthopedics)',
              clinicName: 'Remedi Clinic',
              city: 'Kurnool',
              distance: '1.2 km',
              availableToday: false,
              nextAvailable: 'Tomorrow',
              availableSlots: ['10:00 AM', '12:00 PM', '4:00 PM'],
              privacy: { visibleInSearch: true, showSpecialty: true }
            }
          ];
        }

        const cMap = {};
        for (const dr of filtered) {
          if (dr.clinicIds && dr.clinicIds.length > 0) {
            const firstClinicId = dr.clinicIds[0];
            if (!clinicNamesMap[firstClinicId] && !cMap[firstClinicId]) {
              try {
                const cDoc = await getClinic(firstClinicId);
                if (cDoc) cMap[firstClinicId] = cDoc.clinicName;
              } catch (e) {}
            }
          }
        }

        if (!isCancelled) {
          setClinicNamesMap(prev => ({ ...prev, ...cMap }));
          setResults(filtered);
          setIsSearching(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('Search error:', err);
          setIsSearching(false);
        }
      }
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(handler);
    };
  }, [searchTerm, selectedCity, selectedSpecialty]);

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-cream-50 font-sans pb-28 selection:bg-amber-100 selection:text-sand-600 flex flex-col">
      
      {/* ── Top Header (Image 6 Screen 1) ───────────────────────────── */}
      <header className="bg-white/95 backdrop-blur-xl border-b border-line px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-2xs space-y-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-lg text-ink">Gatepass</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
          </div>

          {/* City selector dropdown pill */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-100 border border-line text-xs font-semibold text-ink cursor-pointer hover:bg-cream-200 transition-colors">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <span>{selectedCity}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Doctor Discovery
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Search and book appointments with verified doctors
          </p>
        </div>

        {/* Search bar with filter icon */}
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by doctor name, specialty or clinic..."
              className="w-full bg-slate-50 border border-slate-200 rounded-[1rem] pl-10 pr-4 py-2.5 text-xs sm:text-sm font-medium text-ink outline-none focus:border-navy-900 focus:bg-white transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2.5 rounded-[1rem] bg-navy-900 text-white hover:bg-navy-800 transition-all cursor-pointer flex-shrink-0"
            title="Filter search"
          >
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Specialty Filter Pills (Image 6 Screen 1) */}
        <div className="max-w-2xl mx-auto flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {specialties.map((spec) => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                selectedSpecialty === spec
                  ? "bg-navy-900 text-white shadow-sm"
                  : "bg-white text-slate-600 border border-line hover:bg-cream-100"
              )}
            >
              {spec}
            </button>
          ))}
        </div>
      </header>

      {/* ── Doctor Results List (Image 6 Screen 1) ──────────────────── */}
      <main className="max-w-2xl mx-auto w-full p-4 sm:p-6 space-y-3.5 flex-1">
        {isSearching ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="w-full h-40 rounded-[1.25rem]" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-[1.25rem] border border-line space-y-2">
            <SearchX className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <h3 className="font-display font-bold text-sm text-ink">No Doctors Found</h3>
            <p className="text-xs text-ink-soft">Try searching with another specialty or keyword.</p>
          </div>
        ) : (
          results.map((doctor) => {
            const isFav = favorites.has(doctor.id);
            const clinicName = doctor.clinicName || (doctor.clinicIds?.[0] ? clinicNamesMap[doctor.clinicIds[0]] : 'Remedi Clinic');
            const slots = doctor.availableSlots || ['11:00 AM', '12:00 PM', '6:00 PM'];

            return (
              <div
                key={doctor.id}
                onClick={() => navigate(`/dr/${doctor.profileSlug || doctor.id}`)}
                className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-line shadow-2xs hover:border-navy-500/30 transition-all cursor-pointer group active:scale-[0.99] space-y-3.5"
              >
                {/* Header: Photo, Name, Verified, Distance, Favorite */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-500/20 text-teal-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {doctor.name?.replace(/^Dr\.?\s*/i, '').charAt(0) || 'D'}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-display font-bold text-base text-ink group-hover:text-navy-900 transition-colors">
                          {doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`}
                        </h3>
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                      </div>

                      <p className="text-xs text-slate-500 font-medium">
                        {doctor.qualifications || 'MBBS, MD'} · <span className="text-ink">{doctor.specialty}</span>
                      </p>

                      <p className="text-xs text-ink-soft flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{clinicName}</span>
                      </p>
                    </div>
                  </div>

                  {/* Distance & Heart */}
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <button
                      onClick={(e) => toggleFavorite(doctor.id, e)}
                      className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors cursor-pointer"
                    >
                      <Heart className={cn("w-4 h-4", isFav ? "fill-rose-500 text-rose-500" : "")} />
                    </button>
                    <span className="text-[0.6875rem] font-mono text-slate-400 flex items-center gap-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {doctor.distance || '1.2 km'}
                    </span>
                  </div>
                </div>

                {/* Available Status Pill */}
                <div className="flex items-center gap-2">
                  {doctor.availableToday !== false ? (
                    <span className="px-2.5 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Available Today
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Next Available: Tomorrow
                    </span>
                  )}
                </div>

                {/* Slot Chips & View Profile CTA */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-line/60">
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
                    {slots.map((slot, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-[0.625rem] bg-cream-50 border border-line text-[0.6875rem] font-mono font-semibold text-slate-700 whitespace-nowrap"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>

                  <button
                    onClick={() => navigate(`/dr/${doctor.profileSlug || doctor.id}`)}
                    className="px-3.5 py-1.5 rounded-[0.75rem] bg-amber-500 hover:bg-amber-400 text-navy-950 font-display font-bold text-xs shadow-2xs transition-all active:scale-95 whitespace-nowrap"
                  >
                    View Profile
                  </button>
                </div>

              </div>
            );
          })
        )}
      </main>

      {/* Drawer Menu */}
      <RepDrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userData={user}
      />

      {/* Bottom Nav */}
      <RepBottomNav />
    </div>
  );
}
