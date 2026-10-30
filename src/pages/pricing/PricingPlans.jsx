/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Building2, 
  Briefcase, 
  Check, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  FileText, 
  Users, 
  QrCode, 
  Share2, 
  Star,
  ChevronLeft,
  HelpCircle,
  TrendingUp,
  Zap
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import LiveDot from '../../components/ui/LiveDot';
import { cn } from '../../lib/utils';

export default function PricingPlans() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [activeSegment, setActiveSegment] = useState('both'); // 'both' | 'clinic' | 'pharma'

  return (
    <div className="min-h-screen bg-cream-50 font-sans selection:bg-amber-100 selection:text-sand-600 pb-28">
      
      {/* ── Top Header Bar ───────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-line/70 px-4 sm:px-6 py-3.5 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-cream-100 hover:bg-cream-200 text-ink text-xs font-semibold active:scale-95 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.6875rem] text-slate-500 uppercase tracking-wider hidden sm:inline">
              SaaS Monetization
            </span>
            <MonoTag variant="navy">Gatepass Plans</MonoTag>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-8 space-y-10">
        
        {/* ── Hero Heading ────────────────────────────────────────────── */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Enterprise-Grade Detailing Infrastructure</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-ink tracking-tight">
            Predictable Detailing. Zero Lobby Waiting.
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft leading-relaxed">
            Transparent subscription models tailored for independent specialty clinics and enterprise pharmaceutical field sales forces.
          </p>

          {/* Billing Cycle Switch */}
          <div className="pt-2 flex items-center justify-center gap-3">
            <span className={cn("text-xs font-semibold", billingCycle === 'monthly' ? "text-ink" : "text-slate-400")}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(b => b === 'monthly' ? 'annual' : 'monthly')}
              className="w-12 h-6 bg-navy-900 rounded-full p-0.5 transition-colors relative cursor-pointer"
            >
              <div className={cn(
                "w-5 h-5 rounded-full bg-amber-400 transition-transform shadow-sm",
                billingCycle === 'annual' ? "translate-x-6" : "translate-x-0"
              )} />
            </button>
            <span className={cn("text-xs font-semibold flex items-center gap-1", billingCycle === 'annual' ? "text-ink" : "text-slate-400")}>
              <span>Annual</span>
              <span className="text-[0.625rem] font-mono font-bold bg-teal-50 text-teal-800 px-1.5 py-0.5 rounded-full border border-teal-200">
                Save 17%
              </span>
            </span>
          </div>
        </div>

        {/* ── Plans Grid (Clinic Pro vs Pharma Enterprise) ─────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-stretch">
          
          {/* Card 1: B2B Clinic Pro */}
          <div className="bg-white border-2 border-line hover:border-navy-900/30 rounded-[1.75rem] p-6 sm:p-8 flex flex-col justify-between shadow-card transition-all relative overflow-hidden group">
            <div className="space-y-6">
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200 inline-block">
                    For Medical Clinics
                  </span>
                  <h3 className="text-2xl font-display font-bold text-ink mt-2">
                    Clinic Pro
                  </h3>
                  <p className="text-xs text-ink-soft mt-1">
                    Eliminate waiting room chaos and empower your reception staff with flight-ops detailing control.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-[1rem] bg-navy-100 text-navy-900 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Building2 className="w-6 h-6 text-navy-800" />
                </div>
              </div>

              {/* Price */}
              <div className="border-y border-line/70 py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-display font-bold text-ink">
                    ₹{billingCycle === 'monthly' ? '1,499' : '1,249'}
                  </span>
                  <span className="text-xs text-ink-mute font-mono">
                    / clinic / month
                  </span>
                </div>
                <p className="text-[0.6875rem] text-slate-500 font-mono mt-1">
                  {billingCycle === 'annual' ? 'Billed annually (₹14,999/yr)' : 'Billed monthly · Cancel anytime'}
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 text-xs">
                <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-400 font-bold block">
                  Included Clinic Superpowers:
                </span>

                {[
                  'Dedicated Reception Counter Kiosk terminal (iPad / Android / PC)',
                  'Staff Delegation PIN (Receptionist approves & calls in without doctor login)',
                  'Real-Time WhatsApp Delay Broadcasts & Cabin Call-In Alerts',
                  'Multi-Specialist Doctor Scheduling within the same clinic',
                  'Custom Acrylic Reception Desk Stand with Laser QR Branding',
                  'Cryptographic Anti-Fraud Token Verification (Zero Fake Passes)',
                  'Audit-Ready Medical Representative Visit Logs'
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-teal-50 text-teal-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-teal-600 stroke-[3]" />
                    </div>
                    <span className="text-ink font-medium leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>

            </div>

            <div className="pt-8">
              <button
                onClick={() => alert('Remedi Clinic Kurnool is enrolled in the pilot program! To manage clinic subscription, contact support@gatepass.health')}
                className="w-full py-3.5 px-6 bg-navy-900 hover:bg-navy-800 text-white rounded-[1rem] font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
              >
                <span>Activate Remedi Clinic Pro</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Card 2: Pharma Enterprise Licenses */}
          <div className="bg-[#0B162C] text-white border-2 border-amber-500/40 rounded-[1.75rem] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
            {/* Ambient gold glow */}
            <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-6 relative z-10">
              
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-full border border-amber-500/30 inline-block">
                    CORE REVENUE DRIVER · ENTERPRISE
                  </span>
                  <h3 className="text-2xl font-display font-bold text-white mt-2">
                    Pharma Enterprise
                  </h3>
                  <p className="text-xs text-white/70 mt-1">
                    Guaranteed, verified detailing access for field representatives. Eliminate fake call reports and save 1–2 hours of paperwork nightly.
                  </p>
                </div>
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-amber-400 to-amber-600 text-navy-950 flex items-center justify-center flex-shrink-0 shadow-lg font-bold">
                  <Briefcase className="w-6 h-6" />
                </div>
              </div>

              {/* Price */}
              <div className="border-y border-white/10 py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-display font-bold text-white">
                    ₹{billingCycle === 'monthly' ? '499' : '399'}
                  </span>
                  <span className="text-xs text-white/60 font-mono">
                    / representative / month
                  </span>
                </div>
                <p className="text-[0.6875rem] text-amber-300 font-mono mt-1">
                  Corporate billing (Sun Pharma, Cipla, Torrent, Dr. Reddy's)
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 text-xs">
                <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-amber-300/80 font-bold block">
                  Representative & Enterprise Benefits:
                </span>

                {[
                  'Guaranteed Zero-Wait Detailing Protocol (Eliminate 2-3 hr lobby waits)',
                  '1-Click Automated DCR Generator (Export verified calls to Excel/CSV/PDF)',
                  'Cryptographic Call Verification (Prevents bogus DCR entries)',
                  'Real-Time Cabin Call-In and Delay WhatsApp Notifications',
                  'Territory Route Planner for Kurnool & Neighboring Health Hubs',
                  'Digital Monograph & Starter Sample Delivery Logging',
                  'Manager Joint Fieldwork Tagging (+1 Regional/Area Manager)'
                ].map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-amber-400 text-navy-950 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span className="text-white/90 font-medium leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>

            </div>

            <div className="pt-8 relative z-10">
              <button
                onClick={() => window.open('https://wa.me/919876543210?text=Hello%20Gatepass%20Team%2C%20we%20are%20interested%20in%20Pharma%20Enterprise%20Licenses%20for%20our%20medical%20representatives.', '_blank')}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-400 text-navy-950 rounded-[1rem] font-display font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/25 active:scale-98 cursor-pointer"
              >
                <span>Request Corporate Pharma Pilot</span>
                <ArrowRight className="w-4 h-4 text-navy-950" />
              </button>
            </div>
          </div>

        </div>

        {/* ── Enterprise ROI Comparison ───────────────────────────────── */}
        <section className="bg-white rounded-[1.75rem] border border-line p-6 sm:p-8 space-y-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-lg text-ink">
                Measurable ROI on First Month
              </h3>
              <p className="text-xs text-ink-soft mt-0.5">
                Why both clinics and pharma companies achieve over 10x payback on Gatepass.
              </p>
            </div>
            <MonoTag variant="teal">Economic Analysis</MonoTag>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="bg-cream-50 p-5 rounded-[1.25rem] border border-line space-y-3">
              <span className="font-mono text-xs font-bold text-teal-800 uppercase block">
                🏥 Clinic Impact
              </span>
              <ul className="text-xs text-slate-700 space-y-2">
                <li>• <strong>100% Patient Protection</strong>: Patient waiting rooms free of crowding and standing briefcases.</li>
                <li>• <strong>Zero Phone Interruptions</strong>: Doctors never receive ad-hoc phone calls or WhatsApp messages during consultations.</li>
                <li>• <strong>Reception Delegation</strong>: Clinic nurses & front desk manage the entire queue with 1 tap.</li>
              </ul>
            </div>

            <div className="bg-cream-50 p-5 rounded-[1.25rem] border border-line space-y-3">
              <span className="font-mono text-xs font-bold text-amber-700 uppercase block">
                💼 Pharma Company Impact
              </span>
              <ul className="text-xs text-slate-700 space-y-2">
                <li>• <strong>+40% Field Productivity</strong>: Reps visit 8–10 verified doctors per day instead of 3–4 while waiting.</li>
                <li>• <strong>Eliminates DCR Fraud</strong>: Verified digital tokens ensure visits actually occurred at the clinic.</li>
                <li>• <strong>Save 1.5 hrs Daily</strong>: Instant CSV/Excel export replaces tedious midnight manual log entry.</li>
              </ul>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
