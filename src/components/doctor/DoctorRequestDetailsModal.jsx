/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  Tag, 
  Building2, 
  Star,
  Check,
  AlertCircle
} from 'lucide-react';
import { formatDateIST, formatSlotRange } from '../../lib/time';
import { cn } from '../../lib/utils';

export default function DoctorRequestDetailsModal({ 
  req, 
  onClose, 
  onApprove, 
  onDecline, 
  onReschedule,
  isProcessing = false 
}) {
  if (!req) return null;

  const rep = req.repSnapshot || {};
  const initial = rep.name ? rep.name.charAt(0) : 'R';
  const cleanMobile = (rep.mobile || '').replace(/\D/g, '');
  const timeRange = formatSlotRange(req.slotStart, req.slotEnd);

  // Key Brands / Molecules
  const brands = rep.productNames && rep.productNames.length > 0 
    ? rep.productNames 
    : ['Soliqua', 'Lantus', 'Basaglar'];

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[1.75rem] max-w-lg w-full border border-line shadow-2xl overflow-hidden my-6">
        
        {/* Top Bar (Reference Image 5 Screen 3) */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <h2 className="font-display font-bold text-lg text-ink">Request Details</h2>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              Pending
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* ── 1. Representative Information ───────────────────────── */}
          <div className="space-y-3.5">
            <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Representative Information</span>
            </h3>

            <div className="flex items-start justify-between gap-3 p-4 rounded-[1.25rem] bg-slate-50 border border-line">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-[1rem] bg-teal-100 text-teal-800 font-display font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                  {initial}
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-ink">
                    {rep.name || 'Representative'}
                  </h4>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    {rep.company || 'Pharmaceuticals'}
                  </p>
                  <p className="text-[0.6875rem] text-slate-400 mt-0.5">
                    {rep.designation || 'Medical Representative'} • Andhra Pradesh HQ
                  </p>
                </div>
              </div>

              {/* Quick Contact Buttons (Phone & WhatsApp) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {cleanMobile && (
                  <>
                    <a
                      href={`tel:${cleanMobile}`}
                      className="w-8 h-8 rounded-full bg-white border border-line hover:border-slate-300 text-slate-700 flex items-center justify-center shadow-2xs transition-transform active:scale-95"
                      title="Call Representative"
                    >
                      <Phone className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href={`https://wa.me/91${cleanMobile}?text=${encodeURIComponent(`Hi ${rep.name || 'Sir'}, regarding your Gatepass visit request.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-2xs transition-transform active:scale-95"
                      title="WhatsApp Representative"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}
              </div>
            </div>

            {/* Rep Profiling Badges (Reference Image 5 Screen 3) */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-[1rem] bg-slate-50 border border-line">
                <p className="text-[0.625rem] font-mono uppercase text-slate-400 font-bold">Therapeutic Segment</p>
                <p className="font-bold text-ink mt-0.5">{rep.therapeuticCategory || 'Diabetology'}</p>
              </div>

              <div className="p-3 rounded-[1rem] bg-slate-50 border border-line">
                <p className="text-[0.625rem] font-mono uppercase text-slate-400 font-bold">Reliability</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold text-emerald-700">Good (100% on-time)</span>
                </div>
              </div>
            </div>

            {/* Key Brands */}
            <div className="p-3.5 rounded-[1rem] bg-slate-50 border border-line space-y-1.5">
              <p className="text-[0.625rem] font-mono uppercase text-slate-400 font-bold">Key Brands / Products</p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {brands.map((b, idx) => (
                  <span key={idx} className="px-2.5 py-0.5 rounded-full bg-white border border-line text-xs font-medium text-slate-700">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Past Visits Counter */}
            <div className="flex items-center justify-between p-3 rounded-[0.875rem] bg-cream-50 border border-line text-xs">
              <span className="text-slate-600">Past visits with you:</span>
              <span className="font-bold text-ink">3 completed visits</span>
            </div>
          </div>

          {/* ── 2. Appointment Details ──────────────────────────────── */}
          <div className="space-y-3.5 pt-2 border-t border-line">
            <h3 className="font-mono text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Appointment Details</span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-3 rounded-[0.875rem] bg-white border border-line">
                <span className="text-slate-500 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-teal-600" /> Date
                </span>
                <span className="font-bold text-ink">
                  {req.slotDate ? formatDateIST(req.slotDate, 'EEEE, dd MMMM yyyy') : 'Today'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[0.875rem] bg-white border border-line">
                <span className="text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" /> Time
                </span>
                <span className="font-bold text-ink font-mono">
                  {timeRange} (30 min)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-[0.875rem] bg-white border border-line">
                <span className="text-slate-500 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" /> Clinic
                </span>
                <span className="font-bold text-ink">
                  {req.clinicName || 'REMEDI Clinic, Kurnool'}
                </span>
              </div>
            </div>

            {/* Visit Reason & Message */}
            <div className="p-3.5 rounded-[1rem] bg-slate-50 border border-line space-y-1.5 text-xs">
              <p className="font-mono text-[0.625rem] uppercase text-slate-400 font-bold">Visit Reason</p>
              <p className="font-semibold text-ink">
                {req.visitReason ? req.visitReason.replace('_', ' ').toUpperCase() : 'Product Launch / Discussion'}
              </p>
              <p className="text-slate-600 leading-relaxed pt-1">
                {req.message || req.productFocus || 'Would like to share recent study data, discuss clinical results and leave samples.'}
              </p>
            </div>
          </div>

        </div>

        {/* ── 3. Decision Action Buttons (Reference Image 5 Screen 3) ── */}
        <div className="p-4 border-t border-line bg-slate-50/50 flex items-center justify-between gap-2.5">
          <button
            onClick={() => onDecline(req)}
            disabled={isProcessing}
            className="flex-1 py-2.5 px-3 rounded-[0.875rem] bg-white border border-coral-200 text-coral-600 hover:bg-coral-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>

          <button
            onClick={() => onReschedule(req)}
            disabled={isProcessing}
            className="flex-1 py-2.5 px-3 rounded-[0.875rem] bg-white border border-line text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            <span>Reschedule</span>
          </button>

          <button
            onClick={() => onApprove(req)}
            disabled={isProcessing}
            className="flex-1.5 py-2.5 px-4 rounded-[0.875rem] bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Check className="w-4 h-4 text-teal-400" />
            <span>Approve</span>
          </button>
        </div>

      </div>
    </div>
  );
}
