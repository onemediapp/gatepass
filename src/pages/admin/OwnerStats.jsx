/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  Users, 
  Stethoscope, 
  TrendingUp, 
  Building2, 
  MapPin, 
  Phone, 
  Search, 
  Copy, 
  Check, 
  Share2, 
  Calendar, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { subscribeAllDoctorRequests } from '../../lib/db/doctorRequests';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import { formatDateIST } from '../../lib/time';

export default function OwnerStats() {
  const [requests, setRequests] = useState([]);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [totalReps, setTotalReps] = useState(0);
  const [totalAppointments, setTotalAppointments] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    // 1. Subscribe to doctor join requests
    const unsubRequests = subscribeAllDoctorRequests((data) => {
      setRequests(data);
      setLoading(false);
    });

    // 2. Fetch platform counts (doctors, reps, appointments)
    async function fetchPlatformCounts() {
      try {
        const [docsSnap, repsSnap, apptsSnap] = await Promise.all([
          getDocs(collection(db, 'doctors')),
          getDocs(collection(db, 'reps')),
          getDocs(collection(db, 'appointments'))
        ]);
        setTotalDoctors(docsSnap.size);
        setTotalReps(repsSnap.size);
        setTotalAppointments(apptsSnap.size);
      } catch (err) {
        console.warn('Error fetching platform aggregates:', err);
      }
    }

    fetchPlatformCounts();

    return () => unsubRequests();
  }, []);

  // Aggregate doctorRequests by doctorName + city to rank demand
  const aggregatedRequests = useMemo(() => {
    const map = new Map();
    requests.forEach((req) => {
      const key = `${(req.doctorName || '').trim().toLowerCase()}_${(req.city || '').trim().toLowerCase()}`;
      if (!map.has(key)) {
        map.set(key, {
          id: req.id,
          doctorName: req.doctorName,
          clinicName: req.clinicName || 'Private Practice',
          city: req.city || 'Kurnool',
          phone: req.phone || '',
          count: 0,
          latestAt: req.createdAt,
          rawList: []
        });
      }
      const entry = map.get(key);
      entry.count += 1;
      entry.rawList.push(req);
      if (req.phone && !entry.phone) entry.phone = req.phone;
      if (req.createdAt && (!entry.latestAt || (req.createdAt.seconds > entry.latestAt.seconds))) {
        entry.latestAt = req.createdAt;
      }
    });

    const list = Array.from(map.values());
    // Sort descending by request count, then latest
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return aggregatedRequests;
    const q = searchQuery.toLowerCase();
    return aggregatedRequests.filter(
      r => r.doctorName.toLowerCase().includes(q) ||
           r.clinicName.toLowerCase().includes(q) ||
           r.city.toLowerCase().includes(q)
    );
  }, [aggregatedRequests, searchQuery]);

  const handleCopyInvite = (dr) => {
    const text = `Hi Dr. ${dr.doctorName.replace(/^Dr\.?\s*/i, '')}, multiple medical representatives in ${dr.city} are requesting to book visits with you on Gatepass. Claim your free schedule profile at https://gatepass.health/doctor/register`;
    navigator.clipboard.writeText(text);
    setCopiedId(dr.id);
    setTimeout(() => setCopiedId(''), 2500);
  };

  const handleWhatsAppInvite = (dr) => {
    const phone = (dr.phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(`Namaste Dr. ${dr.doctorName.replace(/^Dr\.?\s*/i, '')}, medical representatives in ${dr.city} have requested your clinic on Gatepass to book structured rep visit slots. You can set your visit hours and quotas here: https://gatepass.health/doctor/register`);
    const waUrl = phone ? `https://wa.me/91${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 font-sans">
        <Skeleton className="w-56 h-8 rounded-[0.75rem]" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Skeleton className="h-24 rounded-[1rem]" />
          <Skeleton className="h-24 rounded-[1rem]" />
          <Skeleton className="h-24 rounded-[1rem]" />
          <Skeleton className="h-24 rounded-[1rem]" />
        </div>
        <Skeleton className="w-full h-80 rounded-[1.25rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans selection:bg-amber-100 selection:text-sand-600 space-y-6 pb-20">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink">Platform Pulse & Owner Analytics</h1>
          <MonoTag color="amber" size="xs">Admin View</MonoTag>
        </div>
        <p className="text-xs text-ink-soft">
          Aggregated platform volume and real-time demand for non-participating doctors recommended by medical reps.
        </p>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-[1rem] bg-white border border-line shadow-2xs space-y-1">
          <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-mute font-semibold flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" /> Active Doctors
          </span>
          <p className="text-2xl font-display font-bold text-ink">{totalDoctors}</p>
          <span className="text-[0.625rem] text-teal-600 font-semibold flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3" /> Live profiles
          </span>
        </div>

        <div className="p-4 rounded-[1rem] bg-white border border-line shadow-2xs space-y-1">
          <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-mute font-semibold flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-navy-900" /> Verified Reps
          </span>
          <p className="text-2xl font-display font-bold text-ink">{totalReps}</p>
          <span className="text-[0.625rem] text-ink-mute">Pharma field reps</span>
        </div>

        <div className="p-4 rounded-[1rem] bg-white border border-line shadow-2xs space-y-1">
          <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-mute font-semibold flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-500" /> Total Visits
          </span>
          <p className="text-2xl font-display font-bold text-ink">{totalAppointments}</p>
          <span className="text-[0.625rem] text-ink-mute">All-time bookings</span>
        </div>

        <div className="p-4 rounded-[1rem] bg-white border border-line shadow-2xs space-y-1">
          <span className="font-mono text-[0.625rem] uppercase tracking-wider text-ink-mute font-semibold flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-coral-600" /> Doctor Requests
          </span>
          <p className="text-2xl font-display font-bold text-ink">{requests.length}</p>
          <span className="text-[0.625rem] text-coral-600 font-semibold">{aggregatedRequests.length} unique doctors</span>
        </div>
      </div>

      {/* Community Demand: "Ask a Doctor to Join" Section */}
      <EdgeCard edge="navy" className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
          <div>
            <h2 className="text-base font-display font-bold text-ink">
              Community Doctor Demand Pipeline
            </h2>
            <p className="text-xs text-ink-soft">
              Doctors requested by field reps who are not yet on Gatepass, sorted by demand.
            </p>
          </div>

          <div className="relative min-w-[14rem]">
            <Search className="w-4 h-4 text-ink-mute absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by doctor, clinic, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-[0.75rem] border border-line bg-cream-50 font-mono text-xs text-ink outline-none focus:border-navy-500"
            />
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="py-12 text-center text-ink-mute space-y-2">
            <Stethoscope className="w-8 h-8 mx-auto text-ink-mute/50" />
            <p className="text-xs">No doctor join requests found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((dr, index) => {
              const isCopied = copiedId === dr.id;
              return (
                <div
                  key={dr.id}
                  className="p-4 rounded-[1rem] bg-white border border-line hover:border-line-strong transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-[0.75rem] bg-amber-500/10 text-amber-600 flex items-center justify-center font-display font-bold text-sm flex-shrink-0 mt-0.5">
                      #{index + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display font-bold text-sm text-ink">
                          {dr.doctorName.startsWith('Dr.') ? dr.doctorName : `Dr. ${dr.doctorName}`}
                        </span>
                        <MonoTag color="amber" size="xs">
                          {dr.count} {dr.count === 1 ? 'request' : 'requests'}
                        </MonoTag>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-ink-soft flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-ink-mute" />
                          {dr.clinicName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-ink-mute" />
                          {dr.city}
                        </span>
                        {dr.phone && (
                          <span className="flex items-center gap-1 font-mono text-xs text-ink">
                            <Phone className="w-3 h-3 text-teal-600" />
                            {dr.phone}
                          </span>
                        )}
                        {dr.latestAt && (
                          <span className="text-[0.625rem] text-ink-mute">
                            Last requested: {formatDateIST(dr.latestAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyInvite(dr)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[0.625rem] bg-cream-50 hover:bg-cream-100 text-ink border border-line text-xs font-semibold transition-colors"
                      title="Copy invite text"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-teal-600" /> : <Copy className="w-3.5 h-3.5 text-ink-mute" />}
                      <span>{isCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleWhatsAppInvite(dr)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[0.625rem] bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-xs"
                      title="Invite via WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp Invite</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </EdgeCard>

    </div>
  );
}
