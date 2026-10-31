/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Edit, 
  ArrowLeft 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function BranchDetails() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Overview');

  const tabs = ['Overview', 'Doctors (5)', 'Staff (8)', 'Facilities', 'Settings'];

  const branchMetrics = [
    { label: 'Doctors', value: '5', color: 'text-purple-600', icon: Users },
    { label: 'Staff', value: '8', color: 'text-blue-600', icon: Users },
    { label: 'Appointments Today', value: '24', color: 'text-teal-600', icon: Calendar },
    { label: 'Completed', value: '18', color: 'text-emerald-600', icon: CheckCircle2 },
    { label: 'In Progress', value: '4', color: 'text-amber-600', icon: Clock },
    { label: 'No Show', value: '2', color: 'text-rose-600', icon: XCircle }
  ];

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Bar (Image 11 Screen 2) ───────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/clinic-admin/branches')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-white border border-slate-200 text-xs font-semibold hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Branches</span>
        </button>

        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          <Edit className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>
      </div>

      {/* ── Branch Banner Card ───────────────────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-[1.5rem] bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-[1.25rem] bg-emerald-50 text-[#064E3B] border border-emerald-200 flex items-center justify-center font-bold text-xl flex-shrink-0">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-display font-bold text-ink">
                  Remedi Clinic (Kurnool)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                  Primary Branch
                </span>
                <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                Beside Vijaya Diagnostics, Gayathri Estates, Kurnool, Andhra Pradesh – 518001
              </p>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1 font-mono">
                  <Phone className="w-3.5 h-3.5" /> 9429690055
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" /> info@remediclinic.com
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Image 11 Screen 2) */}
        <div className="flex items-center bg-slate-100 p-1 rounded-[0.875rem] text-xs font-semibold overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-[0.625rem] text-center whitespace-nowrap transition-all cursor-pointer",
                activeTab === tab ? "bg-[#064E3B] text-white shadow-sm font-bold" : "text-slate-600 hover:text-ink"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── 6 KPI Metric Tiles (Image 11 Screen 2) ───────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {branchMetrics.map((m, i) => (
          <div key={i} className="p-3.5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[0.625rem] font-bold text-slate-500 uppercase tracking-wider block truncate">
              {m.label}
            </span>
            <div className={cn("text-2xl font-display font-bold", m.color)}>
              {m.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Branch Information Section ──────────────────────────────── */}
      <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-4">
        <h3 className="font-display font-bold text-sm text-ink">Branch Information</h3>
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500">Branch Type</span>
            <span className="font-semibold text-ink">Main Clinic (Primary)</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500">Address</span>
            <span className="font-semibold text-ink text-right max-w-xs">Beside Vijaya Diagnostics, Gayathri Estates, Kurnool</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500">Phone Number</span>
            <span className="font-semibold text-ink font-mono">9429690055</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-slate-500">Email</span>
            <span className="font-semibold text-ink">info@remediclinic.com</span>
          </div>
        </div>
      </div>

    </div>
  );
}
