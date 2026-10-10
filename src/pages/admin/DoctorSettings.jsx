/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDoctor, updateDoctor, DEFAULT_DOCTOR_PRIVACY } from '../../lib/db/doctors';
import { useAuth } from '../../lib/auth';
import { handleFirestoreError, OperationType } from '../../utils/firebaseErrors';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import Skeleton from '../../components/ui/Skeleton';
import { Calendar, ChevronRight, ShieldCheck, Clock } from 'lucide-react';

export default function DoctorSettings() {
  const { user } = useAuth();
  const [privacy, setPrivacy] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const dr = await getDoctor(user.uid);
        if (dr) {
          setPrivacy({
            ...DEFAULT_DOCTOR_PRIVACY,
            ...(dr.privacy || {})
          });
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
          Manage your rep visiting schedule, directory visibility, and privacy preferences.
        </p>
      </div>

      {/* Rep Schedule Highlight Card */}
      <section className="space-y-2">
        <span className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold pl-1">
          Visiting Rules
        </span>
        <EdgeCard edge="amber" className="p-5 bg-white hover:border-amber-500/40 transition-all">
          <Link to="/admin/schedule" className="flex items-center justify-between group">
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
                  Set weekly visiting hours, slot durations (15/20/30 min), daily rep quotas, and block dates.
                </p>
              </div>
            </div>
            <div className="p-2 rounded-[0.75rem] bg-cream-50 group-hover:bg-amber-100 text-ink-mute group-hover:text-sand-600 transition-colors flex-shrink-0 ml-3">
              <ChevronRight className="w-4 h-4" />
            </div>
          </Link>
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
