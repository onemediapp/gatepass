/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  MapPin, 
  MoreVertical,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function EnterpriseReps() {
  const [activeTab, setActiveTab] = useState('All (186)');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRep, setNewRep] = useState({
    name: '',
    empId: '',
    territory: 'Kurnool A',
    email: '',
    mobile: ''
  });

  const [reps, setReps] = useState([
    { id: 1, name: 'Rajesh Kumar', empId: 'EMP001', territory: 'Kurnool A', status: 'Active' },
    { id: 2, name: 'Priya Sharma', empId: 'EMP002', territory: 'Kurnool B', status: 'Active' },
    { id: 3, name: 'Amit Singh', empId: 'EMP003', territory: 'Nandyal', status: 'Active' },
    { id: 4, name: 'Suresh Reddy', empId: 'EMP004', territory: 'Adoni', status: 'Active' },
    { id: 5, name: 'Neha Verma', empId: 'EMP005', territory: 'Kurnool A', status: 'Active' },
    { id: 6, name: 'Manoj Kumar', empId: 'EMP006', territory: 'Rayalaseema', status: 'Inactive' },
    { id: 7, name: 'Kavya Nair', empId: 'EMP007', territory: 'Kurnool B', status: 'Active' }
  ]);

  const tabs = ['All (186)', 'Active (162)', 'Inactive (24)'];

  const filteredReps = reps.filter(r => {
    if (activeTab === 'Active (162)' && r.status !== 'Active') return false;
    if (activeTab === 'Inactive (24)' && r.status !== 'Inactive') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.name.toLowerCase().includes(q) ||
        r.empId.toLowerCase().includes(q) ||
        r.territory.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddRepSubmit = (e) => {
    e.preventDefault();
    if (!newRep.name.trim() || !newRep.empId.trim()) return;
    const item = {
      id: Date.now(),
      name: newRep.name.trim(),
      empId: newRep.empId.trim(),
      territory: newRep.territory,
      status: 'Active'
    };
    setReps(prev => [item, ...prev]);
    setShowAddModal(false);
    setNewRep({ name: '', empId: '', territory: 'Kurnool A', email: '', mobile: '' });
  };

  return (
    <div className="space-y-5">
      
      {/* ── Top Header Bar (Image 12 Screen 2) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Representatives
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your medical representatives
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[0.875rem] bg-orange-600 hover:bg-orange-500 text-white font-display font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Representative</span>
        </button>
      </div>

      {/* ── Search & Filter Tabs ─────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, employee ID, email or phone..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-[1rem] text-xs text-ink outline-none focus:border-orange-500 shadow-2xs"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-[1rem] text-slate-500 hover:text-ink">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center bg-slate-200/70 p-1 rounded-[0.875rem] text-xs">
          {tabs.map((tab) => (
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
      </div>

      {/* ── Rep Roster Cards (Image 12 Screen 2) ─────────────────────── */}
      <div className="space-y-3">
        {filteredReps.map((rep) => (
          <div
            key={rep.id}
            className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-[1rem] bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center font-display font-bold text-base flex-shrink-0">
                {rep.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm text-ink">{rep.name}</h3>
                  <span className="font-mono text-[0.6875rem] text-slate-500 font-semibold">{rep.empId}</span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{rep.territory}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border",
                rep.status === 'Active'
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              )}>
                {rep.status}
              </span>
              <button className="p-1 text-slate-400 hover:text-ink">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-[1.5rem] border border-slate-200 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-ink">Add Representative</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRepSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  value={newRep.name}
                  onChange={(e) => setNewRep({ ...newRep, name: e.target.value })}
                  placeholder="e.g. Ramesh Reddy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Employee ID *</label>
                <input
                  type="text"
                  value={newRep.empId}
                  onChange={(e) => setNewRep({ ...newRep, empId: e.target.value })}
                  placeholder="EMP008"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Territory *</label>
                <select
                  value={newRep.territory}
                  onChange={(e) => setNewRep({ ...newRep, territory: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                >
                  <option value="Kurnool A">Kurnool A</option>
                  <option value="Kurnool B">Kurnool B</option>
                  <option value="Nandyal">Nandyal</option>
                  <option value="Adoni">Adoni</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-[0.875rem] bg-orange-600 text-white font-bold text-xs mt-2"
              >
                Enroll Representative
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
