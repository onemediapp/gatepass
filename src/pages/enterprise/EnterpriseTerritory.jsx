/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Map, 
  Plus, 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Building2, 
  Users, 
  Edit, 
  Check 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EnterpriseTerritory() {
  const [activeTab, setActiveTab] = useState('Territory View');
  const [selectedTerritory, setSelectedTerritory] = useState({
    code: 'KR-A',
    name: 'Kurnool A',
    region: 'Kurnool Region',
    area: 'Kurnool City & Surroundings',
    repsCount: 22,
    doctorsCount: 186
  });

  const repsInTerritory = [
    { name: 'Rajesh Kumar', empId: 'EMP001', status: 'Active' },
    { name: 'Neha Verma', empId: 'EMP005', status: 'Active' },
    { name: 'Sandeep Yadav', empId: 'EMP008', status: 'Active' }
  ];

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Bar (Image 12 Screen 3) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Territory and Team Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your territories, regions and representative teams
          </p>
        </div>

        <button className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[0.875rem] bg-orange-600 hover:bg-orange-500 text-white font-display font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          <span>Add Territory</span>
        </button>
      </div>

      {/* ── Navigation Tabs ──────────────────────────────────────────── */}
      <div className="flex items-center bg-slate-200/70 p-1 rounded-[0.875rem] text-xs">
        {['Territory View', 'Team View', 'Map View'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-1.5 rounded-[0.625rem] font-semibold text-center transition-all cursor-pointer",
              activeTab === tab
                ? "bg-orange-600 text-white shadow-sm font-bold"
                : "text-slate-600 hover:text-ink"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Two Columns: Hierarchy Tree & Detail Pane ────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Territory Hierarchy Tree */}
        <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-4">
          <h3 className="font-display font-bold text-sm text-ink">Territory Hierarchy</h3>

          <div className="space-y-2">
            {/* Root: Andhra Pradesh */}
            <div className="p-3 rounded-[0.875rem] bg-slate-50 border border-slate-200 flex items-center justify-between text-xs font-bold text-ink">
              <div className="flex items-center gap-2">
                <ChevronDown className="w-4 h-4 text-slate-400" />
                <span>Andhra Pradesh</span>
              </div>
              <span className="font-mono bg-white px-2 py-0.5 rounded-full border border-slate-200">186</span>
            </div>

            {/* Region: Kurnool */}
            <div className="pl-4 space-y-2">
              <div className="p-3 rounded-[0.875rem] bg-slate-50/70 border border-slate-200/80 flex items-center justify-between text-xs font-bold text-ink">
                <div className="flex items-center gap-2">
                  <ChevronDown className="w-4 h-4 text-orange-500" />
                  <span>Kurnool Region</span>
                </div>
                <span className="font-mono bg-white px-2 py-0.5 rounded-full border border-slate-200">78</span>
              </div>

              {/* Sub-territories */}
              <div className="pl-4 space-y-1.5 text-xs">
                <div
                  onClick={() => setSelectedTerritory({
                    code: 'KR-A',
                    name: 'Kurnool A',
                    region: 'Kurnool Region',
                    area: 'Kurnool City & Surroundings',
                    repsCount: 22,
                    doctorsCount: 186
                  })}
                  className={cn(
                    "p-2.5 rounded-[0.75rem] border flex items-center justify-between cursor-pointer transition-all",
                    selectedTerritory.code === 'KR-A'
                      ? "bg-orange-50 border-orange-300 font-bold text-orange-900"
                      : "bg-white border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <span>Kurnool A</span>
                  <span className="font-mono text-slate-500">22</span>
                </div>

                <div className="p-2.5 rounded-[0.75rem] bg-white border border-slate-200 flex items-center justify-between text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <span>Kurnool B</span>
                  <span className="font-mono text-slate-500">18</span>
                </div>

                <div className="p-2.5 rounded-[0.75rem] bg-white border border-slate-200 flex items-center justify-between text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <span>Nandyal</span>
                  <span className="font-mono text-slate-500">20</span>
                </div>

                <div className="p-2.5 rounded-[0.75rem] bg-white border border-slate-200 flex items-center justify-between text-slate-700 hover:bg-slate-50 cursor-pointer">
                  <span>Adoni</span>
                  <span className="font-mono text-slate-500">18</span>
                </div>
              </div>

              {/* Other Regions */}
              <div className="p-3 rounded-[0.875rem] bg-slate-50/70 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <span>Anantapur Region</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded-full border border-slate-200">54</span>
              </div>

              <div className="p-3 rounded-[0.875rem] bg-slate-50/70 border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                <span>Kadapa Region</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded-full border border-slate-200">54</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Territory Detail Pane */}
        <div className="p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-ink">
              {selectedTerritory.name}
            </h3>
            <button className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:underline">
              <Edit className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>

          <div className="space-y-2.5 text-xs divide-y divide-slate-100">
            <div className="pt-0 flex items-center justify-between">
              <span className="text-slate-500">Territory Code</span>
              <span className="font-mono font-bold text-ink">{selectedTerritory.code}</span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500">Region</span>
              <span className="font-semibold text-ink">{selectedTerritory.region}</span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500">Area</span>
              <span className="font-semibold text-ink">{selectedTerritory.area}</span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500">No. of Representatives</span>
              <span className="font-mono font-bold text-ink">{selectedTerritory.repsCount}</span>
            </div>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-500">No. of Doctors</span>
              <span className="font-mono font-bold text-ink">{selectedTerritory.doctorsCount}</span>
            </div>
          </div>

          {/* Assigned Reps List */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h4 className="font-display font-bold text-xs text-ink">
                Assigned Representatives ({selectedTerritory.repsCount})
              </h4>
              <span className="text-[0.6875rem] font-bold text-orange-600 cursor-pointer hover:underline">
                View All
              </span>
            </div>

            <div className="space-y-2">
              {repsInTerritory.map((rep, idx) => (
                <div key={idx} className="p-3 rounded-[0.75rem] bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-ink">{rep.name}</p>
                    <p className="text-[0.6875rem] font-mono text-slate-400">{rep.empId}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {rep.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
