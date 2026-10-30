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
  Menu
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
      
      {/* ── Top Header (Hidden when printing) ────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-line/70 px-4 py-3 sticky top-0 z-30 shadow-2xs print:hidden">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="p-1.5 rounded-[0.75rem] bg-cream-100 hover:bg-cream-200 text-ink text-xs font-semibold active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              title="Open field menu"
              aria-label="Open field menu"
            >
              <Menu className="w-4 h-4 text-navy-900" />
            </button>
            <button
              onClick={() => navigate('/rep/home')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-cream-100 hover:bg-cream-200 text-ink text-xs font-semibold active:scale-95 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.6875rem] text-slate-500 uppercase tracking-wider hidden sm:inline">
              Fieldwork Reporting
            </span>
            <MonoTag variant="navy">DCR Protocol</MonoTag>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
        
        {/* ── Title & Quick Date Picker ───────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:hidden">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-bold text-ink tracking-tight">Daily Call Report (DCR)</h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Verified
              </span>
            </div>
            <p className="text-xs text-ink-soft mt-0.5">
              1-click export of verified doctor calls, discussion topics, and sample logs.
            </p>
          </div>

          {/* Date Selector Pills */}
          <div className="flex items-center gap-2 self-start sm:self-auto bg-white p-1 rounded-[1rem] border border-line shadow-2xs">
            <button
              onClick={() => setSelectedDate(todayDateStr())}
              className={cn(
                "px-3 py-1.5 rounded-[0.75rem] text-xs font-semibold transition-all cursor-pointer",
                isToday 
                  ? "bg-navy-900 text-white font-bold shadow-2xs" 
                  : "text-slate-600 hover:text-ink hover:bg-slate-50"
              )}
            >
              Today
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1 text-xs font-mono font-semibold bg-cream-50 border border-line rounded-[0.625rem] text-ink outline-none focus:border-teal-500 cursor-pointer"
            />
          </div>
        </div>

        {/* ── Executive Header Banner (Printable) ─────────────────────── */}
        <div className="bg-[#0B162C] text-white p-5 sm:p-6 rounded-[1.5rem] shadow-xl relative overflow-hidden border border-white/10 print:bg-white print:text-ink print:border-black print:rounded-none print:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.6875rem] text-amber-300 font-bold uppercase tracking-wider print:text-black">
                  PHARMA FIELDWORK REPORT
                </span>
                <LiveDot color="teal" size="sm" />
              </div>
              <h2 className="text-xl font-display font-bold text-white print:text-black mt-1">
                {dcr.repName}
              </h2>
              <p className="text-xs text-white/80 print:text-slate-600 mt-0.5">
                {dcr.repDesignation} · {dcr.companyName} ({dcr.division})
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6875rem] text-white/60 print:text-slate-500">
                <span>📍 Territory HQ: {dcr.headquarter}</span>
                <span>📅 Date: {dcr.formattedDate}</span>
                {dcr.mobile && <span>📞 {dcr.mobile}</span>}
              </div>
            </div>

            {/* Print Signature Box */}
            <div className="hidden print:block text-right border border-black/30 p-3 rounded-[0.5rem] min-w-[160px]">
              <span className="text-[0.625rem] font-mono uppercase block text-slate-500">Doctor Verification</span>
              <span className="text-xs font-mono font-bold block mt-4">Gatepass Protocol</span>
              <span className="text-[0.625rem] font-mono text-slate-400">Authenticity Hash #GP-2026</span>
            </div>
          </div>

          {/* Quick Metrics Capsule Strip */}
          <div className="mt-5 pt-4 border-t border-white/10 print:border-black/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white/5 print:bg-slate-50 p-3 rounded-[0.875rem] border border-white/10 print:border-slate-200">
              <span className="text-[0.625rem] font-mono uppercase tracking-wider text-white/60 print:text-slate-500 block">
                Total Planned
              </span>
              <span className="text-lg font-mono font-bold text-white print:text-black mt-0.5 block">
                {dcr.metrics.totalCalls} Calls
              </span>
            </div>

            <div className="bg-teal-500/10 print:bg-emerald-50 p-3 rounded-[0.875rem] border border-teal-500/20 print:border-emerald-200">
              <span className="text-[0.625rem] font-mono uppercase tracking-wider text-teal-300 print:text-emerald-700 block">
                Calls Met (Strike Rate)
              </span>
              <span className="text-lg font-mono font-bold text-teal-300 print:text-emerald-800 mt-0.5 block">
                {dcr.metrics.metCount} ({dcr.metrics.strikeRate}%)
              </span>
            </div>

            <div className="bg-white/5 print:bg-slate-50 p-3 rounded-[0.875rem] border border-white/10 print:border-slate-200">
              <span className="text-[0.625rem] font-mono uppercase tracking-wider text-white/60 print:text-slate-500 block">
                Samples Delivered
              </span>
              <span className="text-lg font-mono font-bold text-white print:text-black mt-0.5 block">
                {dcr.metrics.samplesCount} Clinics
              </span>
            </div>

            <div className="bg-white/5 print:bg-slate-50 p-3 rounded-[0.875rem] border border-white/10 print:border-slate-200">
              <span className="text-[0.625rem] font-mono uppercase tracking-wider text-white/60 print:text-slate-500 block">
                Joint Fieldwork
              </span>
              <span className="text-lg font-mono font-bold text-white print:text-black mt-0.5 block">
                {dcr.metrics.accompaniedCount} Calls (+1)
              </span>
            </div>
          </div>
        </div>

        {/* ── 1-Click Action Bar (Export to Excel / PDF / WhatsApp) ──── */}
        <div className="flex flex-wrap items-center gap-2.5 print:hidden">
          <button
            onClick={handleDownloadCsv}
            disabled={dcr.calls.length === 0}
            className="flex-1 min-w-[160px] py-3 px-4 bg-navy-900 hover:bg-navy-800 disabled:opacity-40 text-white rounded-[0.875rem] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Download CSV (Excel)</span>
          </button>

          <button
            onClick={handleShare}
            disabled={dcr.calls.length === 0}
            className="flex-1 min-w-[150px] py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-[0.875rem] text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-white" />
            <span>Share to WhatsApp</span>
          </button>

          <button
            onClick={handleCopy}
            className="py-3 px-4 bg-white hover:bg-slate-50 border border-line text-ink rounded-[0.875rem] text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-teal-600" />
                <span className="text-teal-700 font-bold">Copied Text</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Summary</span>
              </>
            )}
          </button>

          <button
            onClick={handlePrint}
            className="py-3 px-3.5 bg-white hover:bg-slate-50 border border-line text-ink rounded-[0.875rem] text-xs font-semibold flex items-center justify-center transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Print Call Sheet"
          >
            <Printer className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        {/* ── Doctor Calls Log (Detailed Table / Stream) ─────────────── */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="font-display font-bold text-base text-ink">
              Doctor Detailing Log ({dcr.calls.length})
            </h3>
            <span className="text-[0.6875rem] font-mono text-slate-400">
              Verified by Gatepass Protocol
            </span>
          </div>

          {dcr.calls.length === 0 ? (
            <div className="bg-white rounded-[1.25rem] p-10 text-center border border-line shadow-card text-ink-soft space-y-2">
              <FileText className="w-8 h-8 text-slate-300 mx-auto" />
              <h4 className="font-bold text-ink text-sm">No Doctor Visits on {dcr.formattedDate}</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Appointments requested or approved on this date will automatically compile into your verified DCR.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {dcr.calls.map((call) => (
                <EdgeCard
                  key={call.appointmentId}
                  edge={call.outcome === 'met' ? 'teal' : call.status.includes('CANCEL') ? 'coral' : 'navy'}
                  className="p-4 sm:p-5 shadow-card"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line/70 pb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-[0.75rem] bg-navy-900 text-amber-400 font-display font-bold text-sm flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                        #{call.callIndex}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-display font-bold text-base text-ink">
                            {call.doctorName}
                          </h4>
                          <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                            {call.specialty}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{call.clinicName} · {call.city}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 justify-between sm:justify-end">
                      <div className="text-left sm:text-right font-mono">
                        <span className="text-[0.6875rem] text-slate-400 block uppercase">Scheduled</span>
                        <span className="text-xs font-bold text-ink">{call.slotWindow}</span>
                      </div>
                      <div className="bg-teal-50 text-teal-900 font-mono text-xs font-bold px-3 py-1.5 rounded-[0.625rem] border border-teal-600/30 shadow-2xs">
                        {call.token}
                      </div>
                    </div>
                  </div>

                  {/* Detailing Details */}
                  <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[0.6875rem] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                        Products Detailed
                      </span>
                      <p className="font-medium text-ink bg-cream-50/80 p-2.5 rounded-[0.625rem] border border-line">
                        "{call.productsDetailed}"
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[0.6875rem] font-mono uppercase text-slate-400">Samples restocked:</span>
                        <span className={cn(
                          "font-mono font-bold px-2 py-0.5 rounded-full text-[0.6875rem]",
                          call.samplesProvided.startsWith('YES') ? "bg-teal-50 text-teal-800" : "bg-slate-100 text-slate-600"
                        )}>
                          {call.samplesProvided}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[0.6875rem] font-mono uppercase text-slate-400">Time in cabin:</span>
                        <span className="font-mono font-bold text-ink">
                          {call.calledInTime}
                        </span>
                      </div>

                      {call.accompaniment !== 'Solo' && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[0.6875rem] font-mono uppercase text-slate-400">Joint detailing:</span>
                          <span className="font-mono font-semibold text-navy-900 bg-navy-100 px-2 py-0.5 rounded-full">
                            {call.accompaniment}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </EdgeCard>
              ))}
            </div>
          )}
        </section>

      </main>

      <div className="print:hidden">
        <RepDrawerMenu
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          repProfile={repProfile}
          userData={userData}
        />
        <RepBottomNav />
      </div>
    </div>
  );
}
