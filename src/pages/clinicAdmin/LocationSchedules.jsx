/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  User, 
  Check,
  ChevronLeft
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function LocationSchedules() {
  const [selectedBranch, setSelectedBranch] = useState('Remedi Clinic (Kurnool) Primary');
  const [selectedDayIndex, setSelectedDayIndex] = useState(2); // Wed 29 Oct

  const weekDays = [
    { day: 'Mon', date: '27 Oct' },
    { day: 'Tue', date: '28 Oct' },
    { day: 'Wed', date: '29 Oct' },
    { day: 'Thu', date: '30 Oct' },
    { day: 'Fri', date: '31 Oct' }
  ];

  const doctorSchedules = [
    {
      id: 1,
      name: 'Dr. T. Karthik',
      specialty: 'General Medicine',
      branch: 'Main Branch',
      morning: '10:00 AM - 01:00 PM',
      evening: '06:00 PM - 09:00 PM'
    },
    {
      id: 2,
      name: 'Dr. K. Ramya',
      specialty: 'Dermatology & Cosmetology',
      branch: 'Main Branch',
      morning: '10:00 AM - 03:00 PM',
      evening: '06:00 PM - 09:00 PM'
    },
    {
      id: 3,
      name: 'Dr. D V Subba Reddy',
      specialty: 'Orthopedics',
      branch: 'Main Branch',
      morning: '10:00 AM - 02:00 PM',
      evening: null
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Bar (Image 11 Screen 3) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Location-specific Schedules
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage doctor schedules for each branch
          </p>
        </div>

        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[0.875rem] bg-[#064E3B] hover:bg-[#047857] text-white font-display font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Schedule</span>
        </button>
      </div>

      {/* ── Branch Selector Bar ──────────────────────────────────────── */}
      <div className="p-4 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[0.875rem] bg-emerald-50 text-[#064E3B] flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-sm text-ink">{selectedBranch}</span>
            </div>
            <p className="text-[0.6875rem] text-slate-400">Beside Vijaya Diagnostics, Gayathri Estates, Kurnool</p>
          </div>
        </div>

        <ChevronDown className="w-4 h-4 text-slate-400" />
      </div>

      {/* ── 5-Day Strip Selector (Image 11 Screen 3) ─────────────────── */}
      <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-[1.25rem] border border-slate-200 shadow-2xs">
        <button className="p-2 text-slate-400 hover:text-ink">
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center justify-around gap-2">
          {weekDays.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedDayIndex(idx)}
              className={cn(
                "flex-1 py-2 px-1 rounded-[0.875rem] text-center transition-all cursor-pointer",
                selectedDayIndex === idx
                  ? "bg-[#064E3B] text-white shadow-sm font-bold"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span className="block text-[0.6875rem] uppercase font-mono">{item.day}</span>
              <span className="block text-xs font-bold mt-0.5">{item.date}</span>
            </button>
          ))}
        </div>

        <button className="p-2 text-slate-400 hover:text-ink">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Doctor Schedules List (Image 11 Screen 3) ────────────────── */}
      <div className="space-y-3">
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
          Doctor Schedules
        </span>

        <div className="space-y-3">
          {doctorSchedules.map((doc) => (
            <div
              key={doc.id}
              className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 text-[#064E3B] border border-emerald-200 flex items-center justify-center font-display font-bold text-base flex-shrink-0">
                  {doc.name.replace(/^Dr\.?\s*/i, '').charAt(0)}
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink">{doc.name}</h3>
                  <p className="text-xs text-slate-500">{doc.specialty}</p>
                  <p className="text-[0.6875rem] text-slate-400 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3" />
                    <span>{doc.branch}</span>
                  </p>
                </div>
              </div>

              {/* Time Slots */}
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                {doc.morning && (
                  <span className="px-3 py-1.5 rounded-[0.625rem] bg-emerald-50/70 border border-emerald-200 text-[#064E3B] font-mono text-xs font-bold">
                    {doc.morning}
                  </span>
                )}
                {doc.evening && (
                  <span className="px-3 py-1.5 rounded-[0.625rem] bg-emerald-50/70 border border-emerald-200 text-[#064E3B] font-mono text-xs font-bold">
                    {doc.evening}
                  </span>
                )}
                <button className="p-1 text-slate-400 hover:text-ink">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
