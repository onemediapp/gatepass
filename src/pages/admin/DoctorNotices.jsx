/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { subscribeDoctorNotices, createNotice, updateNotice, deleteNotice } from '../../lib/db/notices';
import { useAuth } from '../../lib/auth';
import { 
  Bell, 
  Plus, 
  Pin, 
  Trash2, 
  Check, 
  X, 
  AlertCircle, 
  Info, 
  Sparkles, 
  Calendar,
  Tag,
  Eye,
  Megaphone,
  Ban,
  Clock
} from 'lucide-react';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import ToggleSwitch from '../../components/ui/ToggleSwitch';
import { cn } from '../../lib/utils';

export default function DoctorNotices() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'looking_for' | 'not_accepting' | 'closure'
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formType, setFormType] = useState('looking_for');
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [formCategories, setFormCategories] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [formExpiryDate, setFormExpiryDate] = useState('');

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeDoctorNotices(user.uid, (list) => {
      setNotices(list);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  const currentlyPinned = useMemo(() => {
    return notices.find((n) => n.pinned && n.isActive);
  }, [notices]);

  // Tab counts
  const { filteredNotices, counts } = useMemo(() => {
    let looking = 0;
    let notAccepting = 0;
    let closure = 0;

    notices.forEach(n => {
      if (n.type === 'looking_for') looking++;
      else if (n.type === 'not_accepting') notAccepting++;
      else if (n.type === 'closure') closure++;
    });

    const c = {
      all: notices.length,
      looking_for: looking,
      not_accepting: notAccepting,
      closure: closure
    };

    const filtered = notices.filter(n => {
      if (filterTab === 'looking_for') return n.type === 'looking_for';
      if (filterTab === 'not_accepting') return n.type === 'not_accepting';
      if (filterTab === 'closure') return n.type === 'closure';
      return true;
    });

    return { filteredNotices: filtered, counts: c };
  }, [notices, filterTab]);

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!user || !formTitle.trim() || !formBody.trim()) return;
    setIsSubmitting(true);

    try {
      if (formPinned && currentlyPinned) {
        await updateNotice(currentlyPinned.id, { pinned: false });
      }

      const cats = formCategories
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      await createNotice({
        doctorId: user.uid,
        type: formType,
        title: formTitle.trim().slice(0, 80),
        body: formBody.trim().slice(0, 240),
        categories: cats,
        pinned: formPinned,
        expiresAt: formExpiryDate ? new Date(formExpiryDate) : null,
        isActive: true,
      });

      setShowCreateModal(false);
      setFormTitle('');
      setFormBody('');
      setFormCategories('');
      setFormPinned(false);
      setFormExpiryDate('');
    } catch (err) {
      alert(err.message || 'Failed to create notice');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (notice) => {
    try {
      if (!notice.pinned && currentlyPinned) {
        await updateNotice(currentlyPinned.id, { pinned: false });
      }
      await updateNotice(notice.id, { pinned: !notice.pinned });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this notice?')) return;
    try {
      await deleteNotice(id);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 max-w-4xl mx-auto font-sans pb-10">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-36 rounded-card" />
        <Skeleton className="w-full h-36 rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans selection:bg-amber-100 selection:text-sand-600 pb-20">
      
      {/* ── Top Header (Reference Image 2 Screen 3) ─────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Clinic Notices</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Create and manage notices for representatives.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-800 active:scale-95 text-white rounded-[0.875rem] text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>Create Notice</span>
        </button>
      </div>

      {/* ── Filter Tabs (Reference Image 2 Screen 3) ────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setFilterTab('all')}
          className={cn(
            "px-4 py-2 rounded-[0.75rem] text-xs font-bold transition-all shrink-0 cursor-pointer",
            filterTab === 'all'
              ? "bg-navy-900 text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-line"
          )}
        >
          All ({counts.all})
        </button>
        <button
          onClick={() => setFilterTab('looking_for')}
          className={cn(
            "px-4 py-2 rounded-[0.75rem] text-xs font-bold transition-all shrink-0 cursor-pointer",
            filterTab === 'looking_for'
              ? "bg-navy-900 text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-line"
          )}
        >
          Looking For ({counts.looking_for})
        </button>
        <button
          onClick={() => setFilterTab('not_accepting')}
          className={cn(
            "px-4 py-2 rounded-[0.75rem] text-xs font-bold transition-all shrink-0 cursor-pointer",
            filterTab === 'not_accepting'
              ? "bg-navy-900 text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-line"
          )}
        >
          Not Accepting ({counts.not_accepting})
        </button>
        <button
          onClick={() => setFilterTab('closure')}
          className={cn(
            "px-4 py-2 rounded-[0.75rem] text-xs font-bold transition-all shrink-0 cursor-pointer",
            filterTab === 'closure'
              ? "bg-navy-900 text-white shadow-2xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-line"
          )}
        >
          Closure ({counts.closure})
        </button>
      </div>

      {/* ── Notices List ────────────────────────────────────────────── */}
      {filteredNotices.length === 0 ? (
        <div className="bg-white rounded-[1.25rem] p-12 text-center border border-line shadow-card max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-[1.25rem] bg-navy-100 text-navy-900 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-ink-mute" />
          </div>
          <h2 className="text-base font-display font-bold text-ink mb-1">No notices found</h2>
          <p className="text-xs text-ink-soft max-w-xs mx-auto mb-4">
            Post focus areas (e.g. looking for GLP-1 products) or closure announcements.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-navy-900 text-white rounded-[0.75rem] text-xs font-semibold cursor-pointer"
          >
            Create Notice
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((n) => {
            const isLooking = n.type === 'looking_for';
            const isNotAccepting = n.type === 'not_accepting';
            const isClosure = n.type === 'closure';

            return (
              <div 
                key={n.id} 
                className="p-5 rounded-[1.5rem] bg-white border border-line shadow-card hover:border-slate-300 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* Badge */}
                    <span className={cn(
                      'px-3 py-1 rounded-full text-xs font-bold',
                      isLooking ? 'bg-teal-50 text-teal-700 border border-teal-200' :
                      isNotAccepting ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      isClosure ? 'bg-coral-50 text-coral-700 border border-coral-200' :
                      'bg-blue-50 text-blue-700 border border-blue-200'
                    )}>
                      {isLooking ? 'Looking For' : isNotAccepting ? 'Not Accepting' : isClosure ? 'Clinic Closure' : 'Information'}
                    </span>

                    <span className="px-2 py-0.5 rounded-full text-[0.625rem] font-bold font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>

                    {n.pinned && (
                      <span className="inline-flex items-center gap-1 text-[0.625rem] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        <Pin className="w-3 h-3 fill-amber-500" /> Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(n)}
                      className={cn(
                        'p-1.5 rounded-[0.5rem] transition-colors cursor-pointer',
                        n.pinned ? 'text-amber-500 bg-amber-50' : 'text-slate-400 hover:text-ink'
                      )}
                      title={n.pinned ? 'Unpin notice' : 'Pin notice'}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1.5 text-slate-400 hover:text-coral-600 rounded-[0.5rem] transition-colors cursor-pointer"
                      title="Delete notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-display font-bold text-ink">
                    {n.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mt-1">
                    {n.body}
                  </p>
                </div>

                {/* Date range & audience footer */}
                <div className="pt-2 border-t border-line/70 flex items-center justify-between text-[0.6875rem] text-slate-400">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Active until Nov 2026</span>
                  </div>
                  <div className="flex items-center gap-1 font-medium">
                    <Eye className="w-3.5 h-3.5" />
                    <span>Visible to all reps</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Create Notice Modal ───────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-navy-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[1.75rem] max-w-md w-full border border-line shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-display font-bold text-base text-ink">New Clinic Notice</h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-slate-400 hover:text-ink"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-ink uppercase tracking-wider font-mono text-[0.625rem]">Notice Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[0.875rem] border border-line bg-white text-xs font-semibold text-ink focus:border-teal-500 focus:outline-none"
                >
                  <option value="looking_for">Looking For (Specialties / Products)</option>
                  <option value="not_accepting">Not Accepting (Categories / Full)</option>
                  <option value="closure">Clinic Closure (Leave / Emergency)</option>
                  <option value="info">General Information</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-ink uppercase tracking-wider font-mono text-[0.625rem]">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Looking for GLP-1 products"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[0.875rem] border border-line bg-white text-xs text-ink focus:border-teal-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-ink uppercase tracking-wider font-mono text-[0.625rem]">Notice Details</label>
                <textarea
                  required
                  placeholder="Enter detailed notice information for medical representatives..."
                  rows={3}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-[0.875rem] border border-line bg-white text-xs text-ink focus:border-teal-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-[1rem] bg-slate-50 border border-line">
                <span className="font-bold text-ink">Pin this notice to top</span>
                <input
                  type="checkbox"
                  checked={formPinned}
                  onChange={(e) => setFormPinned(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 rounded-[1.125rem] bg-navy-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-navy-800 transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4 text-teal-400" />
                  <span>{isSubmitting ? 'Posting...' : 'Post Notice'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
