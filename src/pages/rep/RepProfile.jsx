import React, { useState, useEffect } from 'react';
import { getRep, updateRep } from '../../lib/db/reps';
import { updateUser } from '../../lib/db/users';
import { logout } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { Check, LogOut, Briefcase, ShieldCheck, Building2, Sparkles, Phone, User } from 'lucide-react';
import { TagInput } from '../../components/ui/TagInput';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import Skeleton from '../../components/ui/Skeleton';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';
import LiveDot from '../../components/ui/LiveDot';

export default function RepProfile() {
  const { user, userData, setUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const data = await getRep(user.uid);
        if (data) {
          setFormData({
            ...data,
            mobile: userData?.mobile || ''
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user, userData]);

  const updateForm = (key, val) => {
    setFormData(p => ({ ...p, [key]: val }));
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      const { id, uid, mobile, ...repUpdates } = formData;
      await updateRep(user.uid, repUpdates);
      if (mobile) {
        const cleanMobile = mobile.replace(/\D/g, '');
        await updateUser(user.uid, { mobile: cleanMobile });
        if (setUserData) {
          setUserData(prev => prev ? { ...prev, mobile: cleanMobile } : prev);
        }
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="pb-28 max-w-md mx-auto p-4 sm:p-6 mt-4 space-y-4 font-sans">
        <Skeleton className="w-full h-28 rounded-[1.25rem]" />
        <Skeleton className="w-full h-64 rounded-[1.25rem]" />
        <RepBottomNav />
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="p-6 text-center mt-10 text-ink-mute font-medium text-sm">
        Error loading profile.
      </div>
    );
  }

  const initial = userData?.name?.charAt(0) || 'R';

  return (
    <div className="pb-28 font-sans max-w-md mx-auto p-4 sm:p-6 mt-2 selection:bg-amber-100 selection:text-sand-600">
      
      {/* Top Midnight Hero Card */}
      <div className="mb-5 bg-[#0B162C] text-white p-5 rounded-[1.5rem] shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-[1rem] bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-navy-950 flex items-center justify-center font-display font-bold text-2xl shadow-md border-2 border-white/20 flex-shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[0.625rem] tracking-wider uppercase text-amber-300 font-bold">
                  Representative ID
                </span>
                <LiveDot color="teal" size="sm" />
              </div>
              <h1 className="text-lg font-display font-bold text-white truncate leading-snug">
                {userData?.name || 'Medical Representative'}
              </h1>
              <p className="text-xs text-white/70 truncate flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-white/50" />
                <span>{formData.companyName || 'Pharmaceutical Company'}</span>
                {formData.division && <span className="text-white/40">· {formData.division}</span>}
              </p>
            </div>
          </div>

          <button 
            onClick={handleLogout}
            className="w-9 h-9 rounded-[0.75rem] bg-white/10 hover:bg-coral-500/20 text-white/70 hover:text-coral-300 flex items-center justify-center transition-all border border-white/10 active:scale-95"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[0.6875rem] font-mono text-white/60">
          <span className="flex items-center gap-1 text-teal-300">
            <ShieldCheck className="w-3.5 h-3.5" /> Verified Credential
          </span>
          <span>Kurnool Pilot HQ</span>
        </div>
      </div>

      <div className="space-y-4">
        <EdgeCard edge="navy" className="p-5 flex flex-col gap-5 bg-white shadow-card">
          
          <div className="space-y-1.5">
            <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold px-0.5">
              Designation
            </label>
            <input 
              type="text" 
              className="w-full border border-line rounded-[0.875rem] px-4 py-3 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 bg-cream-50/70 focus:bg-white outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
              value={formData.designation || ''}
              onChange={(e) => updateForm('designation', e.target.value)}
              placeholder="e.g. Senior Medical Representative"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold px-0.5">
              Mobile Number (Contact with Reception)
            </label>
            <PhoneInput 
              value={formData.mobile || ''}
              onChange={(val) => updateForm('mobile', val)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-[0.6875rem] uppercase tracking-wider text-ink-mute font-semibold px-0.5">
              Therapeutic Segment
            </label>
            <input 
              type="text" 
              className="w-full border border-line rounded-[0.875rem] px-4 py-3 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 bg-cream-50/70 focus:bg-white outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
              value={formData.therapeuticCategory || ''}
              onChange={(e) => updateForm('therapeuticCategory', e.target.value)}
              placeholder="e.g. Cardiology, Diabetology"
            />
          </div>
          
          <div className="pt-3 border-t border-line/70 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-navy-800" />
                <h3 className="font-bold text-xs uppercase font-mono tracking-wider text-ink">Portfolio Brands</h3>
              </div>
              <MonoTag variant="neutral">Carried</MonoTag>
            </div>

            <div className="space-y-1.5">
              <TagInput 
                tags={formData.productNames || []}
                onChange={(tags) => updateForm('productNames', tags)}
                placeholder="Type brand name and press Enter..."
              />
            </div>
          </div>
          
          <div className="bg-cream-50/80 rounded-[1rem] p-3.5 border border-line">
            <ToggleSwitch 
              label="Samples Available"
              description="I usually carry physician samples or visual leave-behinds on visits."
              checked={formData.samplesAvailable || false}
              onChange={(val) => updateForm('samplesAvailable', val)}
            />
          </div>
        </EdgeCard>

        {savedSuccess && (
          <div className="p-3.5 bg-teal-50 border border-teal-500/30 text-teal-800 rounded-[1rem] text-xs font-semibold flex items-center gap-2 shadow-2xs animate-in fade-in">
            <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Profile changes saved successfully!</span>
          </div>
        )}
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-[1rem] px-5 py-3.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-navy-950/20 text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
        >
          {saving ? (
            <span>Saving Changes...</span>
          ) : (
            <>
              <span>Save Profile Changes</span>
              <Check className="w-4 h-4 text-amber-400" />
            </>
          )}
        </button>
      </div>

      <RepBottomNav />
    </div>
  );
}
