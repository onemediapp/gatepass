/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  BarChart3, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ChevronDown 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EnterpriseAnalytics() {
  const [activeTab, setActiveTab] = useState('Visit Analytics');

  const stats = [
    { label: 'Total Visits', value: '1,248', change: '↑ 12%', isUp: true, color: 'text-blue-600' },
    { label: 'Completed', value: '952', change: '↑ 18%', isUp: true, color: 'text-emerald-600' },
    { label: 'In Progress', value: '196', change: '↓ 4%', isUp: false, color: 'text-amber-600' },
    { label: 'Cancelled', value: '100', change: '↑ 8%', isUp: false, color: 'text-rose-600' }
  ];

  const territoryVisits = [
    { name: 'Kurnool A', visits: 420, max: 450 },
    { name: 'Kurnool B', visits: 310, max: 450 },
    { name: 'Nandyal', visits: 220, max: 450 },
    { name: 'Adoni', visits: 160, max: 450 },
    { name: 'Anantapur', visits: 90, max: 450 },
    { name: 'Kadapa', visits: 48, max: 450 }
  ];

  const specialtyBreakdown = [
    { name: 'General Medicine', percent: 32, color: 'bg-orange-500' },
    { name: 'Dermatology', percent: 24, color: 'bg-teal-500' },
    { name: 'Orthopedics', percent: 18, color: 'bg-blue-500' },
    { name: 'Cardiology', percent: 14, color: 'bg-rose-500' },
    { name: 'ENT', percent: 6, color: 'bg-purple-500' },
    { name: 'Others', percent: 6, color: 'bg-slate-400' }
  ];

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Bar (Image 12 Screen 4) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Analytics and DCR Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track field performance and doctor engagement
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>01 Oct 2026 - 30 Oct 2026</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      {/* ── Sub Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex items-center bg-slate-200/70 p-1 rounded-[0.875rem] text-xs overflow-x-auto scrollbar-none">
        {['Visit Analytics', 'DCR Reports', 'Doctor Insights', 'Representative Performance'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-1.5 px-3 rounded-[0.625rem] font-semibold text-center whitespace-nowrap transition-all cursor-pointer",
              activeTab === tab
                ? "bg-orange-600 text-white shadow-sm font-bold"
                : "text-slate-600 hover:text-ink"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── 4 KPI Stats Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, idx) => (
          <div key={idx} className="p-4 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
              {s.label}
            </span>
            <div className={cn("text-2xl font-display font-bold", s.color)}>
              {s.value}
            </div>
            <div className={cn("text-[0.625rem] font-semibold flex items-center gap-0.5", s.isUp ? "text-emerald-600" : "text-slate-500")}>
              <span>{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Two Columns: Visits by Specialty & Visits by Territory ───── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Visits by Specialty */}
        <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-display font-bold text-sm text-ink">Visits by Specialty</h3>

          <div className="flex items-center gap-4">
            <div className="w-24 h-24 rounded-full border-4 border-orange-500 border-t-teal-500 border-r-blue-500 border-b-rose-500 flex items-center justify-center flex-shrink-0">
              <div className="text-center">
                <span className="block text-base font-bold text-ink leading-tight">1,248</span>
                <span className="block text-[0.5625rem] text-slate-500 uppercase">Total</span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 text-xs">
              {specialtyBreakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span className="text-slate-600 truncate max-w-[110px]">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-ink">{item.percent}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Visits by Territory (Horizontal Bar Chart) */}
        <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-3">
          <h3 className="font-display font-bold text-sm text-ink">Visits by Territory</h3>

          <div className="space-y-2 pt-1 text-xs">
            {territoryVisits.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">{item.name}</span>
                  <span className="font-mono font-bold text-ink">{item.visits}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                    style={{ width: `${(item.visits / item.max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Report Submission Gauge (Image 12 Screen 4) ───────────────── */}
      <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-sm text-ink">
            Field Force DCR Compliance
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            DCR Submitted: <strong className="text-ink">171 / 186 Representatives</strong>
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold mt-2">
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Submitted: 171
            </span>
            <span className="flex items-center gap-1 text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-500" /> Pending: 15
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-500 flex items-center justify-center font-display font-bold text-xl text-emerald-700 shadow-sm">
            92%
          </div>
        </div>
      </div>

    </div>
  );
}
