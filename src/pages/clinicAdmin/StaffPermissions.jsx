/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  ShieldCheck, 
  Phone, 
  ChevronRight, 
  X, 
  Check 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function StaffPermissions() {
  const [activeTab, setActiveTab] = useState('All Staff (6)');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'Receptionist',
    mobile: '',
    permissions: ['Appointments', 'Check-in']
  });

  const [staffList, setStaffList] = useState([
    {
      id: 1,
      name: 'Priya Reddy',
      role: 'Receptionist',
      mobile: '+91 98765 43210',
      permissions: ['Appointments', 'Check-in', 'Notices'],
      status: 'Active'
    },
    {
      id: 2,
      name: 'Suresh Kumar',
      role: 'Lab Technician',
      mobile: '+91 98765 43211',
      permissions: ['Lab', 'Reports', 'Patients'],
      status: 'Active'
    },
    {
      id: 3,
      name: 'Anitha R',
      role: 'Pharmacist',
      mobile: '+91 98765 43212',
      permissions: ['Pharmacy', 'Inventory', 'Sales'],
      status: 'Active'
    },
    {
      id: 4,
      name: 'Ramesh Babu',
      role: 'Administrator',
      mobile: '+91 98765 43213',
      permissions: ['All Access'],
      status: 'Active'
    },
    {
      id: 5,
      name: 'Kavya Singh',
      role: 'Nurse',
      mobile: '+91 98765 43214',
      permissions: ['Check-in', 'Vitals', 'Patients'],
      status: 'Active'
    },
    {
      id: 6,
      name: 'Manoj Kumar',
      role: 'Front Desk',
      mobile: '+91 98765 43215',
      permissions: ['Appointments', 'Check-in'],
      status: 'Inactive'
    }
  ]);

  const tabs = ['All Staff (6)', 'Active (5)', 'Inactive (1)'];

  const filteredStaff = staffList.filter(s => {
    if (activeTab === 'Active (5)' && s.status !== 'Active') return false;
    if (activeTab === 'Inactive (1)' && s.status !== 'Inactive') return false;
    return true;
  });

  const handleAddStaffSubmit = (e) => {
    e.preventDefault();
    if (!newStaff.name.trim()) return;
    const item = {
      id: Date.now(),
      name: newStaff.name.trim(),
      role: newStaff.role,
      mobile: newStaff.mobile || '+91 94409 00000',
      permissions: newStaff.permissions,
      status: 'Active'
    };
    setStaffList(prev => [item, ...prev]);
    setShowAddStaffModal(false);
    setNewStaff({ name: '', role: 'Receptionist', mobile: '', permissions: ['Appointments', 'Check-in'] });
  };

  return (
    <div className="space-y-5">
      
      {/* ── Top Header Bar (Image 13 Screen 4) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Staff and Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage clinic staff and their access permissions
          </p>
        </div>

        <button
          onClick={() => setShowAddStaffModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[0.875rem] bg-[#064E3B] hover:bg-[#047857] text-white font-display font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Staff</span>
        </button>
      </div>

      {/* ── Filter Tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center bg-slate-200/70 p-1 rounded-[0.875rem] text-xs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-1.5 rounded-[0.625rem] font-semibold text-center transition-all cursor-pointer",
              activeTab === tab
                ? "bg-[#064E3B] text-white shadow-sm"
                : "text-slate-600 hover:text-ink"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Staff Roster List (Image 13 Screen 4) ────────────────────── */}
      <div className="space-y-3">
        {filteredStaff.map((staff) => (
          <div
            key={staff.id}
            className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 text-[#064E3B] border border-emerald-200 flex items-center justify-center font-display font-bold text-base flex-shrink-0">
                {staff.name.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold text-sm text-ink">{staff.name}</h3>
                  <span className="text-[0.6875rem] text-slate-500 font-medium">({staff.role})</span>
                </div>
                <p className="text-xs text-slate-400 font-mono flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>{staff.mobile}</span>
                </p>
                {/* Granular Permission Tags (Image 13 Screen 4) */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {staff.permissions.map((perm, pIdx) => (
                    <span
                      key={pIdx}
                      className="px-2 py-0.5 rounded-[0.375rem] bg-slate-100 text-slate-700 text-[0.625rem] font-mono font-semibold"
                    >
                      {perm}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border",
                staff.status === 'Active'
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              )}>
                {staff.status}
              </span>
              <button className="p-1 text-slate-400 hover:text-ink">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-[1.5rem] border border-slate-200 p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-ink">Add Staff Member</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="p-1 text-slate-400 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Staff Name *</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  placeholder="e.g. Priya Reddy"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Role *</label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                >
                  <option value="Receptionist">Receptionist</option>
                  <option value="Front Desk">Front Desk</option>
                  <option value="Nurse">Nurse</option>
                  <option value="Lab Technician">Lab Technician</option>
                  <option value="Pharmacist">Pharmacist</option>
                  <option value="Administrator">Administrator</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Mobile Number</label>
                <input
                  type="tel"
                  value={newStaff.mobile}
                  onChange={(e) => setNewStaff({ ...newStaff, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-[0.875rem] bg-[#064E3B] text-white font-bold text-xs mt-2"
              >
                Create Staff Account
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
