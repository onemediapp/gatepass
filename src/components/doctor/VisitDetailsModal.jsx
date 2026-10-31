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
  FileText, 
  Download, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ExternalLink,
  Building2,
  Check,
  AlertCircle
} from 'lucide-react';
import { updateAppointment } from '../../lib/db/appointments';
import { recordRepOutcome } from '../../lib/db/repRelations';
import { formatSlotRange, formatDateIST } from '../../lib/time';
import { formatTokenDisplay } from '../../lib/gatepass';
import { cn } from '../../lib/utils';
import { serverTimestamp } from 'firebase/firestore';

export default function VisitDetailsModal({ appt, doctorId, onClose, onRefresh }) {
  if (!appt) return null;

  const [loading, setLoading] = useState(false);
  const rep = appt.repSnapshot || {};
  const initial = rep.name ? rep.name.charAt(0) : 'R';
  const timeRange = formatSlotRange(appt.slotStart, appt.slotEnd);
  const tokenStr = formatTokenDisplay(appt.token);

  // Demo attachments matching Reference Image 4 Screen 2
  const attachments = appt.attachments || [
    { name: 'Product_Brochure.pdf', size: '1.2 MB' },
    { name: 'Study_Summary.pdf', size: '800 KB' }
  ];

  const handleMarkComplete = async () => {
    setLoading(true);
    try {
      await updateAppointment(appt.id, {
        status: 'completed',
        outcome: 'met',
        outcomeAt: serverTimestamp(),
        completedAt: serverTimestamp()
      });
      if (rep.uid && doctorId) {
        await recordRepOutcome(doctorId, rep.uid, 'met');
      }
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error('Error completing visit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Are you sure you want to decline this visit?')) return;
    setLoading(true);
    try {
      await updateAppointment(appt.id, {
        status: 'declined',
        outcome: 'no_show',
        outcomeAt: serverTimestamp()
      });
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      console.error('Error rejecting visit:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[1.5rem] max-w-lg w-full border border-line shadow-xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="p-5 border-b border-line flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-base text-ink">Visit Details</span>
            {appt.token && (
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                {tokenStr}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-ink hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Rep Profile Card (Reference Image 4 Screen 2) */}
          <div className="flex items-start justify-between gap-3 bg-cream-50/60 p-4 rounded-[1.25rem] border border-line/80">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-[1rem] bg-amber-400 text-amber-950 font-display font-bold text-lg flex items-center justify-center shrink-0 shadow-xs">
                {initial}
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-ink">
                  {rep.name || 'Representative'}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {rep.company || 'Pharma Ltd.'}
                </p>
                <p className="text-[0.6875rem] text-slate-400 mt-0.5">
                  {rep.designation || 'RM'} {rep.therapeuticCategory ? `• ${rep.therapeuticCategory}` : ''}
                </p>
              </div>
            </div>

            <span className={cn(
              "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider font-mono",
              appt.status === 'approved' ? "bg-teal-50 text-teal-700 border border-teal-200" :
              appt.status === 'completed' || appt.outcome === 'met' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
              "bg-slate-100 text-slate-600"
            )}>
              {appt.outcome === 'met' ? 'Completed' : appt.status === 'approved' ? 'Confirmed' : appt.status}
            </span>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {rep.mobile && (
              <a 
                href={`tel:${rep.mobile}`} 
                className="flex items-center gap-2 p-2.5 rounded-[0.875rem] bg-white border border-line hover:border-teal-300 text-slate-700 transition-colors"
              >
                <Phone className="w-4 h-4 text-teal-600" />
                <span>{rep.mobile}</span>
              </a>
            )}
            <div className="flex items-center gap-2 p-2.5 rounded-[0.875rem] bg-white border border-line text-slate-700 truncate">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{rep.email || 'rep@pharma.com'}</span>
            </div>
          </div>

          {/* Appointment Time & Clinic */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3 p-3.5 rounded-[1rem] bg-slate-50 border border-line">
              <div className="w-8 h-8 rounded-[0.625rem] bg-white text-teal-700 flex items-center justify-center shadow-2xs">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[0.6875rem] text-slate-400 font-semibold uppercase font-mono">Appointment Time</p>
                <p className="text-xs font-bold text-ink">
                  {appt.slotDate ? formatDateIST(appt.slotDate, 'EEEE, dd MMM yyyy') : 'Today'} • {timeRange}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-[1rem] bg-slate-50 border border-line">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[0.625rem] bg-white text-teal-700 flex items-center justify-center shadow-2xs">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[0.6875rem] text-slate-400 font-semibold uppercase font-mono">Clinic Location</p>
                  <p className="text-xs font-bold text-ink">
                    {appt.clinicName || 'Remedi Clinic'}
                  </p>
                  <p className="text-[0.6875rem] text-slate-500">
                    Gayathri Estates, Kurnool, Andhra Pradesh
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold text-teal-700">View Map</span>
            </div>
          </div>

          {/* Visit Reason & Message */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Visit Reason</h4>
            <div className="p-3.5 rounded-[1rem] bg-white border border-line text-xs text-ink leading-relaxed">
              <p className="font-semibold text-ink">
                {appt.visitReason ? appt.visitReason.replace('_', ' ').toUpperCase() : 'Product Discussion'}
              </p>
              <p className="text-slate-600 mt-1">
                {appt.message || appt.productFocus || 'Discussion on latest clinical data and new product line.'}
              </p>
            </div>
          </div>

          {/* Attachments Section (Reference Image 4 Screen 2) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              Attachments ({attachments.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {attachments.map((file, i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-3 rounded-[0.875rem] bg-slate-50 border border-line hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-coral-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-ink truncate">{file.name}</p>
                      <p className="text-[0.625rem] text-slate-400 font-mono">{file.size}</p>
                    </div>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 hover:text-ink cursor-pointer shrink-0 ml-1" />
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons (Reference Image 4 Screen 2: Reject, Reschedule, Mark Complete) */}
        <div className="p-4 border-t border-line bg-slate-50/50 flex items-center justify-between gap-2.5">
          {appt.status !== 'completed' && appt.outcome !== 'met' ? (
            <>
              <button
                onClick={handleReject}
                disabled={loading}
                className="flex-1 py-2.5 px-3 rounded-[0.875rem] bg-white border border-coral-200 text-coral-600 hover:bg-coral-50 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject</span>
              </button>

              <button
                onClick={handleMarkComplete}
                disabled={loading}
                className="flex-2 py-2.5 px-4 rounded-[0.875rem] bg-navy-900 hover:bg-navy-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-teal-400" />
                <span>Mark Complete</span>
              </button>
            </>
          ) : (
            <div className="w-full text-center py-1">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 inline-flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Visit Completed
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
