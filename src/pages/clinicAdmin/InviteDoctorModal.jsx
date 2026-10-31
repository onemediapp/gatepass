/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ArrowLeft, Send, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function InviteDoctorModal({ isOpen, onClose, onInviteSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    specialty: 'General Medicine',
    qualification: '',
    designation: 'Consultant',
    branches: ['main']
  });
  const [submitting, setSubmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleBranch = (branchId) => {
    setFormData(prev => {
      const branches = prev.branches.includes(branchId)
        ? prev.branches.filter(b => b !== branchId)
        : [...prev.branches, branchId];
      return { ...prev, branches };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSentSuccess(true);
      setTimeout(() => {
        setSentSuccess(false);
        if (onInviteSuccess) onInviteSuccess(formData);
        onClose();
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-[2rem] border border-slate-200 p-6 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Header (Image 13 Screen 3) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1.5 rounded-[0.5rem] hover:bg-slate-100 text-slate-500"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="font-display font-bold text-lg text-ink">
                Invite Doctor
              </h2>
              <p className="text-xs text-slate-500">
                Send an invitation to join your clinic on Gatepass
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-[0.5rem] hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          {/* SECTION 1: Doctor Information */}
          <div className="space-y-3 pt-1">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold block">
              Doctor Information
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Full Name *</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Enter doctor's full name"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] text-ink outline-none focus:border-[#064E3B]"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+91 94409 84397"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] text-ink outline-none focus:border-[#064E3B]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Email ID *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="doctor@remediclinic.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] text-ink outline-none focus:border-[#064E3B]"
                  required
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Specialty *</label>
                <select
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] text-ink outline-none focus:border-[#064E3B]"
                >
                  <option value="General Medicine">General Medicine</option>
                  <option value="Dermatology & Cosmetology">Dermatology & Cosmetology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="ENT">ENT</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="e.g. MBBS, MD, DVL"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] text-ink outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Designation</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                  placeholder="e.g. Consultant, Visiting Doctor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] text-ink outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: Branch Access Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-200">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold block">
              Branch Access
            </span>
            <p className="text-[0.6875rem] text-slate-500 mb-2">
              Select the branches where this doctor will practice
            </p>

            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded-[0.875rem] bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.branches.includes('main')}
                  onChange={() => toggleBranch('main')}
                  className="mt-0.5 w-4 h-4 accent-[#064E3B]"
                />
                <div>
                  <p className="font-bold text-ink">Main Branch (Remedi Clinic)</p>
                  <p className="text-[0.6875rem] text-slate-500">Beside Vijaya Diagnostics, Gayathri Estates, Kurnool</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-[0.875rem] bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.branches.includes('secondary')}
                  onChange={() => toggleBranch('secondary')}
                  className="mt-0.5 w-4 h-4 accent-[#064E3B]"
                />
                <div>
                  <p className="font-bold text-ink">Secondary Branch (Nandyal)</p>
                  <p className="text-[0.6875rem] text-slate-500">Main Road, Nandyal</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-[0.875rem] bg-slate-50 border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.branches.includes('west')}
                  onChange={() => toggleBranch('west')}
                  className="mt-0.5 w-4 h-4 accent-[#064E3B]"
                />
                <div>
                  <p className="font-bold text-ink">West Branch (Adoni)</p>
                  <p className="text-[0.6875rem] text-slate-500">Collectorate Road, Adoni</p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-[0.875rem] bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 rounded-[0.875rem] bg-[#064E3B] hover:bg-[#047857] text-white font-display font-bold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {sentSuccess ? (
                <><Check className="w-4 h-4 text-emerald-300" /> Invitation Sent!</>
              ) : (
                <><Send className="w-4 h-4" /> Send Invitation</>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
