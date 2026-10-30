/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  Calendar, 
  Building2, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  Check, 
  MessageSquare,
  Lock,
  Sparkles
} from 'lucide-react';

export default function DoctorSettings() {
  const { user } = useAuth();
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
            ...(dr.privacy || {})
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
        <Skeleton className="w-full h-40 rounded-[1.25rem]" />
        <Skeleton className="w-full h-64 rounded-[1.25rem]" />
      </div>
    );
  }

  return (
    <div className="pb-10 max-w-2xl mx-auto font-sans selection:bg-amber-100 selection:text-sand-600 space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-ink tracking-tight">
          Doctor Settings
        </h1>
        <p className="text-xs sm:text-sm text-ink-soft mt-1">
          Manage your rep visiting schedule, clinic locations, and privacy preferences.
        </p>
      </div>

      {/* Quick Navigation Cards */}
      <section className="space-y-3">
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold pl-1">
          Configuration & Profile
        </span>
        
        <div className="space-y-2.5">
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

          {/* Rep Schedule Card */}
          <EdgeCard edge="amber" className="p-4 sm:p-5 bg-white hover:border-amber-500/40 transition-all">
            <Link to="/admin/schedule" className="flex items-center justify-between group min-h-[2.75rem]">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[0.875rem] bg-amber-100 text-sand-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-ink group-hover:text-sand-600 transition-colors">
                      Rep Visit Schedule
                    </h3>
                    <MonoTag variant="amber">Core</MonoTag>
                  </div>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Set weekly visiting hours, slot durations, daily rep quotas, and block dates.
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-[0.75rem] bg-cream-50 group-hover:bg-amber-100 text-ink-mute group-hover:text-sand-600 transition-colors flex-shrink-0 ml-3">
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </EdgeCard>

          {/* Clinics Management Card */}
          <EdgeCard edge="navy" className="p-4 sm:p-5 bg-white hover:border-navy-500/40 transition-all">
            <Link to="/admin/clinics" className="flex items-center justify-between group min-h-[2.75rem]">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[0.875rem] bg-navy-100 text-navy-900 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-ink group-hover:text-navy-900 transition-colors">
                    Clinic Locations
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Manage clinic affiliations, consult rooms, reception instructions, and posters.
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-[0.75rem] bg-cream-50 group-hover:bg-navy-100 text-ink-mute group-hover:text-navy-900 transition-colors flex-shrink-0 ml-3">
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </EdgeCard>

          {/* Edit Profile Card */}
          <EdgeCard edge="sand" className="p-4 sm:p-5 bg-white hover:border-sand-500/40 transition-all">
            <Link to="/admin/edit-profile" className="flex items-center justify-between group min-h-[2.75rem]">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-[0.875rem] bg-sand-50 text-sand-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-sand-600/20">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-ink group-hover:text-sand-600 transition-colors">
                    Edit Doctor Profile
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    Update qualifications, specialty, profile photo, and registration details.
                  </p>
                </div>
              </div>
              <div className="p-2 rounded-[0.75rem] bg-cream-50 group-hover:bg-sand-50 text-ink-mute group-hover:text-sand-600 transition-colors flex-shrink-0 ml-3">
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          </EdgeCard>
        </div>
      </section>

      {/* Private WhatsApp Configuration */}
      <section className="space-y-2">
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold pl-1">
          Direct Rep Communication
        </span>

        <EdgeCard edge="teal" className="p-5 sm:p-6 bg-white space-y-4">
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
              <span>Contact grant is automatically issued when you approve a rep's appointment request.</span>
            </div>
          </form>
        </EdgeCard>
      </section>

      {/* Privacy Settings Section */}
      <section className="space-y-4">
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold pl-1">
          Privacy & Visibility
        </span>

        <EdgeCard edge="navy" className="p-5 sm:p-6 bg-white divide-y divide-line space-y-4">
          
          <div className="pt-0">
            <ToggleSwitch 
              label="Visible in Search Directory" 
              description="Allow medical representatives to find you in the Gatepass search directory"
              checked={privacy.visibleInSearch}
              onChange={(v) => updatePrivacy('visibleInSearch', v)}
            />
          </div>

          <div className="pt-4">
            <ToggleSwitch 
              label="Show Medical Specialty" 
              description="Display your specialty on your public profile and slot booking screen"
              checked={privacy.showSpecialty}
              onChange={(v) => updatePrivacy('showSpecialty', v)}
            />
          </div>

          <div className="pt-4">
            <ToggleSwitch 
              label="Show Practice City" 
              description="Display your city location in search results and clinic listings"
              checked={privacy.showCity}
              onChange={(v) => updatePrivacy('showCity', v)}
            />
          </div>

          <div className="pt-4">
            <ToggleSwitch 
              label="Show Clinic Affiliation" 
              description="Show clinic name on your live Gatepass displayed at reception"
              checked={privacy.showClinicName}
              onChange={(v) => updatePrivacy('showClinicName', v)}
            />
          </div>

          <div className="pt-4">
            <ToggleSwitch 
              label="Allow WhatsApp Direct Contact" 
              description="Provide an arrival notification button for approved reps to text your WhatsApp"
              checked={privacy.allowWhatsAppRedirect}
              onChange={(v) => updatePrivacy('allowWhatsAppRedirect', v)}
            />
          </div>

          <div className="pt-4">
            <ToggleSwitch 
              label="Constructive Rejection Reasons" 
              description="Send helpful feedback when declining slot requests (e.g. Schedule Full, Out of Station)"
              checked={privacy.rejectionReasonsEnabled}
              onChange={(v) => updatePrivacy('rejectionReasonsEnabled', v)}
            />
          </div>

        </EdgeCard>
      </section>

    </div>
  );
}
