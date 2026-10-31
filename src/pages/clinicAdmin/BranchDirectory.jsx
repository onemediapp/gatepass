/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Users, 
  Plus, 
  ChevronRight, 
  Check, 
  Clock, 
  ShieldCheck,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function BranchDirectory() {
  const navigate = useNavigate();
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranch, setNewBranch] = useState({
    name: '',
    address: '',
    city: 'Kurnool',
    phone: '',
    doctorsCount: 1,
    staffCount: 2
  });

  const [branches, setBranches] = useState([
    {
      id: 'branch-1',
      name: 'Remedi Clinic (Kurnool)',
      address: 'Beside Vijaya Diagnostics, Gayathri Estates, Kurnool, Andhra Pradesh',
      phone: '9429690055',
      doctorsCount: 5,
      staffCount: 8,
      isPrimary: true,
      status: 'Active'
    },
    {
      id: 'branch-2',
      name: 'Remedi Clinic (Nandyal)',
      address: 'Main Road, Nandyal, Andhra Pradesh',
      phone: '9550011122',
      doctorsCount: 2,
      staffCount: 3,
      isPrimary: false,
      status: 'Active'
    },
    {
      id: 'branch-3',
      name: 'Remedi Clinic (Adoni)',
      address: 'Collectorate Road, Adoni, Andhra Pradesh',
      phone: '8886699775',
      doctorsCount: 1,
      staffCount: 1,
      isPrimary: false,
      status: 'Inactive'
    }
  ]);

  const handleAddBranchSubmit = (e) => {
    e.preventDefault();
    if (!newBranch.name.trim() || !newBranch.address.trim()) return;
    const item = {
      id: `branch-${Date.now()}`,
      name: newBranch.name.trim(),
      address: newBranch.address.trim(),
      phone: newBranch.phone || '9440900000',
      doctorsCount: parseInt(newBranch.doctorsCount) || 1,
      staffCount: parseInt(newBranch.staffCount) || 2,
      isPrimary: false,
      status: 'Active'
    };
    setBranches(prev => [...prev, item]);
    setShowAddBranchModal(false);
    setNewBranch({ name: '', address: '', city: 'Kurnool', phone: '', doctorsCount: 1, staffCount: 2 });
  };

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Bar (Image 11 Screen 1) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Branch Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage all your clinic locations
          </p>
        </div>

        <button
          onClick={() => setShowAddBranchModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[0.875rem] bg-[#064E3B] hover:bg-[#047857] text-white font-display font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Branch</span>
        </button>
      </div>

      {/* ── 4 KPI Summary Cards (Image 11 Screen 1) ──────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-[0.625rem] bg-emerald-50 text-[#064E3B] flex items-center justify-center mb-1">
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-2xl font-display font-bold text-ink">
            {branches.length}
          </div>
          <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
            Total Branches
          </span>
        </div>

        <div className="p-4 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-[0.625rem] bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="text-2xl font-display font-bold text-ink">
            1
          </div>
          <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
            Primary Branch
          </span>
        </div>

        <div className="p-4 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-[0.625rem] bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-2xl font-display font-bold text-ink">
            8
          </div>
          <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
            Total Doctors
          </span>
        </div>

        <div className="p-4 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-1">
          <div className="w-8 h-8 rounded-[0.625rem] bg-teal-50 text-teal-600 flex items-center justify-center mb-1">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="text-2xl font-display font-bold text-ink">
            12
          </div>
          <span className="text-[0.6875rem] font-bold text-slate-500 uppercase tracking-wider block">
            Total Staff
          </span>
        </div>
      </div>

      {/* ── Branch Cards List (Image 11 Screen 1) ────────────────────── */}
      <div className="space-y-3.5">
        {branches.map((branch) => (
          <div
            key={branch.id}
            onClick={() => navigate(`/clinic-admin/branch/${branch.id}`)}
            className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-[1.25rem] bg-emerald-50 text-[#064E3B] border border-emerald-200 flex items-center justify-center flex-shrink-0 font-bold">
                <Building2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-base text-ink group-hover:text-[#064E3B] transition-colors">
                    {branch.name}
                  </h3>
                  {branch.isPrimary ? (
                    <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-teal-50 text-teal-700 border border-teal-200">
                      Primary
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                      Branch
                    </span>
                  )}
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold border",
                    branch.status === 'Active'
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  )}>
                    {branch.status}
                  </span>
                </div>

                <p className="text-xs text-slate-500 flex items-start gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span>{branch.address}</span>
                </p>

                <div className="flex items-center gap-4 text-xs font-mono text-slate-600 pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{branch.doctorsCount}</strong> Doctors
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    <strong>{branch.staffCount}</strong> Staff
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2 rounded-[0.75rem] bg-slate-50 group-hover:bg-emerald-50 text-slate-400 group-hover:text-[#064E3B] transition-colors self-end sm:self-center">
              <ChevronRight className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Add Branch Modal */}
      {showAddBranchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[1.75rem] border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-ink">Add New Clinic Branch</h3>
              <button onClick={() => setShowAddBranchModal(false)} className="p-1 text-slate-400 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddBranchSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Branch Name *</label>
                <input
                  type="text"
                  value={newBranch.name}
                  onChange={(e) => setNewBranch({ ...newBranch, name: e.target.value })}
                  placeholder="e.g. Remedi Clinic (Adoni Extension)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Address *</label>
                <input
                  type="text"
                  value={newBranch.address}
                  onChange={(e) => setNewBranch({ ...newBranch, address: e.target.value })}
                  placeholder="Street and landmark..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Phone Number</label>
                <input
                  type="tel"
                  value={newBranch.phone}
                  onChange={(e) => setNewBranch({ ...newBranch, phone: e.target.value })}
                  placeholder="9440984397"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-[0.875rem] bg-[#064E3B] text-white font-bold text-xs mt-2"
              >
                Register Clinic Branch
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
