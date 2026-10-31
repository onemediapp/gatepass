/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  XCircle, 
  ArrowUpRight, 
  ChevronRight, 
  Building2, 
  TrendingUp, 
  ChevronDown 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EnterpriseDashboard() {
  const navigate = useNavigate();

  const stats = [
    {
      title: 'Total Representatives',
      value: '186',
      sub: null,
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-50'
    },
    {
      title: 'Doctor Visits',
      value: '1,248',
      change: '↑ 12%',
      sub: 'vs last month',
      icon: Stethoscope,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    {
      title: 'Completed Visits',
      value: '952',
      change: '↑ 18%',
      sub: 'vs last month',
      icon: Calendar,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Pending Reports',
      value: '86',
      change: '↑ 6%',
      sub: 'vs last month',
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50'
    }
  ];

  const topReps = [
    { rank: 1, name: 'Rajesh Kumar', visits: 48, avatar: 'R' },
    { rank: 2, name: 'Priya Sharma', visits: 42, avatar: 'P' },
    { rank: 3, name: 'Amit Singh', visits: 38, avatar: 'A' }
  ];

  const specialtyBreakdown = [
    { name: 'General Medicine', percent: 32, color: 'bg-orange-500' },
    { name: 'Dermatology', percent: 24, color: 'bg-teal-500' },
    { name: 'Orthopedics', percent: 18, color: 'bg-blue-500' },
    { name: 'Cardiology', percent: 14, color: 'bg-rose-500' },
    { name: 'Others', percent: 12, color: 'bg-slate-400' }
  ];

  const trendPoints = [
    { date: '1 Oct', val: 25 },
    { date: '5 Oct', val: 20 },
    { date: '10 Oct', val: 45 },
    { date: '15 Oct', val: 36 },
    { date: '20 Oct', val: 78 },
    { date: '25 Oct', val: 55 },
    { date: '30 Oct', val: 62 }
  ];

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Bar (Image 12 Screen 1) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Overview of your field force and doctor engagements
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Thu, 30 Oct 2026</span>
        </div>
      </div>

      {/* ── 4 KPI Stats Grid (Image 12 Screen 1) ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-4 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="w-8 h-8 rounded-[0.625rem] flex items-center justify-center mb-1" style={{ backgroundColor: '#FFF7ED', color: '#EA580C' }}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-display font-bold text-ink">
                {s.value}
              </div>
              <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
                {s.title}
              </span>
              {s.change && (
                <div className="flex items-center gap-1 text-[0.625rem] font-semibold text-emerald-600">
                  <span>{s.change}</span>
                  <span className="text-slate-400 font-normal">{s.sub}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Visit Trend (Last 30 Days) Chart ─────────────────────────── */}
      <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-sm text-ink">
            Visit Trend <span className="text-slate-400 font-normal">(Last 30 Days)</span>
          </h2>
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-[0.5rem] bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
            <span>Total Visits</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Line Chart */}
        <div className="h-44 pt-4 flex items-end justify-between gap-3 border-b border-slate-200 pb-2">
          {trendPoints.map((pt, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full flex items-end justify-center h-32">
                <div
                  className="w-2.5 sm:w-3.5 bg-orange-500 rounded-t-sm transition-all"
                  style={{ height: `${pt.val}%` }}
                />
              </div>
              <span className="text-[0.625rem] font-mono text-slate-400">{pt.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two Columns: Top Performers & Specialties ────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Top Performing Representatives */}
        <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-ink">Top Performing Representatives</h3>
            <button
              onClick={() => navigate('/enterprise/reps')}
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {topReps.map((rep) => (
              <div key={rep.rank} className="flex items-center justify-between p-2 rounded-[0.75rem] hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
                    {rep.rank}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {rep.avatar}
                  </div>
                  <span className="font-bold text-xs text-ink">{rep.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {rep.visits} visits &gt;
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Specialties by Visits */}
        <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-display font-bold text-sm text-ink">Top Specialties by Visits</h3>
          
          <div className="space-y-2.5">
            {specialtyBreakdown.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={cn("w-2 h-2 rounded-full", item.color)} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-mono font-bold text-ink">{item.percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", item.color)} style={{ width: `${item.percent}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
