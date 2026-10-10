/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { subscribeDoctorAppointments } from '../../lib/db/appointments';
import { listDoctorRepLinks } from '../../lib/db/doctorRepLinks';
import { subscribeDoctorRepRelations, setRepRelation, updateRepRelation } from '../../lib/db/repRelations';
import { useAuth } from '../../lib/auth';
import { 
  Users, 
  Search, 
  Star, 
  Ban, 
  FileText, 
  Download, 
  Filter, 
  ChevronDown, 
  Building2, 
  Tag, 
  AlertTriangle, 
  CheckCircle2, 
  Edit3,
  X,
  Check
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import { cn } from '../../lib/utils';

export default function DoctorReps() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [relations, setRelations] = useState({});
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('reliable'); // 'reliable' | 'recent'

  // Notes Modal State
  const [editingNotesRep, setEditingNotesRep] = useState(null);
  const [notesInput, setNotesInput] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (!user) return;

    // 1. Rep Relations (preferred, blocked, met, no-show, notes)
    const unsubRels = subscribeDoctorRepRelations(user.uid, (list) => {
      const map = {};
      list.forEach((r) => { map[r.repId] = r; });
      setRelations(map);
    });

    // 2. Doctor Appointments (for rep snapshot, visit history, latest visit)
    const unsubAppts = subscribeDoctorAppointments(user.uid, (list) => {
      setAppointments(list);
      setLoading(false);
    });

    return () => {
      unsubRels();
      unsubAppts();
    };
  }, [user]);

  // Aggregate Reps Network from appointments & relations
  const repsList = useMemo(() => {
    const repMap = new Map();

    // From appointments
    appointments.forEach((appt) => {
      const repId = appt.repId;
      if (!repId) return;

      if (!repMap.has(repId)) {
        repMap.set(repId, {
          repId,
          name: appt.repSnapshot?.name || 'Representative',
          company: appt.repSnapshot?.company || 'Pharma',
          designation: appt.repSnapshot?.designation || '',
          therapeuticCategory: appt.therapeuticCategory || appt.repSnapshot?.therapeuticCategory || '',
          lastVisit: appt.slotDate || '',
          totalRequests: 1,
        });
      } else {
        const item = repMap.get(repId);
        item.totalRequests += 1;
        if (appt.slotDate && (!item.lastVisit || appt.slotDate > item.lastVisit)) {
          item.lastVisit = appt.slotDate;
        }
      }
    });

    // Combine with relations
    return Array.from(repMap.values()).map((rep) => {
      const rel = relations[rep.repId] || {};
      return {
        ...rep,
        preferred: Boolean(rel.preferred),
        blocked: Boolean(rel.blocked),
        metCount: rel.metCount || 0,
        noShowCount: rel.noShowCount || 0,
        notes: rel.notes || '',
      };
    });
  }, [appointments, relations]);

  // Extract unique companies & categories for filter dropdowns
  const { companies, categories } = useMemo(() => {
    const comps = new Set();
    const cats = new Set();
    repsList.forEach((r) => {
      if (r.company) comps.add(r.company);
      if (r.therapeuticCategory) cats.add(r.therapeuticCategory);
    });
    return {
      companies: Array.from(comps).sort(),
      categories: Array.from(cats).sort(),
    };
  }, [repsList]);

  // Filtered & Sorted Reps
  const processedReps = useMemo(() => {
    return repsList
      .filter((r) => {
        // Search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchName = r.name.toLowerCase().includes(term);
          const matchComp = r.company.toLowerCase().includes(term);
          if (!matchName && !matchComp) return false;
        }
        // Company filter
        if (selectedCompany && r.company !== selectedCompany) return false;
        // Category filter
        if (selectedCategory && r.therapeuticCategory !== selectedCategory) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'reliable') {
          // Most reliable: highest met, lowest no-show
          const scoreA = a.metCount - a.noShowCount * 2;
          const scoreB = b.metCount - b.noShowCount * 2;
          return scoreB - scoreA;
        }
        // Most recent
        return (b.lastVisit || '').localeCompare(a.lastVisit || '');
      });
  }, [repsList, searchTerm, selectedCompany, selectedCategory, sortBy]);

  // Actions
  const handleTogglePreferred = async (rep) => {
    if (!user) return;
    try {
      await setRepRelation(user.uid, rep.repId, { preferred: !rep.preferred });
    } catch (err) {
      console.error('Error toggling preferred:', err);
    }
  };

  const handleToggleBlocked = async (rep) => {
    if (!user) return;
    try {
      await setRepRelation(user.uid, rep.repId, { blocked: !rep.blocked, preferred: false });
    } catch (err) {
      console.error('Error toggling blocked:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!user || !editingNotesRep) return;
    setSavingNotes(true);
    try {
      await setRepRelation(user.uid, editingNotesRep.repId, { notes: notesInput.trim() });
      setEditingNotesRep(null);
      setNotesInput('');
    } catch (err) {
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  // CSV Export Generator
  const handleExportCSV = () => {
    if (processedReps.length === 0) return;

    const headers = [
      'Name',
      'Company',
      'Designation',
      'Category',
      'Last Visit',
      'Met Count',
      'No-Show Count',
      'Preferred',
      'Blocked',
      'Private Notes'
    ];

    const escapeCSV = (str) => `"${String(str || '').replace(/"/g, '""')}"`;

    const rows = processedReps.map((r) => [
      escapeCSV(r.name),
      escapeCSV(r.company),
      escapeCSV(r.designation),
      escapeCSV(r.therapeuticCategory),
      escapeCSV(r.lastVisit),
      r.metCount,
      r.noShowCount,
      r.preferred ? 'Yes' : 'No',
      r.blocked ? 'Yes' : 'No',
      escapeCSV(r.notes),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `gatepass-reps-${user.uid.slice(0, 6)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-36 rounded-card" />
        <Skeleton className="w-full h-36 rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 font-sans selection:bg-amber-100 selection:text-sand-600">
      
      {/* ── Top Header & CSV Export ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">My Reps</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            {repsList.length} medical representative{repsList.length !== 1 ? 's' : ''} in your clinic directory
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-line hover:bg-cream-50 text-ink rounded-[0.875rem] text-xs font-semibold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-ink-mute" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* ── Search & Filter Controls ────────────────────────────────── */}
      <div className="bg-white rounded-card p-4 border border-line shadow-card space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 bg-cream-50 rounded-[0.75rem] border border-line">
          <Search className="w-4 h-4 text-ink-mute shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search representatives by name or company…"
            className="w-full bg-transparent border-none outline-none text-xs text-ink placeholder:text-ink-mute"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="p-0.5 text-ink-mute hover:text-ink">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Company filter */}
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-3 py-1.5 rounded-[0.625rem] bg-cream-50 border border-line text-ink text-xs outline-none"
          >
            <option value="">All Companies</option>
            {companies.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-[0.625rem] bg-cream-50 border border-line text-ink text-xs outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Sort By */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-ink-soft">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1 rounded-[0.625rem] bg-cream-50 border border-line text-ink text-xs font-semibold outline-none"
            >
              <option value="reliable">Most Reliable</option>
              <option value="recent">Most Recent</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Reps Grid ───────────────────────────────────────────────── */}
      {processedReps.length === 0 ? (
        <div className="bg-white rounded-card p-12 text-center border border-line shadow-card max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-[1.25rem] bg-navy-100 text-navy-900 flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-ink-mute" />
          </div>
          <h2 className="text-base font-display font-bold text-ink mb-1">No representatives found</h2>
          <p className="text-xs text-ink-soft max-w-xs mx-auto">
            {searchTerm || selectedCompany || selectedCategory
              ? 'Try adjusting your search filters.'
              : 'Medical representatives who book slots with you will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {processedReps.map((rep) => {
            return (
              <EdgeCard
                key={rep.repId}
                edge={rep.blocked ? 'coral' : rep.preferred ? 'amber' : 'navy'}
                className="p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Header Row: Rep & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-display font-bold text-ink truncate">
                          {rep.name}
                        </h3>
                        {rep.preferred && (
                          <span className="p-0.5 text-amber-500" title="Preferred">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                          </span>
                        )}
                        {rep.blocked && (
                          <span className="px-1.5 py-0.5 rounded-full bg-coral-50 text-coral-600 text-[0.625rem] font-bold">
                            Blocked
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-soft truncate">
                        {rep.company} {rep.designation ? `· ${rep.designation}` : ''}
                      </p>
                    </div>

                    {rep.therapeuticCategory && (
                      <span className="px-2 py-0.5 rounded-[0.5rem] bg-navy-100 text-navy-900 font-mono text-[0.625rem] font-semibold shrink-0">
                        {rep.therapeuticCategory}
                      </span>
                    )}
                  </div>

                  {/* Visit Counts & Stats */}
                  <div className="flex flex-wrap items-center gap-2 py-2 text-xs border-y border-line my-3">
                    <span className="inline-flex items-center gap-1 font-semibold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-[0.5rem]">
                      <CheckCircle2 className="w-3 h-3" /> {rep.metCount} Met
                    </span>

                    {rep.noShowCount > 0 && (
                      <span className="inline-flex items-center gap-1 font-semibold text-coral-600 bg-coral-50 px-2 py-0.5 rounded-[0.5rem]">
                        <AlertTriangle className="w-3 h-3" /> {rep.noShowCount} No-show
                      </span>
                    )}

                    <span className="text-ink-mute text-[0.6875rem] ml-auto">
                      Last: {rep.lastVisit || 'None'}
                    </span>
                  </div>

                  {/* Private Notes */}
                  {rep.notes && (
                    <div className="p-2.5 rounded-[0.625rem] bg-cream-50 border border-line text-xs text-ink-soft mb-3 italic">
                      "{rep.notes}"
                    </div>
                  )}
                </div>

                {/* Footer Action CTAs */}
                <div className="flex items-center justify-between pt-2 border-t border-line/60">
                  <button
                    onClick={() => {
                      setEditingNotesRep(rep);
                      setNotesInput(rep.notes || '');
                    }}
                    className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-ink font-medium transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{rep.notes ? 'Edit Note' : 'Add Note'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePreferred(rep)}
                      className={cn(
                        'p-2 rounded-[0.75rem] transition-colors',
                        rep.preferred
                          ? 'text-amber-500 bg-amber-100'
                          : 'text-ink-mute hover:bg-cream-50 hover:text-ink'
                      )}
                      title={rep.preferred ? 'Remove preferred' : 'Mark preferred'}
                    >
                      <Star className={cn('w-4 h-4', rep.preferred ? 'fill-amber-500' : '')} />
                    </button>

                    <button
                      onClick={() => handleToggleBlocked(rep)}
                      className={cn(
                        'p-2 rounded-[0.75rem] transition-colors',
                        rep.blocked
                          ? 'text-coral-600 bg-coral-100'
                          : 'text-ink-mute hover:bg-coral-50 hover:text-coral-600'
                      )}
                      title={rep.blocked ? 'Unblock rep' : 'Silently block rep'}
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </EdgeCard>
            );
          })}
        </div>
      )}

      {/* ── Notes Editor Modal ───────────────────────────────────────── */}
      {editingNotesRep && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-sm w-full space-y-4 shadow-card border border-line animate-in fade-in zoom-in-95">
            <h3 className="text-base font-display font-bold text-ink">
              Private Note · {editingNotesRep.name}
            </h3>
            <p className="text-xs text-ink-soft">
              This note is private to you and never visible to the representative.
            </p>

            <textarea
              value={notesInput}
              onChange={(e) => setNotesInput(e.target.value)}
              placeholder="e.g. Always bring product monograph for cardiology formulations…"
              rows={3}
              maxLength={300}
              className="w-full text-xs p-3 rounded-[0.75rem] border border-line focus:outline-none focus:ring-1 focus:ring-navy-900 resize-none"
            />

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setEditingNotesRep(null)}
                className="py-2.5 bg-cream-50 text-ink rounded-[0.875rem] text-xs font-semibold hover:bg-line"
              >
                Cancel
              </button>
              <button
                disabled={savingNotes}
                onClick={handleSaveNotes}
                className="py-2.5 bg-navy-900 text-white rounded-[0.875rem] text-xs font-semibold hover:bg-navy-700"
              >
                {savingNotes ? 'Saving…' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
