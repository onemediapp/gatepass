/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  Users, 
  CheckCircle2, 
  UserPlus, 
  Plus, 
  ChevronRight, 
  Megaphone, 
  Building2, 
  Play,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import LiveDot from '../../components/ui/LiveDot';

export default function ClinicDashboard() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState('2026-10-30');

  const stats = [
    { label: 'Total Appointments Today', value: '24', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Checked In', value: '18', color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'In Consultation', value: '4', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Completed', value: '2', color: 'text-emerald-600', bg: 'bg-emerald-50' }
  ];

  const todaySchedule = [
    {
      id: 1,
      time: '11:00 AM',
      doctor: 'Dr. T. Karthik',
      specialty: 'General Medicine',
      status: 'In Consultation',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 2,
      time: '11:30 AM',
      doctor: 'Dr. K. Ramya',
      specialty: 'Dermatology',
      status: 'Waiting (2)',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 3,
      time: '12:00 PM',
      doctor: 'Dr. D V Subba Reddy',
      specialty: 'Orthopedics',
      status: 'Next',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200'
    }
  ];

  const quickActions = [
    {
      title: 'Add Doctor',
      desc: 'Invite specialist to clinic',
      icon: UserPlus,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      action: () => navigate('/clinic-admin/doctors?action=invite')
    },
    {
      title: 'Invite Staff',
      desc: 'Reception & nursing RBAC',
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      action: () => navigate('/clinic-admin/staff')
    },
    {
      title: 'Manage Slots',
      desc: 'Visiting hours & quotas',
      icon: Calendar,
      color: 'bg-teal-50 text-teal-700 border-teal-200',
      action: () => navigate('/clinic-admin/schedules')
    },
    {
      title: 'Create Notice',
      desc: 'Clinic rules & closures',
      icon: Megaphone,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      action: () => navigate('/clinic-admin/rules')
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* ── Top Header with Date (Image 13 Screen 1) ────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Clinic Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Here's what's happening at your clinic today.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs self-start sm:self-auto">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>Thu, 30 Oct 2026</span>
        </div>
      </div>

      {/* ── 4 KPI Stats Grid ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, idx) => (
          <div key={idx} className="p-4 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
              {s.label}
            </span>
            <div className={cn("text-2xl font-display font-bold", s.color)}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Today's Schedule (Image 13 Screen 1) ─────────────────────── */}
      <div className="bg-white rounded-[1.25rem] border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-sm text-ink">Today's Schedule</h2>
          <button 
            onClick={() => navigate('/clinic-admin/schedules')}
            className="text-xs font-bold text-[#064E3B] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {todaySchedule.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate('/clinic-admin/schedules')}
              className="p-3.5 rounded-[1rem] bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 flex items-center justify-between gap-3 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-[0.5rem] border border-slate-200">
                  {item.time}
                </span>
                <div>
                  <h4 className="font-display font-bold text-sm text-ink">{item.doctor}</h4>
                  <p className="text-[0.6875rem] text-slate-500">{item.specialty}</p>
                </div>
              </div>

              <span className={cn("px-2.5 py-1 rounded-full text-xs font-mono font-bold border", item.statusColor)}>
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions (Image 13 Screen 1) ────────────────────────── */}
      <div className="space-y-3">
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
          Quick Actions
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((qa, i) => {
            const Icon = qa.icon;
            return (
              <button
                key={i}
                onClick={qa.action}
                className="p-4 rounded-[1.25rem] bg-white border border-slate-200 hover:border-[#064E3B]/40 shadow-2xs flex flex-col items-start gap-2.5 transition-all text-left group active:scale-95 cursor-pointer"
              >
                <div className={cn("w-10 h-10 rounded-[0.875rem] flex items-center justify-center font-bold border shadow-2xs group-hover:scale-105 transition-transform", qa.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink group-hover:text-[#064E3B] transition-colors">
                    {qa.title}
                  </h3>
                  <p className="text-[0.6875rem] text-slate-500 mt-0.5">
                    {qa.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
