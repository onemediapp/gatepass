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
  ShieldAlert,
  Calendar,
  Tag
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

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    if (!user || !formTitle.trim() || !formBody.trim()) return;
    setIsSubmitting(true);

    try {
      // Enforce max one pinned notice: unpin previous if setting new pin
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
    if (window.confirm('Delete this notice?')) {
      await deleteNotice(id);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-36 rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 font-sans selection:bg-amber-100 selection:text-sand-600">
      
      {/* ── Header & Action ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink">Clinic Notices</h1>
          <p className="text-xs text-ink-soft mt-0.5">
            Communicate requirements, focus areas, and clinic closures to medical reps
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-900 hover:bg-navy-700 active:scale-95 text-white rounded-[0.875rem] text-xs font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Notice</span>
        </button>
      </div>

      {/* ── Notices List ────────────────────────────────────────────── */}
      {notices.length === 0 ? (
        <div className="bg-white rounded-card p-12 text-center border border-line shadow-card max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-[1.25rem] bg-navy-100 text-navy-900 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-ink-mute" />
          </div>
          <h2 className="text-base font-display font-bold text-ink mb-1">No active notices</h2>
          <p className="text-xs text-ink-soft max-w-xs mx-auto mb-4">
            Post focus areas (e.g. looking for cardiology formulations) or closure alerts.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-navy-900 text-white rounded-[0.75rem] text-xs font-semibold"
          >
            Create Notice
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {notices.map((n) => {
            const edgeTheme = n.type === 'looking_for' ? 'teal' : n.type === 'not_accepting' ? 'coral' : n.type === 'closure' ? 'coral' : 'navy';
            return (
              <EdgeCard key={n.id} edge={edgeTheme} className="p-5">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'px-2 py-0.5 rounded-[0.5rem] text-[0.625rem] font-mono font-semibold uppercase',
                      n.type === 'looking_for' ? 'bg-teal-50 text-teal-600' :
                      n.type === 'not_accepting' ? 'bg-coral-50 text-coral-600' :
                      n.type === 'closure' ? 'bg-coral-50 text-coral-600' : 'bg-navy-100 text-navy-900'
                    )}>
                      {n.type.replace('_', ' ')}
                    </span>
                    {n.pinned && (
                      <span className="inline-flex items-center gap-1 text-[0.625rem] font-bold text-amber-500 bg-amber-100 px-2 py-0.5 rounded-full">
                        <Pin className="w-3 h-3 fill-amber-500" /> Pinned
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleTogglePin(n)}
                      className={cn(
                        'p-1.5 rounded-[0.5rem] transition-colors',
                        n.pinned ? 'text-amber-500 bg-amber-50' : 'text-ink-mute hover:text-ink'
                      )}
                      title={n.pinned ? 'Unpin notice' : 'Pin notice'}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(n.id)}
                      className="p-1.5 text-ink-mute hover:text-coral-600 rounded-[0.5rem] transition-colors"
                      title="Delete notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-display font-bold text-ink mb-1">
                  {n.title}
                </h3>
                <p className="text-xs text-ink-soft leading-relaxed mb-3">
                  {n.body}
                </p>

                {n.categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-line/60">
                    {n.categories.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded-[0.375rem] bg-cream-50 text-ink-soft border border-line text-[0.625rem] font-mono">
                        {c}
                      </span>
                    ))}
                  </div>
                )}
              </EdgeCard>
            );
          })}
        </div>
      )}

      {/* ── Create Notice Modal ─────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-md w-full space-y-4 shadow-card border border-line animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="text-base font-display font-bold text-ink">New Clinic Notice</h3>
              <button onClick={() => setShowCreateModal(false)} className="p-1 text-ink-mute hover:text-ink">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNotice} className="space-y-4">
              {/* Type Chips */}
              <div className="space-y-1.5">
                <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block">
                  Notice Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'looking_for', label: 'Looking for', desc: 'Specific medicines' },
                    { id: 'not_accepting', label: 'Not accepting', desc: 'Category soft warning' },
                    { id: 'closure', label: 'Closure', desc: 'OPD closed dates' },
                    { id: 'info', label: 'Information', desc: 'General protocol' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormType(t.id)}
                      className={cn(
                        'p-2.5 rounded-[0.75rem] border text-left transition-all text-xs',
                        formType === t.id
                          ? 'border-navy-900 bg-navy-900 text-white font-semibold'
                          : 'border-line bg-cream-50 text-ink hover:bg-white'
                      )}
                    >
                      <span className="block font-bold">{t.label}</span>
                      <span className={cn('text-[0.625rem]', formType === t.id ? 'text-white/70' : 'text-ink-mute')}>
                        {t.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block mb-1">
                  Title ({formTitle.length}/80)
                </label>
                <input
                  type="text"
                  required
                  maxLength={80}
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Looking for newer GLP-1 receptor agonists"
                  className="w-full p-2.5 rounded-[0.75rem] border border-line text-xs text-ink focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              {/* Body */}
              <div>
                <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block mb-1">
                  Message ({formBody.length}/240)
                </label>
                <textarea
                  required
                  rows={3}
                  maxLength={240}
                  value={formBody}
                  onChange={(e) => setFormBody(e.target.value)}
                  placeholder="Brief details about what clinical trials, studies, or samples you wish to see…"
                  className="w-full p-2.5 rounded-[0.75rem] border border-line text-xs text-ink focus:outline-none focus:ring-1 focus:ring-navy-900 resize-none"
                />
              </div>

              {/* Categories */}
              <div>
                <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block mb-1">
                  Categories (comma separated)
                </label>
                <input
                  type="text"
                  value={formCategories}
                  onChange={(e) => setFormCategories(e.target.value)}
                  placeholder="Diabetology, Endocrinology, Cardiology"
                  className="w-full p-2.5 rounded-[0.75rem] border border-line text-xs text-ink focus:outline-none focus:ring-1 focus:ring-navy-900"
                />
              </div>

              {/* Pinned Toggle */}
              <div className="flex items-center justify-between p-3 rounded-[0.75rem] bg-cream-50 border border-line">
                <div>
                  <span className="text-xs font-bold text-ink block">Pin to top</span>
                  <span className="text-[0.6875rem] text-ink-mute">Max one pinned notice across practice</span>
                </div>
                <ToggleSwitch checked={formPinned} onChange={setFormPinned} />
              </div>

              {/* Optional Expiry Date */}
              <div>
                <label className="text-[0.625rem] font-mono uppercase tracking-wider text-ink-mute block mb-1">
                  Auto-expire Date (Optional)
                </label>
                <input
                  type="date"
                  value={formExpiryDate}
                  onChange={(e) => setFormExpiryDate(e.target.value)}
                  className="w-full p-2 rounded-[0.75rem] border border-line text-xs text-ink bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-line">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2.5 bg-cream-50 text-ink rounded-[0.875rem] text-xs font-semibold hover:bg-line"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="py-2.5 bg-navy-900 text-white rounded-[0.875rem] text-xs font-semibold hover:bg-navy-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting…' : 'Publish Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
