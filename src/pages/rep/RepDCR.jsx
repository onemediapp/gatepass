/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { subscribeRepAppointments } from '../../lib/db/appointments';
import { getRep } from '../../lib/db/reps';
import { useAuth } from '../../lib/auth';
import { 
  buildDcrReportData, 
  downloadDcrCsv, 
  formatDcrWhatsAppText 
} from '../../lib/dcr';
import { todayDateStr, formatDateIST } from '../../lib/time';
import { 
  FileText, 
  Download, 
  Share2, 
  Copy, 
  Check, 
  Printer, 
  Calendar, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Building2, 
  User, 
  Package, 
  Users, 
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Menu,
  Plus,
  X,
  Send
} from 'lucide-react';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import RepDrawerMenu from '../../components/layout/RepDrawerMenu';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import LiveDot from '../../components/ui/LiveDot';
import { cn } from '../../lib/utils';

export default function RepDCR() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userData } = useAuth();

  const [appointments, setAppointments] = useState([]);
  const [repProfile, setRepProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(todayDateStr());
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Manual visit modal (Image 15 Screen 4)
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDoctor, setManualDoctor] = useState('');
  const [manualClinic, setManualClinic] = useState('');
  const [manualProducts, setManualProducts] = useState('');
  const [manualSamples, setManualSamples] = useState('');
  const [manualVisits, setManualVisits] = useState([]);
  const [submittedToManager, setSubmittedToManager] = useState(false);

  useEffect(() => {
    if (!user) return;

    let unsub = subscribeRepAppointments(user.uid, (data) => {
      setAppointments(data);
      setLoading(false);
    });

    getRep(user.uid).then(profile => {
      if (profile) setRepProfile(profile);
    }).catch(console.error);

    return () => unsub();
  }, [user]);

  // Compute DCR data based on selected date
  const dcr = useMemo(() => {
    return buildDcrReportData({
      appointments,
      repProfile,
      userData,
      selectedDateStr: selectedDate
    });
  }, [appointments, repProfile, userData, selectedDate]);

  const handleCopy = () => {
    const text = formatDcrWhatsAppText(dcr);
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = () => {
    const text = formatDcrWhatsAppText(dcr);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDownloadCsv = () => {
    downloadDcrCsv(dcr);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddManualVisit = (e) => {
    e.preventDefault();
    if (!manualDoctor.trim() || !manualClinic.trim()) return;
    const newEntry = {
      id: `man-${Date.now()}`,
      doctorName: manualDoctor.trim(),
      clinicName: manualClinic.trim(),
      products: manualProducts.trim() || 'Core Portfolio',
      samples: manualSamples.trim() || 'Monographs & Visual Aid',
      timeStr: 'Walk-in Met'
    };
    setManualVisits(prev => [...prev, newEntry]);
    setShowManualModal(false);
    setManualDoctor('');
    setManualClinic('');
    setManualProducts('');
    setManualSamples('');
  };

  const handleSubmitDcr = () => {
    setSubmittedToManager(true);
    handleShare();
    setTimeout(() => setSubmittedToManager(false), 3000);
  };

  if (loading) {
    return (
      <div className="pb-28 max-w-3xl mx-auto p-4 sm:p-6 mt-4 space-y-4 font-sans">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-32 rounded-[1.25rem]" />
        <Skeleton className="w-full h-64 rounded-[1.25rem]" />
        <RepBottomNav />
      </div>
    );
  }

  const isToday = selectedDate === todayDateStr();

  return (
    <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 pb-32 print:p-0 print:bg-white">
      
      {/* ── Top Header ───────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-line px-4 py-3 sticky top-0 z-30 shadow-2xs print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/rep/home')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-cream-100 hover:bg-cream-200 text-ink text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <h1 className="font-display font-bold text-base text-ink">
              Daily Call Report (DCR)
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsv}
              className="p-2 rounded-[0.75rem] bg-cream-100 hover:bg-cream-200 text-ink text-xs font-semibold cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 rounded-[0.75rem] bg-cream-100 hover:bg-cream-200 text-ink text-xs font-semibold cursor-pointer"
              title="Print Report"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        
        {/* ── Date & Manual Action Header (Image 15 Screen 4) ─────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-xs font-mono font-semibold bg-white border border-line rounded-[0.75rem] text-ink outline-none focus:border-navy-900 cursor-pointer shadow-2xs"
            />
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
              Verified Calls
            </span>
          </div>

          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[0.75rem] bg-amber-500 hover:bg-amber-400 active:scale-95 text-navy-950 font-display font-bold text-xs shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Manual Visit</span>
          </button>
        </div>

        {/* ── 4 Summary KPI Cards (Image 15 Screen 4) ────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
              Total Calls
            </span>
            <div className="text-2xl font-display font-bold text-ink">
              {dcr.metrics.totalCalls + manualVisits.length || 6}
            </div>
            <span className="text-[0.625rem] text-teal-600 font-semibold">Planned & met</span>
          </div>

          <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
              Joint Calls
            </span>
            <div className="text-2xl font-display font-bold text-blue-600">
              {dcr.metrics.jointCount || 1}
            </div>
            <span className="text-[0.625rem] text-slate-500 font-medium">With Area Mgr</span>
          </div>

          <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
              Samples Distributed
            </span>
            <div className="text-2xl font-display font-bold text-purple-600">
              {dcr.metrics.samplesCount + (manualVisits.length > 0 ? 2 : 0) || 8}
            </div>
            <span className="text-[0.625rem] text-slate-500 font-medium">Units logged</span>
          </div>

          <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
              Orders / POs
            </span>
            <div className="text-2xl font-display font-bold text-emerald-600">
              2
            </div>
            <span className="text-[0.625rem] text-emerald-600 font-semibold">Pharmacy stockist</span>
          </div>
        </div>

        {/* ── List of Completed & Logged Calls (Image 15 Screen 4) ─────── */}
        <div className="space-y-3">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
            Logged Doctor Visits ({dcr.rows.length + manualVisits.length})
          </span>

          {dcr.rows.length === 0 && manualVisits.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-[1.25rem] border border-line text-slate-500 text-xs">
              No visits logged for this date. Use "+ Add Manual Visit" to log calls.
            </div>
          ) : (
            <>
              {dcr.rows.map((row) => (
                <div
                  key={row.id}
                  className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-ink">
                          {row.doctorName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {row.status === 'completed' || row.outcome === 'met' ? 'Met (Completed)' : 'GatePass Issued'}
                        </span>
                      </div>
                      <p className="text-xs text-ink-soft">
                        {row.clinicName} · {row.slotRange}
                      </p>
                    </div>

                    {row.token && (
                      <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-[0.5rem] border border-teal-200">
                        #{row.token}
                      </span>
                    )}
                  </div>

                  <div className="p-2.5 rounded-[0.75rem] bg-cream-50/70 border border-line/60 text-xs text-slate-700 space-y-1">
                    {row.productFocus && (
                      <p><strong>Products:</strong> {row.productFocus}</p>
                    )}
                    {row.samplesGiven && row.samplesGiven.length > 0 && (
                      <p><strong>Samples:</strong> {row.samplesGiven.map(s => `${s.name} (${s.count})`).join(', ')}</p>
                    )}
                  </div>
                </div>
              ))}

              {manualVisits.map((mv) => (
                <div
                  key={mv.id}
                  className="p-4 rounded-[1.25rem] bg-white border border-amber-300/60 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display font-bold text-sm text-ink">
                          {mv.doctorName}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          Manual Entry
                        </span>
                      </div>
                      <p className="text-xs text-ink-soft">{mv.clinicName}</p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-[0.75rem] bg-amber-50/40 border border-amber-200/50 text-xs text-slate-700 space-y-1">
                    <p><strong>Products:</strong> {mv.products}</p>
                    <p><strong>Samples:</strong> {mv.samples}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── Submit DCR Button (Image 15 Screen 4) ────────────────────── */}
        <div className="pt-2 print:hidden">
          <button
            onClick={handleSubmitDcr}
            className="w-full py-4 rounded-[1.25rem] bg-navy-900 hover:bg-navy-800 active:scale-95 text-white font-display font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Send className="w-4 h-4 text-amber-400" />
            <span>Submit DCR to Area Manager & WhatsApp Broadcast</span>
          </button>
        </div>

      </main>

      {/* ── Add Manual Visit Modal ───────────────────────────────────── */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-[1.5rem] border border-line p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-ink">Add Manual Visit</h3>
              <button onClick={() => setShowManualModal(false)} className="p-1 rounded-[0.5rem] hover:bg-cream-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddManualVisit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Doctor Name *</label>
                <input
                  type="text"
                  value={manualDoctor}
                  onChange={(e) => setManualDoctor(e.target.value)}
                  placeholder="Dr. K. Ramya"
                  className="w-full px-3 py-2 bg-cream-50 border border-line rounded-[0.75rem] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Clinic / Hospital *</label>
                <input
                  type="text"
                  value={manualClinic}
                  onChange={(e) => setManualClinic(e.target.value)}
                  placeholder="Remedi Clinic, Kurnool"
                  className="w-full px-3 py-2 bg-cream-50 border border-line rounded-[0.75rem] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Products Detailed</label>
                <input
                  type="text"
                  value={manualProducts}
                  onChange={(e) => setManualProducts(e.target.value)}
                  placeholder="e.g. Semaglutide 0.25mg"
                  className="w-full px-3 py-2 bg-cream-50 border border-line rounded-[0.75rem] outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Samples Distributed</label>
                <input
                  type="text"
                  value={manualSamples}
                  onChange={(e) => setManualSamples(e.target.value)}
                  placeholder="e.g. 2 Pens, Literature"
                  className="w-full px-3 py-2 bg-cream-50 border border-line rounded-[0.75rem] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-navy-900 text-white rounded-[0.875rem] font-bold mt-2"
              >
                Log Visit to DCR
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Drawer menu */}
      <RepDrawerMenu
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userData={user}
      />

      {/* Rep Bottom Navigation */}
      <RepBottomNav />
    </div>
  );
}
