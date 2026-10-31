/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  PieChart as PieIcon,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { cn } from '../../lib/utils';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';

export default function DoctorAnalytics() {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('Oct 2026');
  const [stats, setStats] = useState({
    totalRequests: 48,
    approved: 36,
    completed: 32,
    noShow: 4
  });

  // Trend data matching Image 1 Screen 2
  const weeklyTrends = [
    { label: '1 Oct', requested: 10, completed: 8, noShow: 2 },
    { label: '8 Oct', requested: 14, completed: 11, noShow: 3 },
    { label: '15 Oct', requested: 12, completed: 9, noShow: 5 },
    { label: '22 Oct', requested: 18, completed: 13, noShow: 4 },
    { label: '31 Oct', requested: 17, completed: 14, noShow: 5 }
  ];

  const companyVisits = [
    { name: 'Sun Pharma', count: 10, color: 'bg-blue-500' },
    { name: 'Cipla', count: 8, color: 'bg-teal-500' },
    { name: 'Torrent Pharma', count: 6, color: 'bg-amber-500' },
    { name: 'Innovative Pharma', count: 5, color: 'bg-purple-500' },
    { name: 'Others', count: 3, color: 'bg-slate-400' }
  ];

  const topSpecialties = [
    { name: 'Diabetes', percent: 40, color: 'bg-teal-600' },
    { name: 'Cardiology', percent: 25, color: 'bg-blue-600' },
    { name: 'Respiratory', percent: 15, color: 'bg-amber-500' },
    { name: 'Others', percent: 20, color: 'bg-slate-400' }
  ];

  const maxTrend = 20;

  return (
    <div className="pb-12 max-w-2xl mx-auto font-sans selection:bg-amber-100 selection:text-sand-600 space-y-6">
      
      {/* ── Top Header with Month Selector (Image 1 Screen 2) ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Practice Analytics
          </h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Overview of representative visits and engagement.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-white border border-line text-xs font-semibold text-ink shadow-2xs">
          <span>{selectedMonth}</span>
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
        </div>
      </div>

      {/* ── 4 KPI Stats Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Requests */}
        <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider">
              Total Requests
            </span>
            <div className="w-6 h-6 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-ink">
            {stats.totalRequests}
          </div>
          <div className="flex items-center gap-1 text-[0.625rem] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3 h-3" />
            <span>12%</span>
          </div>
        </div>

        {/* Approved */}
        <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider">
              Approved
            </span>
            <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-ink">
            {stats.approved}
          </div>
          <div className="flex items-center gap-1 text-[0.625rem] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3 h-3" />
            <span>20%</span>
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider">
              Completed
            </span>
            <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-ink">
            {stats.completed}
          </div>
          <div className="flex items-center gap-1 text-[0.625rem] font-semibold text-emerald-600">
            <ArrowUpRight className="w-3 h-3" />
            <span>18%</span>
          </div>
        </div>

        {/* No Show */}
        <div className="p-4 rounded-[1.25rem] bg-white border border-line shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider">
              No Show
            </span>
            <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <XCircle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-display font-bold text-ink">
            {stats.noShow}
          </div>
          <div className="flex items-center gap-1 text-[0.625rem] font-semibold text-rose-600">
            <ArrowDownRight className="w-3 h-3" />
            <span>25%</span>
          </div>
        </div>
      </div>

      {/* ── Visits Trend Chart (Image 1 Screen 2) ────────────── */}
      <div className="bg-white rounded-[1.25rem] border border-line p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-display font-bold text-sm text-ink">Visits Trend</h2>
          <div className="flex items-center gap-3 text-[0.6875rem] font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600">Requested</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-slate-600">Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600">No Show</span>
            </div>
          </div>
        </div>

        {/* Bar Chart Visualization */}
        <div className="pt-4 h-48 flex items-end justify-between gap-3 sm:gap-6 border-b border-line pb-2">
          {weeklyTrends.map((week, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
              <div className="w-full flex items-end justify-center gap-1 h-36">
                {/* Requested */}
                <div 
                  className="w-2.5 sm:w-3.5 bg-blue-600 rounded-t-sm transition-all"
                  style={{ height: `${(week.requested / maxTrend) * 100}%` }}
                  title={`Requested: ${week.requested}`}
                />
                {/* Completed */}
                <div 
                  className="w-2.5 sm:w-3.5 bg-teal-500 rounded-t-sm transition-all"
                  style={{ height: `${(week.completed / maxTrend) * 100}%` }}
                  title={`Completed: ${week.completed}`}
                />
                {/* No Show */}
                <div 
                  className="w-2.5 sm:w-3.5 bg-rose-400 rounded-t-sm transition-all"
                  style={{ height: `${(week.noShow / maxTrend) * 100}%` }}
                  title={`No Show: ${week.noShow}`}
                />
              </div>
              <span className="text-[0.625rem] font-mono text-slate-500 font-semibold">{week.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two Columns: Company-wise Visits & Top Specialties ─ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Company-wise Visits */}
        <div className="bg-white rounded-[1.25rem] border border-line p-5 shadow-2xs space-y-4">
          <h2 className="font-display font-bold text-sm text-ink">Company-wise Visits</h2>
          
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full border-4 border-teal-500 border-t-blue-500 border-r-amber-500 border-b-purple-500 flex items-center justify-center flex-shrink-0">
              <div className="text-center">
                <span className="block text-base font-bold text-ink leading-tight">32</span>
                <span className="block text-[0.5625rem] text-slate-500 uppercase tracking-wider">Visits</span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              {companyVisits.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span className="text-slate-600 truncate max-w-[100px]">{item.name}</span>
                  </div>
                  <span className="font-semibold text-ink font-mono">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Specialties */}
        <div className="bg-white rounded-[1.25rem] border border-line p-5 shadow-2xs space-y-4">
          <h2 className="font-display font-bold text-sm text-ink">Top Specialties</h2>
          
          <div className="space-y-3 pt-1">
            {topSpecialties.map((item, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">{item.name}</span>
                  <span className="font-bold text-ink font-mono">{item.percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-cream-100 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", item.color)}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
