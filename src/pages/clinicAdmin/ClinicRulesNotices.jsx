/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Megaphone, 
  Plus, 
  Info, 
  AlertCircle, 
  XCircle, 
  Calendar, 
  Building2, 
  MoreVertical, 
  X, 
  Check 
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function ClinicRulesNotices() {
  const [activeTab, setActiveTab] = useState('Active (5)');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    category: 'looking_for',
    scope: 'All Branches',
    content: ''
  });

  const [notices, setNotices] = useState([
    {
      id: 1,
      type: 'looking_for',
      typeLabel: 'Looking For',
      scope: 'All Branches',
      content: 'Looking for representatives from Derma, Skin care and Aesthetic products.',
      dateStr: '28 Oct 2026',
      status: 'Active'
    },
    {
      id: 2,
      type: 'info',
      typeLabel: 'Information',
      scope: 'Kurnool',
      content: 'Dr. K. Ramya will be available only in the morning session this week.',
      dateStr: '27 Oct 2026',
      status: 'Active'
    },
    {
      id: 3,
      type: 'closure',
      typeLabel: 'Clinic Closure',
      scope: 'Adoni',
      content: 'Adoni branch will be closed on 2 Nov 2026 due to CME.',
      dateStr: '2 Nov 2026',
      status: 'Active'
    },
    {
      id: 4,
      type: 'not_accepting',
      typeLabel: 'Not Accepting',
      scope: 'All Branches',
      content: 'Not accepting representatives from antibiotic category.',
      dateStr: '26 Oct 2026',
      status: 'Active'
    },
    {
      id: 5,
      type: 'schedule_change',
      typeLabel: 'Schedule Change',
      scope: 'Nandyal',
      content: 'Dr. T. Karthik evening session time changed to 6:30 PM.',
      dateStr: '29 Oct 2026',
      status: 'Scheduled'
    }
  ]);

  const tabs = ['Active (5)', 'Scheduled (1)', 'Expired (3)'];

  const filteredNotices = notices.filter(n => {
    if (activeTab === 'Active (5)' && n.status !== 'Active') return false;
    if (activeTab === 'Scheduled (1)' && n.status !== 'Scheduled') return false;
    if (activeTab === 'Expired (3)' && n.status !== 'Expired') return false;
    return true;
  });

  const getNoticeTheme = (type) => {
    switch (type) {
      case 'looking_for':
        return { bg: 'bg-amber-50 text-amber-700 border-amber-200', iconBg: 'bg-amber-100 text-amber-600', icon: Megaphone };
      case 'closure':
        return { bg: 'bg-rose-50 text-rose-700 border-rose-200', iconBg: 'bg-rose-100 text-rose-600', icon: AlertCircle };
      case 'not_accepting':
        return { bg: 'bg-slate-100 text-slate-700 border-slate-200', iconBg: 'bg-slate-200 text-slate-600', icon: XCircle };
      case 'schedule_change':
        return { bg: 'bg-purple-50 text-purple-700 border-purple-200', iconBg: 'bg-purple-100 text-purple-600', icon: Calendar };
      default:
        return { bg: 'bg-blue-50 text-blue-700 border-blue-200', iconBg: 'bg-blue-100 text-blue-600', icon: Info };
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newNotice.content.trim()) return;
    const item = {
      id: Date.now(),
      type: newNotice.category,
      typeLabel: newNotice.category === 'looking_for' ? 'Looking For' : newNotice.category === 'closure' ? 'Clinic Closure' : 'Information',
      scope: newNotice.scope,
      content: newNotice.content.trim(),
      dateStr: 'Today',
      status: 'Active'
    };
    setNotices(prev => [item, ...prev]);
    setShowCreateModal(false);
    setNewNotice({ title: '', category: 'looking_for', scope: 'All Branches', content: '' });
  };

  return (
    <div className="space-y-6">
      
      {/* ── Top Header Bar (Image 11 Screen 4) ───────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Clinic-wide Rules and Notices
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage rules and notices across all branches
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-[0.875rem] bg-[#064E3B] hover:bg-[#047857] text-white font-display font-bold text-xs shadow-md active:scale-95 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Notice</span>
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

      {/* ── Notices Cards List (Image 11 Screen 4) ───────────────────── */}
      <div className="space-y-3">
        {filteredNotices.map((n) => {
          const theme = getNoticeTheme(n.type);
          const Icon = theme.icon;

          return (
            <div
              key={n.id}
              className="p-4 sm:p-5 rounded-[1.25rem] bg-white border border-slate-200 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={cn("w-10 h-10 rounded-[0.875rem] flex items-center justify-center font-bold flex-shrink-0 mt-0.5", theme.iconBg)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold border", theme.bg)}>
                        {n.typeLabel}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {n.scope}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {n.status}
                      </span>
                    </div>

                    <p className="text-xs text-ink font-medium mt-1 leading-relaxed">
                      {n.content}
                    </p>

                    <p className="text-[0.6875rem] font-mono text-slate-400 mt-1">
                      📅 {n.dateStr}
                    </p>
                  </div>
                </div>

                <button className="p-1 text-slate-400 hover:text-ink">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Notice Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-[1.75rem] border border-slate-200 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-ink">Create Clinic Notice</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-slate-400 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Scope *</label>
                <select
                  value={newNotice.scope}
                  onChange={(e) => setNewNotice({ ...newNotice, scope: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                >
                  <option value="All Branches">All Branches</option>
                  <option value="Kurnool">Kurnool Primary Branch</option>
                  <option value="Nandyal">Nandyal Branch</option>
                  <option value="Adoni">Adoni Branch</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Notice Category *</label>
                <select
                  value={newNotice.category}
                  onChange={(e) => setNewNotice({ ...newNotice, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none"
                >
                  <option value="looking_for">Looking For (Representatives / Molecules)</option>
                  <option value="info">General Information</option>
                  <option value="closure">Clinic Closure / Holiday</option>
                  <option value="not_accepting">Not Accepting Specific Segments</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-semibold">Notice Message *</label>
                <textarea
                  rows={3}
                  value={newNotice.content}
                  onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
                  placeholder="Enter notice details for medical reps..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-[0.75rem] outline-none resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-[0.875rem] bg-[#064E3B] text-white font-bold text-xs mt-2"
              >
                Broadcast Clinic Notice
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
