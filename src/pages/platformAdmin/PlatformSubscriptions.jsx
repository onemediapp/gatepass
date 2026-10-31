/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CreditCard, 
  Clock, 
  XCircle, 
  TrendingUp, 
  Search, 
  Filter, 
  Building2, 
  MoreVertical, 
  Sparkles, 
  Check 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function PlatformSubscriptions() {
  const [activeTab, setActiveTab] = useState('Subscriptions');
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Active Subscriptions', value: '28', color: 'text-blue-600', icon: CreditCard, bg: 'bg-blue-50' },
    { label: 'Expiring Soon (< 30 days)', value: '6', color: 'text-amber-600', icon: Clock, bg: 'bg-amber-50' },
    { label: 'Overdue', value: '4', color: 'text-rose-600', icon: XCircle, bg: 'bg-rose-50' },
    { label: 'Monthly Revenue', value: '₹2.4L', color: 'text-purple-600', icon: TrendingUp, bg: 'bg-purple-50' }
  ];

  const subscriptions = [
    {
      id: 1,
      name: 'Remedi Clinic',
      location: 'Kurnool',
      plan: 'Clinic Plan',
      price: '₹2,999 / month',
      renewalStr: 'Renews on 15 Nov 2026',
      status: 'Active',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 2,
      name: 'Sunrise Pharma',
      location: 'Hyderabad',
      plan: 'Enterprise Plan',
      price: '₹9,999 / month',
      renewalStr: 'Renews on 20 Nov 2026',
      status: 'Active',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      id: 3,
      name: 'LifeCare Clinic',
      location: 'Nandyal',
      plan: 'Clinic Plan',
      price: '₹2,999 / month',
      renewalStr: 'Expires on 5 Nov 2026',
      status: 'Expiring Soon',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      id: 4,
      name: 'Medivo Health',
      location: 'Bengaluru',
      plan: 'Enterprise Plan',
      price: '₹9,999 / month',
      renewalStr: 'Overdue by 3 days',
      status: 'Overdue',
      statusColor: 'bg-rose-50 text-rose-700 border-rose-200'
    }
  ];

  const filteredSubs = subscriptions.filter(s => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.location.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Bar (Image 16 Screen 4) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Subscriptions, Billing and Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage subscriptions, billing and platform configuration
          </p>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ──────────────────────────────────────── */}
      <div className="flex items-center bg-slate-200/70 p-1 rounded-[0.875rem] text-xs">
        {['Subscriptions', 'Billing', 'Platform Settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-1.5 rounded-[0.625rem] font-semibold text-center transition-all cursor-pointer",
              activeTab === tab
                ? "bg-purple-600 text-white shadow-sm font-bold"
                : "text-slate-600 hover:text-ink"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── 4 KPI Stats Grid (Image 16 Screen 4) ─────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="p-4 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-1">
              <div className={cn("w-8 h-8 rounded-[0.625rem] flex items-center justify-center mb-1", s.bg, s.color)}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-2xl font-display font-bold text-ink">
                {s.value}
              </div>
              <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Search Bar ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by clinic, company or location..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-[1rem] text-xs text-ink outline-none focus:border-purple-600 shadow-2xs"
          />
        </div>
        <button className="p-2.5 bg-white border border-slate-200 rounded-[1rem] text-slate-500 hover:text-ink">
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* ── Active Subscription List ─────────────────────────────────── */}
      <div className="space-y-3">
        {filteredSubs.map((sub) => (
          <div
            key={sub.id}
            className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-[1rem] bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-base flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-sm sm:text-base text-ink">{sub.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {sub.plan}
                  </span>
                  <span className={cn("px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold border", sub.statusColor)}>
                    {sub.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{sub.location} · <strong className="text-ink">{sub.price}</strong></p>
                <p className="text-[0.6875rem] font-mono text-slate-400">{sub.renewalStr}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button className="px-3.5 py-1.5 rounded-[0.75rem] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                View
              </button>
              <button className="p-1 text-slate-400 hover:text-ink">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
