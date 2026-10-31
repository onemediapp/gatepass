/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Building2, 
  Stethoscope, 
  Search, 
  Filter, 
  Check, 
  X, 
  ShieldCheck, 
  MoreVertical, 
  MapPin, 
  Clock 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function DoctorClinicVerification() {
  const [activeTab, setActiveTab] = useState('Clinics (12)');
  const [searchQuery, setSearchQuery] = useState('');

  const [items, setItems] = useState([
    {
      id: 1,
      name: 'LifeCare Clinic',
      type: 'clinic',
      subtitle: 'MG Road, Kurnool · 2 Doctors, 5 Staff',
      dateStr: 'Submitted on 28 Oct 2026',
      status: 'Pending'
    },
    {
      id: 2,
      name: 'Sri Sai Clinic',
      type: 'clinic',
      subtitle: 'Nandyal, Kurnool · 1 Doctor, 3 Staff',
      dateStr: 'Submitted on 27 Oct 2026',
      status: 'Pending'
    },
    {
      id: 3,
      name: 'Health Plus Clinic',
      type: 'clinic',
      subtitle: 'Adoni, Kurnool · 2 Doctors, 4 Staff',
      dateStr: 'Submitted on 26 Oct 2026',
      status: 'Pending'
    },
    {
      id: 4,
      name: 'Dr. Mehta',
      type: 'doctor',
      subtitle: 'General Medicine · Kurnool',
      dateStr: 'Submitted on 26 Oct 2026',
      status: 'Pending'
    },
    {
      id: 5,
      name: 'Dr. Swathi Reddy',
      type: 'doctor',
      subtitle: 'Dermatology · Nandyal',
      dateStr: 'Verified on 25 Oct 2026',
      status: 'Verified'
    }
  ]);

  const tabs = ['Clinics (12)', 'Doctors (18)', 'Verified (320)', 'Rejected (26)'];

  const filteredItems = items.filter(item => {
    if (activeTab === 'Clinics (12)' && item.type !== 'clinic') return false;
    if (activeTab === 'Doctors (18)' && item.type !== 'doctor') return false;
    if (activeTab === 'Verified (320)' && item.status !== 'Verified') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(q) || item.subtitle.toLowerCase().includes(q);
    }
    return true;
  });

  const handleVerify = (id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, status: 'Verified' } : item));
  };

  return (
    <div className="space-y-5">
      
      {/* ── Top Header Bar (Image 16 Screen 2) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Doctor and Clinic Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review and verify doctor and clinic registrations
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
              placeholder="Search by clinic name, doctor name, location..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-[1rem] text-xs text-ink outline-none focus:border-purple-600 shadow-2xs"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-[1rem] text-slate-500 hover:text-ink">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Verification Cards List (Image 16 Screen 2) ──────────────── */}
      <div className="space-y-3">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-[1rem] bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold text-base flex-shrink-0">
                {item.type === 'clinic' ? <Building2 className="w-6 h-6" /> : <Stethoscope className="w-6 h-6" />}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm sm:text-base text-ink">{item.name}</h3>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold border",
                    item.status === 'Verified'
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  )}>
                    {item.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">{item.subtitle}</p>
                <p className="text-[0.6875rem] font-mono text-slate-400">{item.dateStr}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button className="px-3.5 py-1.5 rounded-[0.75rem] bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all">
                View
              </button>
              {item.status !== 'Verified' && (
                <button
                  onClick={() => handleVerify(item.id)}
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

    </div>
  );
}
