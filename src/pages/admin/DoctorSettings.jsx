/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getDoctor, updateDoctor, DEFAULT_DOCTOR_PRIVACY } from '../../lib/db/doctors';
import { getDoctorContact, setDoctorContact } from '../../lib/db/doctorContacts';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import PhoneInput from '../../components/ui/PhoneInput';
import { 
  ArrowLeft,
  Calendar, 
  Building2, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  Check, 
  MessageSquare,
  Lock,
  Sparkles,
  Eye,
  Bell,
  Shield,
  UserCheck,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function DoctorSettings() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState('Visibility'); // 'Visibility' | 'Notifications' | 'Privacy' | 'Account'
  const [privacy, setPrivacy] = useState(null);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savedPhoneSuccess, setSavedPhoneSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const [dr, contact] = await Promise.all([
          getDoctor(user.uid),
          getDoctorContact(user.uid)
        ]);

        if (dr) {
          setPrivacy({
            ...DEFAULT_DOCTOR_PRIVACY,
            requireVisitReason: true,
            allowCustomNotes: true,
            hideFromCompanyAnalytics: false,
            showClinicOnly: true,
            ...(dr.privacy || {})
          });
        } else {
          setPrivacy({
            ...DEFAULT_DOCTOR_PRIVACY,
            requireVisitReason: true,
            allowCustomNotes: true,
            hideFromCompanyAnalytics: false,
            showClinicOnly: true
          });
        }
        if (contact?.whatsappNumber) {
          setWhatsappNumber(contact.whatsappNumber);
        }
      } catch (error) {
        console.error('Error loading doctor settings:', error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const updatePrivacy = async (field, value) => {
    const newPrivacy = { ...privacy, [field]: value };
    setPrivacy(newPrivacy);
    try {
      await updateDoctor(user.uid, {
        privacy: newPrivacy
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'doctors');
    }
  };

  const handleSavePhone = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSavingPhone(true);
    setSavedPhoneSuccess(false);
    try {
      await setDoctorContact(user.uid, {
        whatsappNumber: whatsappNumber.trim()
      });
      setSavedPhoneSuccess(true);
      setTimeout(() => setSavedPhoneSuccess(false), 2500);
    } catch (err) {
      console.error('Error updating WhatsApp number:', err);
      alert('Failed to update WhatsApp number');
    } finally {
      setSavingPhone(false);
    }
  };

  if (loading || !privacy) {
    return (
      <div className="pb-10 max-w-2xl mx-auto font-sans space-y-4">
        <Skeleton className="w-48 h-8 rounded-[0.75rem]" />
        <Skeleton className="w-full h-12 rounded-[1rem]" />
        <Skeleton className="w-full h-64 rounded-[1.25rem]" />
      </div>
    );
  }

  const tabs = ['Visibility', 'Notifications', 'Privacy', 'Account'];

  return (
    <div className="pb-12 max-w-2xl mx-auto font-sans selection:bg-amber-100 selection:text-sand-600 space-y-6">
      
      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-[0.75rem] bg-white border border-line text-ink hover:bg-cream-100 active:scale-95 transition-all"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-ink tracking-tight">
            Preferences & Privacy
          </h1>
          <p className="text-xs text-ink-soft">
            Control your visibility, notifications and account settings.
          </p>
        </div>
      </div>

      {/* ── Navigation Tabs (Image 2 Screen 4) ────────────────── */}
      <div className="flex items-center bg-cream-100/80 p-1 rounded-[1rem] border border-line">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold rounded-[0.75rem] transition-all text-center",
              activeTab === tab
                ? "bg-navy-900 text-white shadow-sm"
                : "text-slate-600 hover:text-ink hover:bg-white/50"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Tab: Visibility (Image 2 Screen 4) ────────────────── */}
      {activeTab === 'Visibility' && (
        <div className="space-y-6">
          {/* PROFILE VISIBILITY */}
          <section className="space-y-2">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
              Profile Visibility
            </span>
            <div className="bg-white rounded-[1.25rem] border border-line p-5 divide-y divide-line shadow-2xs space-y-4">
              <div className="pt-0">
                <ToggleSwitch 
                  label="Show profile to representatives" 
                  description="Allow verified representatives to find and view your profile."
                  checked={privacy.visibleInSearch !== false}
                  onChange={(v) => updatePrivacy('visibleInSearch', v)}
                />
              </div>

              <div className="pt-4">
                <ToggleSwitch 
                  label="Show contact number" 
                  description="Display clinic contact number to approved reps only."
                  checked={privacy.allowWhatsAppRedirect !== false}
                  onChange={(v) => updatePrivacy('allowWhatsAppRedirect', v)}
                />
              </div>

              <div className="pt-4">
                <ToggleSwitch 
                  label="Show consultation areas" 
                  description="Display your consultation areas and specialties."
                  checked={privacy.showSpecialty !== false}
                  onChange={(v) => updatePrivacy('showSpecialty', v)}
                />
              </div>
            </div>
          </section>

          {/* APPOINTMENT PREFERENCES */}
          <section className="space-y-2">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
              Appointment Preferences
            </span>
            <div className="bg-white rounded-[1.25rem] border border-line p-5 divide-y divide-line shadow-2xs space-y-4">
              <div className="pt-0">
                <ToggleSwitch 
                  label="Require visit reason" 
                  description="Reps must select a reason when requesting a visit."
                  checked={privacy.requireVisitReason !== false}
                  onChange={(v) => updatePrivacy('requireVisitReason', v)}
                />
              </div>

              <div className="pt-4">
                <ToggleSwitch 
                  label="Allow personalized message" 
                  description="Allow reps to include a short message (max 300 characters)."
                  checked={privacy.allowCustomNotes !== false}
                  onChange={(v) => updatePrivacy('allowCustomNotes', v)}
                />
              </div>
            </div>
          </section>

          {/* DATA & PRIVACY */}
          <section className="space-y-2">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
              Data & Privacy
            </span>
            <div className="bg-white rounded-[1.25rem] border border-line p-5 divide-y divide-line shadow-2xs space-y-4">
              <div className="pt-0">
                <ToggleSwitch 
                  label="Hide from company analytics" 
                  description="Do not share my individual visit data with pharma companies."
                  checked={!!privacy.hideFromCompanyAnalytics}
                  onChange={(v) => updatePrivacy('hideFromCompanyAnalytics', v)}
                />
              </div>

              <div className="pt-4">
                <ToggleSwitch 
                  label="Show only clinic location (not personal address)" 
                  description="Display clinic address instead of personal address."
                  checked={privacy.showClinicOnly !== false}
                  onChange={(v) => updatePrivacy('showClinicOnly', v)}
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Tab: Notifications ───────────────────────────────── */}
      {activeTab === 'Notifications' && (
        <div className="space-y-6">
          <section className="space-y-2">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
              WhatsApp & Arrival Alerts
            </span>
            
            <div className="bg-white rounded-[1.25rem] border border-line p-5 space-y-4 shadow-2xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-[0.625rem] bg-teal-50 text-teal-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm text-ink">
                    Private WhatsApp Contact
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Used exclusively to allow approved representatives to send arrival alerts. Never displayed publicly.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSavePhone} className="space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1">
                    <PhoneInput
                      value={whatsappNumber}
                      onChange={setWhatsappNumber}
                      placeholder="98765 43210"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={savingPhone}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-navy-900 hover:bg-navy-700 active:scale-95 text-white rounded-[0.875rem] text-xs font-semibold shadow-sm transition-all min-h-[2.75rem] disabled:opacity-50"
                  >
                    {savedPhoneSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal-300" />
                        <span>Saved!</span>
                      </>
                    ) : (
                      <span>{savingPhone ? 'Saving...' : 'Update Number'}</span>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-1.5 text-[0.6875rem] text-ink-mute">
                  <Lock className="w-3 h-3 text-teal-600" />
                  <span>Contact grant is automatically issued only when you approve a rep's request.</span>
                </div>
              </form>
            </div>
          </section>

          <section className="space-y-2">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
              Alert Preferences
            </span>
            <div className="bg-white rounded-[1.25rem] border border-line p-5 divide-y divide-line shadow-2xs space-y-4">
              <div className="pt-0">
                <ToggleSwitch 
                  label="Daily Morning Schedule Digest" 
                  description="Receive a WhatsApp summary of today's approved rep visits at 08:30 AM."
                  checked={privacy.morningDigest !== false}
                  onChange={(v) => updatePrivacy('morningDigest', v)}
                />
              </div>
              <div className="pt-4">
                <ToggleSwitch 
                  label="Instant Visit Delay Broadcast" 
                  description="Automatically broadcast delay updates (+15m, +30m) to all waiting reps in queue."
                  checked={privacy.autoDelayBroadcast !== false}
                  onChange={(v) => updatePrivacy('autoDelayBroadcast', v)}
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Tab: Privacy ─────────────────────────────────────── */}
      {activeTab === 'Privacy' && (
        <div className="space-y-6">
          <section className="space-y-2">
            <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-slate-500 font-bold pl-1">
              Rep Access Controls
            </span>
            <div className="bg-white rounded-[1.25rem] border border-line p-5 divide-y divide-line shadow-2xs space-y-4">
              <div className="pt-0">
                <ToggleSwitch 
                  label="Constructive Rejection Reasons" 
                  description="Send helpful feedback when declining slot requests (e.g. Schedule Full, Out of Station)."
                  checked={privacy.rejectionReasonsEnabled !== false}
                  onChange={(v) => updatePrivacy('rejectionReasonsEnabled', v)}
                />
              </div>

              <div className="pt-4">
                <ToggleSwitch 
                  label="Auto-block Persistent No-Shows" 
                  description="Temporarily restrict reps who miss 2 confirmed appointments without prior cancellation."
                  checked={privacy.blockNoShows !== false}
                  onChange={(v) => updatePrivacy('blockNoShows', v)}
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── Tab: Account ─────────────────────────────────────── */}
      {activeTab === 'Account' && (
        <div className="space-y-4">
          {/* Clinic Pro SaaS Card */}
          <EdgeCard edge="amber" className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-white to-white border-amber-500/30 hover:border-amber-500/60 transition-all">
            <Link to="/admin/pricing" className="flex items-center justify-between group min-h-[2.75rem]">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[0.875rem] bg-amber-500 text-navy-950 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-ink group-hover:text-sand-600 transition-colors">
                      Clinic Pro SaaS Subscription
                    </h3>
                    <MonoTag variant="amber">₹1,499/mo</MonoTag>
                  </div>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Reception Touchscreen Kiosk, staff PIN delegation, WhatsApp delay broadcasts, and priority laminated posters.
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-[0.75rem] bg-cream-50 group-hover:bg-amber-100 text-ink-mute group-hover:text-sand-600 transition-colors flex-shrink-0 ml-3">
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </EdgeCard>

          {/* Quick links to edit profile, clinics, schedule */}
          <div className="space-y-2.5">
            <EdgeCard edge="amber" className="p-4 sm:p-5 bg-white hover:border-amber-500/40 transition-all">
              <Link to="/admin/schedule" className="flex items-center justify-between group min-h-[2.75rem]">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-[0.875rem] bg-amber-100 text-sand-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-bold text-sm text-ink group-hover:text-sand-600 transition-colors">
                        Rep Visit Schedule
                      </h3>
                      <MonoTag variant="amber">Core</MonoTag>
                    </div>
                    <p className="text-xs text-ink-soft mt-0.5">
                      Set weekly visiting hours, slot durations, and daily quotas.
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-[0.75rem] bg-cream-50 group-hover:bg-amber-100 text-ink-mute group-hover:text-sand-600 transition-colors flex-shrink-0 ml-3">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </EdgeCard>

            <EdgeCard edge="navy" className="p-4 sm:p-5 bg-white hover:border-navy-500/40 transition-all">
              <Link to="/admin/clinics" className="flex items-center justify-between group min-h-[2.75rem]">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-[0.875rem] bg-navy-100 text-navy-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-ink group-hover:text-navy-900 transition-colors">
                      Clinic Locations
                    </h3>
                    <p className="text-xs text-ink-soft mt-0.5">
                      Manage clinic affiliations, consult rooms, and reception instructions.
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-[0.75rem] bg-cream-50 group-hover:bg-navy-100 text-ink-mute group-hover:text-navy-900 transition-colors flex-shrink-0 ml-3">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </EdgeCard>

            <EdgeCard edge="sand" className="p-4 sm:p-5 bg-white hover:border-sand-500/40 transition-all">
              <Link to="/admin/edit-profile" className="flex items-center justify-between group min-h-[2.75rem]">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-[0.875rem] bg-sand-50 text-sand-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-sand-600/20">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-ink group-hover:text-sand-600 transition-colors">
                      Edit Doctor Profile
                    </h3>
                    <p className="text-xs text-ink-soft mt-0.5">
                      Update qualifications, specialty, and registration details.
                    </p>
                  </div>
                </div>
                <div className="p-2 rounded-[0.75rem] bg-cream-50 group-hover:bg-sand-50 text-ink-mute group-hover:text-sand-600 transition-colors flex-shrink-0 ml-3">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </Link>
            </EdgeCard>
          </div>
        </div>
      )}

    </div>
  );
}
