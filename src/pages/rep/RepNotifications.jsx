/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Settings, 
  CheckCircle2, 
  Calendar, 
  Megaphone, 
  Clock, 
  Info, 
  XCircle, 
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import { cn } from '../../lib/utils';

export default function RepNotifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Appointments' | 'Clinic Notices' | 'Reminders' | 'System'

  const notifications = [
    {
      id: 1,
      type: 'completed',
      category: 'Appointments',
      title: 'Visit Completed',
      message: 'Dr. T. Karthik - Remedi Clinic: Your visit has been marked as completed.',
      time: '2:15 PM',
      unread: true,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
    },
    {
      id: 2,
      type: 'confirmed',
      category: 'Appointments',
      title: 'Appointment Confirmed',
      message: 'Your appointment with Dr. K. Ramya on 30 Oct 2026, 11:30 AM is confirmed.',
      time: '10:30 AM',
      unread: false,
      icon: Calendar,
      iconBg: 'bg-purple-50 text-purple-600 border border-purple-200'
    },
    {
      id: 3,
      type: 'notice',
      category: 'Clinic Notices',
      title: 'New Clinic Notice',
      message: 'Dr. K. Ramya - Remedi Clinic: Looking for representatives from Derma products.',
      time: '10:15 AM',
      unread: true,
      icon: Megaphone,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200'
    },
    {
      id: 4,
      type: 'reminder',
      category: 'Reminders',
      title: 'Appointment Reminder',
      message: 'You have an appointment with Dr. D V Subba Reddy at 4:30 PM today.',
      time: '9:00 AM',
      unread: false,
      icon: Clock,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200'
    },
    {
      id: 5,
      type: 'update',
      category: 'Clinic Notices',
      title: 'Schedule Update',
      message: 'Dr. T. Karthik - Remedi Clinic: Will be available only in the evening today.',
      time: '29 Oct',
      unread: false,
      icon: Info,
      iconBg: 'bg-teal-50 text-teal-600 border border-teal-200'
    },
    {
      id: 6,
      type: 'cancelled',
      category: 'Appointments',
      title: 'Appointment Cancelled',
      message: 'Your appointment with Dr. S. Narayana on 28 Oct has been cancelled.',
      time: '28 Oct',
      unread: false,
      icon: XCircle,
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-200'
    }
  ];

  const tabs = ['All', 'Appointments', 'Clinic Notices', 'Reminders', 'System'];

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'All') return true;
    return n.category === activeTab;
  });

  return (
    <div className="min-h-screen bg-cream-50 font-sans pb-28 selection:bg-amber-100 selection:text-sand-600">
      
      {/* ── Top Header (Image 14 Screen 2) ─────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-xl border-b border-line px-4 sm:px-6 py-4 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-[0.75rem] bg-cream-50 border border-line text-ink hover:bg-cream-100 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
                  Notification Centre
                </h1>
                <p className="text-xs text-ink-soft mt-0.5">
                  Stay updated with your appointments and clinic updates
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/rep/profile')}
              className="p-2.5 rounded-[0.875rem] bg-white border border-line text-slate-600 hover:text-ink hover:bg-cream-100 transition-all cursor-pointer"
              title="Notification Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer",
                  activeTab === tab
                    ? "bg-navy-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-line hover:bg-cream-100"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Notifications List ─────────────────────────────────────── */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-3">
        {filteredNotifications.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={cn(
                "p-4 rounded-[1.25rem] bg-white border transition-all flex items-start gap-3.5 shadow-2xs hover:border-navy-500/30",
                item.unread ? "border-amber-400/60 bg-amber-50/10" : "border-line"
              )}
            >
              <div className={cn("w-10 h-10 rounded-[0.875rem] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs", item.iconBg)}>
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display font-bold text-sm text-ink truncate">
                    {item.title}
                  </h3>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="font-mono text-[0.6875rem] text-slate-400">
                      {item.time}
                    </span>
                    {item.unread && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                    )}
                  </div>
                </div>

                <p className="text-xs text-ink-soft mt-1 leading-relaxed">
                  {item.message}
                </p>
              </div>
            </div>
          );
        })}
      </main>

      <RepBottomNav />
    </div>
  );
}
