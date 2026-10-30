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
  Menu
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
  const [filterCity, setFilterCity] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [clinicNamesMap, setClinicNamesMap] = useState({});

  useEffect(() => {
    let isCancelled = false;
    setIsSearching(true);

    const handler = setTimeout(async () => {
      try {
        // listVisibleDoctors enforces privacy.visibleInSearch == true
        const docs = await listVisibleDoctors({
          city: filterCity || undefined,
          specialty: filterSpecialty || undefined,
        });

        if (isCancelled) return;

        const term = searchTerm.trim().toLowerCase();
        const filtered = docs.filter((d) => {
          if (!d.privacy?.visibleInSearch) return false;
          if (!term) return true;
          const nameMatch = d.name?.toLowerCase().includes(term);
          const specMatch = d.specialty?.toLowerCase().includes(term);
          const cityMatch = d.city?.toLowerCase().includes(term);
          return nameMatch || specMatch || cityMatch;
        });

        // Fetch clinic names for all visible doctors in results
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
    }, 300);

    return () => {
      isCancelled = true;
      clearTimeout(handler);
    };
  }, [searchTerm, filterCity, filterSpecialty]);

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
    <div className="min-h-screen bg-cream-50 flex flex-col font-sans selection:bg-amber-100 selection:text-sand-600 pb-24">
      
      {/* Top Header & Search Bar (Frosted Glass) */}
      <div className="bg-white/85 backdrop-blur-xl border-b border-line/80 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => navigate(-1)} 
                className="p-2 -ml-2 rounded-[0.875rem] hover:bg-slate-100 transition-colors text-ink active:scale-95"
                title="Go back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="p-2 rounded-[0.875rem] hover:bg-slate-100 transition-colors text-ink active:scale-95"
                title="Open menu"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5 text-navy-900" />
              </button>
              <div>
                <h1 className="font-display font-bold text-lg text-ink leading-tight">Find Doctors</h1>
                <p className="font-mono text-[0.625rem] uppercase tracking-wider text-slate-400 font-semibold">
                  Verified Gatepass Specialists
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2.5 rounded-[0.875rem] border transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95",
                showFilters || filterCity || filterSpecialty
                  ? "bg-navy-900 text-white border-navy-900 shadow-xs"
                  : "bg-white text-slate-600 border-line hover:border-slate-300"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Search Pill Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by doctor name, specialty, or city..."
              className="w-full bg-slate-50 border border-slate-200 rounded-[1rem] pl-10 pr-4 py-3 text-xs sm:text-sm font-medium text-ink outline-none focus:border-navy-900 focus:bg-white transition-all placeholder:text-slate-400 shadow-2xs"
            />
          </div>

          {/* Expandable Filter Strip */}
          {showFilters && (
            <div className="pt-2 pb-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5 border-t border-line">
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                <input
                  type="text"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="Filter by city (e.g. Kurnool)"
                  className="w-full bg-cream-50 border border-line rounded-[0.75rem] pl-8 pr-3 py-2 text-xs font-medium text-ink outline-none focus:border-navy-500"
                />
              </div>

              <div className="relative">
                <Stethoscope className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-ink-mute" />
                <input
                  type="text"
                  value={filterSpecialty}
                  onChange={(e) => setFilterSpecialty(e.target.value)}
                  placeholder="Filter by specialty (e.g. Cardiologist)"
                  className="w-full bg-cream-50 border border-line rounded-[0.75rem] pl-8 pr-3 py-2 text-xs font-medium text-ink outline-none focus:border-navy-500"
                />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Results Content */}
      <div className="max-w-2xl w-full mx-auto p-4 sm:p-6 flex-1">
        
        {isSearching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <EdgeCard key={n} edge="navy" className="p-4 bg-white flex items-center gap-4">
                <Skeleton className="w-14 h-14 rounded-[1rem] flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-40 h-4 rounded-[0.5rem]" />
                  <Skeleton className="w-24 h-3 rounded-[0.25rem]" />
                  <Skeleton className="w-32 h-3 rounded-[0.25rem]" />
                </div>
              </EdgeCard>
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-16 h-16 rounded-[1.25rem] bg-white border border-line text-ink-mute flex items-center justify-center mx-auto shadow-sm">
              <SearchX className="w-8 h-8" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink">No Doctors Found</h3>
            <p className="text-xs sm:text-sm text-ink-soft max-w-sm mx-auto">
              We couldn't find any visible specialists matching your search. Try different keywords or clear your filters.
            </p>
            {(searchTerm || filterCity || filterSpecialty) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterCity('');
                  setFilterSpecialty('');
                }}
                className="mt-2 px-4 py-2 bg-white border border-line text-ink rounded-[0.75rem] text-xs font-bold shadow-sm hover:bg-cream-50 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold">
                Specialists ({results.length})
              </span>
            </div>

            {results.map((doctor) => {
              const isOpenNow = isDoctorOpenNow(doctor.repSchedule);
              const responseBucket = formatResponseTimeBucket(doctor.stats);
              const clinicName = doctor.clinicIds?.[0] ? clinicNamesMap[doctor.clinicIds[0]] : null;
              
              const displayName = doctor.privacy?.showFullName !== false 
                ? (doctor.name.startsWith('Dr.') ? doctor.name : `Dr. ${doctor.name}`)
                : `Dr. (${doctor.privacy?.showSpecialty ? doctor.specialty : 'Specialist'})`;

              return (
                <EdgeCard
                  key={doctor.id}
                  edge={isOpenNow ? 'teal' : 'navy'}
                  className="p-4 sm:p-5 bg-white hover:border-navy-500/30 transition-all cursor-pointer group active:scale-[0.99]"
                  onClick={() => navigate(`/dr/${doctor.profileSlug || doctor.id}`)}
                >
                  <div className="flex items-start gap-3.5">
                    
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-[1rem] bg-cream-50 border border-line flex items-center justify-center font-display font-bold text-ink text-base overflow-hidden shadow-sm">
                        {doctor.photoUrl && doctor.privacy?.showFullName !== false ? (
                          <img src={doctor.photoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          getInitials(doctor.name)
                        )}
                      </div>
                      {isOpenNow && (
                        <div className="absolute -top-1 -right-1">
                          <LiveDot active={true} />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-sm sm:text-base text-ink group-hover:text-navy-700 transition-colors truncate">
                          {displayName}
                        </h3>
                        {isOpenNow && (
                          <MonoTag variant="teal">Open Now</MonoTag>
                        )}
                      </div>

                      {/* Specialty & Qualifications */}
                      <p className="text-xs text-ink-soft font-medium mt-0.5 truncate">
                        {doctor.privacy?.showSpecialty !== false ? doctor.specialty : 'Medical Specialist'}
                        {doctor.qualifications && (
                          <span className="text-ink-mute"> · {doctor.qualifications}</span>
                        )}
                      </p>

                      {/* Clinic & City */}
                      <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-ink-mute">
                        {doctor.privacy?.showClinicName !== false && clinicName && (
                          <span className="flex items-center gap-1 font-medium truncate">
                            <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                            {clinicName}
                          </span>
                        )}
                        {doctor.privacy?.showCity !== false && doctor.city && (
                          <span className="flex items-center gap-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            {doctor.city}
                          </span>
                        )}
                      </div>

                      {/* Response Time Bucket Badge (hide until decisionsCount >= 3) */}
                      {responseBucket && (
                        <div className="mt-2.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[0.5rem] bg-navy-100 text-ink text-[0.6875rem] font-medium">
                          <Clock className="w-3 h-3 text-ink-soft" />
                          <span>Usually replies within {responseBucket}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Arrow */}
                    <div className="self-center p-1.5 rounded-[0.5rem] text-ink-mute group-hover:text-ink group-hover:translate-x-0.5 transition-all">
                      <ChevronRight className="w-4 h-4" />
                    </div>

                  </div>
                </EdgeCard>
              );
            })}
          </div>
        )}

      </div>

      {/* Slide-out Mobile Menu Drawer */}
      <RepDrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userData={userData}
      />

      {/* Fixed Rep Bottom Nav */}
      <RepBottomNav />

    </div>
  );
}
