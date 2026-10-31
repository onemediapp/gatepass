/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Stethoscope, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ChevronRight, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const stats = [
    { label: 'Clinics', value: '245', change: '↑ 12%', color: 'text-purple-600', icon: Building2 },
    { label: 'Doctors', value: '612', change: '↑ 18%', color: 'text-blue-600', icon: Stethoscope },
    { label: 'Representatives', value: '2,486', change: '↑ 24%', color: 'text-teal-600', icon: Users },
    { label: 'Total Visits', value: '18,920', change: '↑ 20%', color: 'text-emerald-600', icon: Calendar }
  ];

  const recentRegistrations = [
    { name: 'Remedi Clinic', type: 'Clinic • Kurnool', time: '2 min ago', icon: Building2 },
    { name: 'Dr. Anil Kumar', type: 'Doctor • Cardiology', time: '12 min ago', icon: Stethoscope },
    { name: 'Rakesh Sharma', type: 'MR • Sunrise Pharma', time: '35 min ago', icon: Users }
  ];

  const pendingApprovals = [
    { title: '5 Clinics', desc: 'Clinic verification', link: '/platform-admin/verify-clinics', icon: Building2 },
    { title: '12 Doctors', desc: 'Doctor verification', link: '/platform-admin/verify-doctors', icon: Stethoscope },
    { title: '18 Representatives', desc: 'MR verification', link: '/platform-admin/verify-pharma', icon: Users },
    { title: '3 Companies', desc: 'Company verification', link: '/platform-admin/verify-pharma', icon: Building2 }
  ];

  const activityTrends = [
    { date: '1 Oct', val: 35 },
    { date: '5 Oct', val: 50 },
    { date: '10 Oct', val: 42 },
    { date: '15 Oct', val: 68 },
    { date: '20 Oct', val: 55 },
    { date: '25 Oct', val: 82 },
    { date: '30 Oct', val: 74 }
  ];

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Bar (Image 16 Screen 1) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Platform overview and key metrics
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Thu, 30 Oct 2026</span>
        </div>
      </div>

      {/* ── 4 KPI Stats Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-4 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className="w-8 h-8 rounded-[0.625rem] bg-purple-50 text-purple-700 flex items-center justify-center mb-1">
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-display font-bold text-ink">
                {s.value}
              </div>
              <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
                {s.label}
              </span>
              <div className="flex items-center gap-1 text-[0.625rem] font-semibold text-emerald-600">
                <span>{s.change}</span>
                <span className="text-slate-400 font-normal">vs last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Platform Activity (Last 30 Days) Chart ───────────────────── */}
      <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold text-sm text-ink">
              Platform Activity <span className="text-slate-400 font-normal">(Last 30 Days)</span>
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1 text-purple-600">
              <span className="w-2 h-2 rounded-full bg-purple-600" /> Clinic Visits
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-600" /> Doctor Visits
            </span>
          </div>
        </div>

        <div className="h-44 pt-4 flex items-end justify-between gap-3 border-b border-slate-200 pb-2">
          {activityTrends.map((pt, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div className="w-full flex items-end justify-center h-32">
                <div
                  className="w-2.5 sm:w-3.5 bg-purple-600 rounded-t-sm transition-all"
                  style={{ height: `${pt.val}%` }}
                />
              </div>
              <span className="text-[0.625rem] font-mono text-slate-400">{pt.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two Columns: Recent Registrations & Pending Approvals ───── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Recent Registrations */}
        <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-ink">Recent Registrations</h3>
            <span className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">
              View All
            </span>
          </div>

          <div className="space-y-2">
            {recentRegistrations.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="p-3 rounded-[0.875rem] bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-purple-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-ink">{item.name}</p>
                      <p className="text-[0.6875rem] text-slate-500">{item.type}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[0.6875rem] text-slate-400">{item.time} &gt;</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-ink">Pending Approvals</h3>
            <span className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">
              View All
            </span>
          </div>

          <div className="space-y-2">
            {pendingApprovals.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  onClick={() => navigate(item.link)}
                  className="p-3 rounded-[0.875rem] bg-slate-50 hover:bg-purple-50 border border-slate-200/80 hover:border-purple-200 flex items-center justify-between text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-amber-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-ink">{item.title}</p>
                      <p className="text-[0.6875rem] text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
