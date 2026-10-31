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
  ShieldCheck, 
  Building2, 
  MoreVertical,
  Stethoscope
} from 'lucide-react';
import InviteDoctorModal from './InviteDoctorModal';
import { cn } from '../../lib/utils';

export default function DoctorDirectory() {
  const [activeTab, setActiveTab] = useState('All Doctors (5)');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  const [doctors, setDoctors] = useState([
    {
      id: 1,
      name: 'Dr. T. Karthik',
      qualifications: 'MBBS, MD (General Medicine)',
      specialty: 'General Medicine',
      branch: 'Main Branch (Kurnool)',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Dr. K. Ramya',
      qualifications: 'MBBS, MD. DVL',
      specialty: 'Dermatology & Cosmetology',
      branch: 'Main Branch (Kurnool)',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Dr. D V Subba Reddy',
      qualifications: 'MS (Orthopedics)',
      specialty: 'Orthopedics',
      branch: 'Main Branch (Kurnool)',
      status: 'Active'
    },
    {
      id: 4,
      name: 'Dr. S. Narayana',
      qualifications: 'MD (Cardiology)',
      specialty: 'Cardiology',
      branch: 'Main Branch (Kurnool)',
      status: 'Active'
    },
    {
      id: 5,
      name: 'Dr. P. Mehta',
      qualifications: 'MBBS, MS (ENT)',
      specialty: 'ENT',
      branch: 'Main Branch (Kurnool)',
      status: 'Inactive'
    }
  ]);

  const tabs = ['All Doctors (5)', 'Active (4)', 'Inactive (1)'];

  const filteredDoctors = doctors.filter((doc) => {
    if (activeTab === 'Active (4)' && doc.status !== 'Active') return false;
    if (activeTab === 'Inactive (1)' && doc.status !== 'Inactive') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        doc.name.toLowerCase().includes(q) ||
        doc.specialty.toLowerCase().includes(q) ||
        doc.branch.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleInviteSuccess = (invited) => {
    const newDoc = {
      id: Date.now(),
      name: invited.fullName.startsWith('Dr.') ? invited.fullName : `Dr. ${invited.fullName}`,
      qualifications: invited.qualification || 'MBBS',
      specialty: invited.specialty,
      branch: 'Main Branch (Kurnool)',
      status: 'Active'
    };
    setDoctors(prev => [...prev, newDoc]);
  };

  return (
    <div className="space-y-5">
      
      {/* ── Top Header Bar (Image 13 Screen 2) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Doctor Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage doctors in your clinic
          </p>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[0.875rem] bg-[#064E3B] hover:bg-[#047857] text-white font-display font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Doctor</span>
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
              placeholder="Search by name, specialty or location..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-[1rem] text-xs text-ink outline-none focus:border-[#064E3B] shadow-2xs"
            />
          </div>
          <button className="p-2.5 bg-white border border-slate-200 rounded-[1rem] text-slate-500 hover:text-ink">
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Status Filter Tabs */}
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
      </div>

      {/* ── Doctors Roster List (Image 13 Screen 2) ─────────────────── */}
      <div className="space-y-3">
        {filteredDoctors.map((doc) => (
          <div
            key={doc.id}
            className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-3 hover:border-slate-300 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-[1rem] bg-emerald-50 border border-emerald-200 text-[#064E3B] flex items-center justify-center font-display font-bold text-base flex-shrink-0">
                {doc.name.replace(/^Dr\.?\s*/i, '').charAt(0)}
              </div>
              <div>
                <h3 className="font-display font-bold text-sm text-ink">{doc.name}</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {doc.qualifications} · <span className="text-slate-700">{doc.specialty}</span>
                </p>
                <p className="text-[0.6875rem] text-slate-400 flex items-center gap-1 mt-0.5">
                  <Building2 className="w-3 h-3" />
                  <span>{doc.branch}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border",
                doc.status === 'Active'
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              )}>
                {doc.status}
              </span>
              <button className="p-1 text-slate-400 hover:text-ink">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Doctor Modal */}
      <InviteDoctorModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onInviteSuccess={handleInviteSuccess}
      />

    </div>
  );
}
