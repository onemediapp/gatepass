/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';
import { 
  getDoctor, 
  updateDoctor, 
  DEFAULT_REP_SCHEDULE, 
  DEFAULT_DOCTOR_LIMITS, 
  DEFAULT_DOCTOR_COMMS 
} from '../../lib/db/doctors';
import { hasConfiguredHours, DAYS_ORDER, FULL_DAY_LABELS } from '../../lib/schedule';
import { 
  ArrowLeft, 
  Check, 
  Save, 
  Calendar, 
  Sliders, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  Building2, 
  Info, 
  Plus, 
  Trash2, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import RepScheduleEditor from '../../components/doctor/RepScheduleEditor';
import Skeleton from '../../components/ui/Skeleton';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';

export default function DoctorScheduleSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('schedule'); // 'schedule' | 'limits' | 'comms'
  const [schedule, setSchedule] = useState(DEFAULT_REP_SCHEDULE);
  const [limits, setLimits] = useState(DEFAULT_DOCTOR_LIMITS);
  const [comms, setComms] = useState(DEFAULT_DOCTOR_COMMS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Quick reply input
  const [newQuickReply, setNewQuickReply] = useState('');

  useEffect(() => {
    async function fetchDoctorSettings() {
      if (!user) return;
      try {
        const dr = await getDoctor(user.uid);
        if (dr) {
          if (dr.repSchedule) {
            setSchedule({
              ...DEFAULT_REP_SCHEDULE,
              ...dr.repSchedule,
            });
          }
          if (dr.limits) {
            setLimits({
              ...DEFAULT_DOCTOR_LIMITS,
              ...dr.limits,
              dayLimits: {
                ...DEFAULT_DOCTOR_LIMITS.dayLimits,
                ...(dr.limits.dayLimits || {})
              }
            });
          }
          if (dr.comms) {
            setComms({
              ...DEFAULT_DOCTOR_COMMS,
              ...dr.comms,
              quickReplies: Array.isArray(dr.comms.quickReplies) ? dr.comms.quickReplies : []
            });
          }
        }
      } catch (err) {
        console.error('Error fetching doctor settings:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDoctorSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaveError('');
    setSaveSuccess(false);

    if (!hasConfiguredHours(schedule.weekly)) {
      setSaveError('You must configure at least one day with visit hours in the Weekly Schedule.');
      setActiveTab('schedule');
      return;
    }

    setSaving(true);
    try {
      await updateDoctor(user.uid, {
        repSchedule: schedule,
        limits: limits,
        comms: comms,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Error saving schedule & limits settings:', err);
      setSaveError('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateLimitField = (field, val) => {
    setLimits(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const updateDayLimit = (day, val) => {
    setLimits(prev => ({
      ...prev,
      dayLimits: {
        ...(prev.dayLimits || {}),
        [day]: Math.max(0, parseInt(val, 10) || 0)
      }
    }));
  };

  const updateCommsField = (field, val) => {
    setComms(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const addQuickReply = () => {
    if (!newQuickReply.trim()) return;
    const current = Array.isArray(comms.quickReplies) ? comms.quickReplies : [];
    if (!current.includes(newQuickReply.trim())) {
      setComms(prev => ({
        ...prev,
        quickReplies: [...current, newQuickReply.trim()]
      }));
    }
    setNewQuickReply('');
  };

  const removeQuickReply = (index) => {
    const current = Array.isArray(comms.quickReplies) ? comms.quickReplies : [];
    setComms(prev => ({
      ...prev,
      quickReplies: current.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 font-sans">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-12 rounded-[0.875rem]" />
        <Skeleton className="w-full h-96 rounded-[1.25rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-sans selection:bg-amber-100 selection:text-sand-600 pb-24">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-[0.75rem] bg-white border border-line text-ink hover:bg-cream-50 transition-colors shadow-sm"
            title="Go back"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-ink">Schedule & Practice Rules</h1>
            <p className="text-xs text-ink-soft">Control visit hours, multi-ledger quotas, and rep communication rules.</p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !hasConfiguredHours(schedule.weekly)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-navy-900 hover:bg-navy-700 text-white rounded-[0.875rem] text-xs font-bold transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex-shrink-0"
        >
          {saving ? (
            'Saving...'
          ) : saveSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-teal-400" /> Saved!
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5 text-amber-500" /> Save All Settings
            </>
          )}
        </button>
      </div>

      {saveSuccess && (
        <div className="mb-4 p-3.5 rounded-[0.875rem] bg-teal-50 border border-teal-600/30 text-teal-700 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
          Settings updated successfully! Reps will immediately see updated slots, caps, and communication rules.
        </div>
      )}

      {saveError && (
        <div className="mb-4 p-3.5 rounded-[0.875rem] bg-coral-50 border border-coral-600/30 text-coral-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-coral-600 flex-shrink-0" />
          {saveError}
        </div>
      )}

      {/* Segmented Control Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-line rounded-[1rem] shadow-sm mb-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[0.75rem] text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-ink-soft hover:text-ink hover:bg-cream-50'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Schedule & Overrides
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('limits')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[0.75rem] text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'limits'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-ink-soft hover:text-ink hover:bg-cream-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Limits & Multi-Ledger Caps
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comms')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-[0.75rem] text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'comms'
              ? 'bg-navy-900 text-white shadow-sm'
              : 'text-ink-soft hover:text-ink hover:bg-cream-50'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Communication & WhatsApp
        </button>
      </div>

      {/* TAB 1: Schedule & Overrides */}
      {activeTab === 'schedule' && (
        <EdgeCard edge="navy" className="p-5 sm:p-6">
          <RepScheduleEditor
            schedule={schedule}
            onChange={setSchedule}
          />
        </EdgeCard>
      )}

      {/* TAB 2: Limits & Multi-Ledger Caps */}
      {activeTab === 'limits' && (
        <div className="space-y-6">
          <EdgeCard edge="amber" className="p-5 sm:p-6 space-y-6">
            <div className="flex items-start gap-3 pb-4 border-b border-line">
              <div className="w-9 h-9 rounded-[0.75rem] bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-ink">Multi-Ledger Quotas & Caps</h2>
                <p className="text-xs text-ink-soft">
                  Gatepass enforces caps in real-time across four atomic ledgers: per-slot, per-day, per-week, and per-company.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Max Reps Per Slot */}
              <div className="space-y-1.5 p-4 rounded-[1rem] bg-cream-50/70 border border-line/60">
                <label className="font-mono text-xs uppercase tracking-wider text-ink font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-navy-900" /> Max Reps per Slot
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={limits.maxRepsPerSlot ?? 1}
                  onChange={(e) => updateLimitField('maxRepsPerSlot', Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 rounded-[0.75rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500 shadow-sm"
                />
                <p className="text-[0.6875rem] text-ink-mute">
                  Standard is <strong>1 rep</strong> per slot. Setting 2 allows double-booking when you have a waiting area.
                </p>
              </div>

              {/* Max Reps Per Day */}
              <div className="space-y-1.5 p-4 rounded-[1rem] bg-cream-50/70 border border-line/60">
                <label className="font-mono text-xs uppercase tracking-wider text-ink font-semibold flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-navy-900" /> Default Max Visits / Day
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={limits.maxRepsPerDay ?? 3}
                  onChange={(e) => updateLimitField('maxRepsPerDay', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 rounded-[0.75rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500 shadow-sm"
                />
                <p className="text-[0.6875rem] text-ink-mute">
                  Default daily ceiling across all visit slots. <code>0</code> = No daily cap.
                </p>
              </div>

              {/* Max Reps Per Week */}
              <div className="space-y-1.5 p-4 rounded-[1rem] bg-cream-50/70 border border-line/60">
                <label className="font-mono text-xs uppercase tracking-wider text-ink font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Max Reps per Week (Week Ledger)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={limits.maxRepsPerWeek ?? 0}
                  onChange={(e) => updateLimitField('maxRepsPerWeek', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 rounded-[0.75rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500 shadow-sm"
                />
                <p className="text-[0.6875rem] text-ink-mute">
                  Absolute weekly quota across Monday–Sunday. When reached, shows <em>"Week full"</em>. <code>0</code> = No weekly cap.
                </p>
              </div>

              {/* Max Per Company Per Day */}
              <div className="space-y-1.5 p-4 rounded-[1rem] bg-cream-50/70 border border-line/60">
                <label className="font-mono text-xs uppercase tracking-wider text-ink font-semibold flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-sand-600" /> Max / Pharma Company / Day
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={limits.maxPerCompanyPerDay ?? 1}
                  onChange={(e) => updateLimitField('maxPerCompanyPerDay', Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3 py-2 rounded-[0.75rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500 shadow-sm"
                />
                <p className="text-[0.6875rem] text-ink-mute">
                  Prevents multiple reps from the same pharma firm (e.g. Sun Pharma) on the same day. <code>0</code> = Unlimited.
                </p>
              </div>

              {/* Minimum Lead Time */}
              <div className="space-y-1.5 p-4 rounded-[1rem] bg-cream-50/70 border border-line/60">
                <label className="font-mono text-xs uppercase tracking-wider text-ink font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-navy-900" /> Minimum Lead Time (Minutes)
                </label>
                <select
                  value={limits.minLeadMinutes ?? 120}
                  onChange={(e) => updateLimitField('minLeadMinutes', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-[0.75rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500 shadow-sm"
                >
                  <option value={0}>No minimum (Instant booking)</option>
                  <option value={30}>30 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={120}>2 Hours (Recommended)</option>
                  <option value={240}>4 Hours</option>
                  <option value={1440}>24 Hours (Next-day only)</option>
                </select>
                <p className="text-[0.6875rem] text-ink-mute">
                  Slots starting sooner than this lead time show as <em>"Too soon to book"</em>.
                </p>
              </div>

              {/* Cancellation Cutoff Time */}
              <div className="space-y-1.5 p-4 rounded-[1rem] bg-cream-50/70 border border-line/60">
                <label className="font-mono text-xs uppercase tracking-wider text-ink font-semibold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-coral-600" /> Late Cancel Cutoff (Minutes)
                </label>
                <select
                  value={limits.cancelCutoffMinutes ?? 60}
                  onChange={(e) => updateLimitField('cancelCutoffMinutes', parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-[0.75rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500 shadow-sm"
                >
                  <option value={30}>30 Minutes before visit</option>
                  <option value={60}>1 Hour before visit (Recommended)</option>
                  <option value={120}>2 Hours before visit</option>
                  <option value={240}>4 Hours before visit</option>
                </select>
                <p className="text-[0.6875rem] text-ink-mute">
                  Cancellations within this cutoff window are flagged as <code>lateCancel: true</code>.
                </p>
              </div>

            </div>

            {/* Weekday Specific Day Limits */}
            <div className="pt-4 border-t border-line space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-semibold">
                    Custom Daily Quotas by Day of Week
                  </h3>
                  <p className="text-[0.6875rem] text-ink-mute">
                    Override the default daily ceiling for heavy or light OP clinic days. Set <code>0</code> to use general daily cap.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 pt-1">
                {DAYS_ORDER.map((d) => (
                  <div key={d} className="p-2.5 rounded-[0.75rem] bg-white border border-line text-center shadow-2xs">
                    <span className="font-mono text-[0.6875rem] font-bold text-ink uppercase block mb-1">
                      {FULL_DAY_LABELS[d].slice(0, 3)}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={limits.dayLimits?.[d] ?? 0}
                      onChange={(e) => updateDayLimit(d, e.target.value)}
                      className="w-full text-center px-1.5 py-1 rounded-[0.5rem] border border-line bg-cream-50 font-mono text-xs text-ink outline-none focus:border-navy-500"
                    />
                    <span className="text-[0.625rem] text-ink-mute block mt-1">
                      {(limits.dayLimits?.[d] || 0) > 0 ? `${limits.dayLimits[d]} reps` : 'Default'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </EdgeCard>
        </div>
      )}

      {/* TAB 3: Communication & WhatsApp */}
      {activeTab === 'comms' && (
        <div className="space-y-6">
          <EdgeCard edge="teal" className="p-5 sm:p-6 space-y-6">
            <div className="flex items-start gap-3 pb-4 border-b border-line">
              <div className="w-9 h-9 rounded-[0.75rem] bg-teal-500/10 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-ink">Communication & WhatsApp Gateways</h2>
                <p className="text-xs text-ink-soft">
                  Control how medical reps request visits, when direct WhatsApp links appear, and review request inboxes.
                </p>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-4">
              
              {/* Require Visit Reason */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-[1rem] bg-cream-50/70 border border-line/60">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-ink block">
                    Require Visit Reason
                  </label>
                  <p className="text-[0.6875rem] text-ink-mute max-w-lg">
                    Reps must select a reason chip (*New product launch*, *Clinical trial data*, *Sample drop*, *Follow-up*, etc.) when requesting an appointment.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateCommsField('requireReason', !comms.requireReason)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    comms.requireReason ? 'bg-teal-600' : 'bg-line-strong'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      comms.requireReason ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Allow Personalized Visit Message */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-[1rem] bg-cream-50/70 border border-line/60">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-ink block">
                    Allow Personalized Visit Message
                  </label>
                  <p className="text-[0.6875rem] text-ink-mute max-w-lg">
                    Allows reps to include a short personalized note (max 300 characters) with their request.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateCommsField('allowVisitMessage', !comms.allowVisitMessage)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    comms.allowVisitMessage ? 'bg-teal-600' : 'bg-line-strong'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      comms.allowVisitMessage ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Accept Review Requests (Offline Reviews) */}
              <div className="flex items-start justify-between gap-4 p-4 rounded-[1rem] bg-cream-50/70 border border-line/60">
                <div className="space-y-0.5">
                  <label className="text-xs font-bold text-ink block">
                    Accept Offline Digital Reviews & Reconsider Requests
                  </label>
                  <p className="text-[0.6875rem] text-ink-mute max-w-lg">
                    Reps can submit digital drug monographs, paper abstracts, or brief reconsider requests directly to your Reviews tab without occupying clinic time slots.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => updateCommsField('allowReviewRequests', !comms.allowReviewRequests)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    comms.allowReviewRequests ? 'bg-teal-600' : 'bg-line-strong'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      comms.allowReviewRequests ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

            </div>

            {/* WhatsApp Access Mode */}
            <div className="pt-4 border-t border-line space-y-3">
              <label className="font-mono text-xs uppercase tracking-wider text-ink font-semibold block">
                WhatsApp Link Mode
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                
                <div
                  onClick={() => updateCommsField('whatsappMode', 'after_decision')}
                  className={`p-4 rounded-[1rem] border cursor-pointer transition-all ${
                    comms.whatsappMode === 'after_decision'
                      ? 'bg-teal-50/60 border-teal-600/60 shadow-sm ring-1 ring-teal-600/20'
                      : 'bg-white border-line hover:border-ink-mute'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-ink">After Decision</span>
                    <MonoTag size="xs" color="teal">Recommended</MonoTag>
                  </div>
                  <p className="text-[0.6875rem] text-ink-soft leading-relaxed">
                    WhatsApp button is only shown to reps after their request has been approved or declined.
                  </p>
                </div>

                <div
                  onClick={() => updateCommsField('whatsappMode', 'always')}
                  className={`p-4 rounded-[1rem] border cursor-pointer transition-all ${
                    comms.whatsappMode === 'always'
                      ? 'bg-teal-50/60 border-teal-600/60 shadow-sm ring-1 ring-teal-600/20'
                      : 'bg-white border-line hover:border-ink-mute'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-ink">Always Open</span>
                  </div>
                  <p className="text-[0.6875rem] text-ink-soft leading-relaxed">
                    Reps can see your WhatsApp contact button immediately on your doctor profile.
                  </p>
                </div>

                <div
                  onClick={() => updateCommsField('whatsappMode', 'never')}
                  className={`p-4 rounded-[1rem] border cursor-pointer transition-all ${
                    comms.whatsappMode === 'never'
                      ? 'bg-teal-50/60 border-teal-600/60 shadow-sm ring-1 ring-teal-600/20'
                      : 'bg-white border-line hover:border-ink-mute'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-xs text-ink">Direct Portal Only</span>
                  </div>
                  <p className="text-[0.6875rem] text-ink-soft leading-relaxed">
                    Hides all WhatsApp contact buttons. All status updates happen purely inside the Gatepass web app.
                  </p>
                </div>

              </div>
            </div>

            {/* Quick Replies / Notice Templates */}
            <div className="pt-4 border-t border-line space-y-3">
              <label className="font-mono text-xs uppercase tracking-wider text-ink font-semibold block">
                Quick Reply Templates
              </label>
              <p className="text-[0.6875rem] text-ink-mute">
                Frequent clinic messages for fast one-tap replies or emergency broadcasts.
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Please bring product clinical trial summary..."
                  value={newQuickReply}
                  onChange={(e) => setNewQuickReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addQuickReply();
                    }
                  }}
                  className="flex-1 px-3 py-2 rounded-[0.75rem] border border-line bg-white font-mono text-xs text-ink outline-none focus:border-navy-500"
                />
                <button
                  type="button"
                  onClick={addQuickReply}
                  disabled={!newQuickReply.trim()}
                  className="inline-flex items-center gap-1 px-3.5 py-2 bg-cream-50 hover:bg-white text-ink font-semibold rounded-[0.75rem] border border-line text-xs disabled:opacity-40 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Template
                </button>
              </div>

              {Array.isArray(comms.quickReplies) && comms.quickReplies.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {comms.quickReplies.map((reply, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-[0.75rem] bg-white border border-line text-xs text-ink shadow-2xs"
                    >
                      <span className="font-medium text-ink-soft">"{reply}"</span>
                      <button
                        type="button"
                        onClick={() => removeQuickReply(idx)}
                        className="text-ink-mute hover:text-coral-600 transition-colors p-1"
                        title="Remove template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </EdgeCard>
        </div>
      )}

    </div>
  );
}
