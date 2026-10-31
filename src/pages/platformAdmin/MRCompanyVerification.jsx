/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Users, 
  Search, 
  Filter, 
  ShieldCheck, 
  MoreVertical, 
  Check, 
  X, 
  MapPin 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function MRCompanyVerification() {
  const [activeTab, setActiveTab] = useState('Companies (8)');
  const [searchQuery, setSearchQuery] = useState('');

  const [companies, setCompanies] = useState([
    {
      id: 1,
      name: 'Sunrise Pharma',
      hq: 'Head Office: Hyderabad',
      repsCount: 45,
      dateStr: 'Submitted on 28 Oct 2026',
      status: 'Pending'
    },
    {
      id: 2,
      name: 'Medivo Health',
      hq: 'Head Office: Bengaluru',
      repsCount: 32,
      dateStr: 'Verified on 25 Oct 2026',
      status: 'Verified'
    },
    {
      id: 3,
      name: 'CureWell Pharma',
      hq: 'Head Office: Mumbai',
      repsCount: 28,
      dateStr: 'Submitted on 27 Oct 2026',
      status: 'Pending'
    }
  ]);

  const [recentReps, setRecentReps] = useState([
    {
      id: 1,
      name: 'Amit Singh',
      company: 'Medivo Health · EMP003',
      location: 'Nandyal',
      dateStr: '26 Oct 2026',
      status: 'Pending'
    },
    {
      id: 2,
      name: 'Neha Verma',
      company: 'Sunrise Pharma · EMP014',
      location: 'Kurnool',
      dateStr: '26 Oct 2026',
      status: 'Pending'
    },
    {
      id: 3,
      name: 'Sandeep Yadav',
      company: 'CureWell Pharma · EMP021',
      location: 'Adoni',
      dateStr: '25 Oct 2026',
      status: 'Verified'
    }
  ]);

  const tabs = ['Companies (8)', 'Representatives (24)', 'Verified (420)', 'Rejected (36)'];

  const handleVerifyCompany = (id) => {
    setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: 'Verified' } : c));
  };

  const handleVerifyRep = (id) => {
    setRecentReps(prev => prev.map(r => r.id === id ? { ...r, status: 'Verified' } : r));
  };

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Bar (Image 16 Screen 3) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            MR and Company Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verify pharmaceutical companies and their representatives
          </p>
        </div>
      </div>

      {/* ── Filter Tabs & Search Bar ─────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center bg-slate-200/70 p-1 rounded-[0.875rem] text-xs overflow-x-auto scrollbar-none">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-[0.625rem] font-semibold text-center whitespace-nowrap transition-all cursor-pointer",
                activeTab === tab
                  ? "bg-purple-600 text-white shadow-sm font-bold"
                  : "text-slate-600 hover:text-ink"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by company name, MR name, email or location..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-[1rem] text-xs text-ink outline-none focus:border-purple-600 shadow-2xs"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-[1rem] text-slate-500 hover:text-ink">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Pharmaceutical Company Cards List ────────────────────────── */}
      <div className="space-y-3">
        {companies.map((c) => (
          <div
            key={c.id}
            className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-[1rem] bg-orange-50 text-orange-700 border border-orange-200 flex items-center justify-center font-bold text-base flex-shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm sm:text-base text-ink">{c.name}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold border",
                    c.status === 'Verified'
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{c.hq} · <span className="font-mono">{c.repsCount} Representatives</span></p>
                <p className="text-[0.6875rem] font-mono text-slate-400">{c.dateStr}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button className="px-3.5 py-1.5 rounded-[0.75rem] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                View
              </button>
              {c.status !== 'Verified' && (
                <button
                  onClick={() => handleVerifyCompany(c.id)}
                  className="px-3.5 py-1.5 rounded-[0.75rem] bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Verify
                </button>
              )}
              <button className="p-1 text-slate-400 hover:text-ink">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Recent Representative Registrations (Image 16 Screen 3) ──── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold">
            Recent Representative Registrations
          </span>
          <span className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">
            View All
          </span>
        </div>

        <div className="space-y-2.5">
          {recentReps.map((r) => (
            <div
              key={r.id}
              className="p-3.5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-xs text-ink">{r.name}</h4>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[0.5625rem] font-mono font-bold border",
                      r.status === 'Verified' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                    )}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-[0.6875rem] text-slate-500">{r.company} · {r.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <span className="text-[0.6875rem] font-mono text-slate-400">{r.dateStr}</span>
                <button className="px-3 py-1 rounded-[0.5rem] bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700">
                  View
                </button>
                {r.status !== 'Verified' && (
                  <button
                    onClick={() => handleVerifyRep(r.id)}
                    className="px-3 py-1 rounded-[0.5rem] bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                  >
                    Verify
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
