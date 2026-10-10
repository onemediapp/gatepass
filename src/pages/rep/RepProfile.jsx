import React, { useState, useEffect } from 'react';
import { getRep, updateRep } from '../../lib/db/reps';
import { logout } from '../../lib/firebase';
import { useAuth } from '../../lib/auth';
import { Check, LogOut, Briefcase } from 'lucide-react';
import { TagInput } from '../../components/ui/TagInput';
import { ToggleSwitch } from '../../components/ui/ToggleSwitch';
import { PhoneInput } from '../../components/ui/PhoneInput';
import { RepBottomNav } from '../../components/layout/RepBottomNav';
import Skeleton from '../../components/ui/Skeleton';
import EdgeCard from '../../components/ui/EdgeCard';
import MonoTag from '../../components/ui/MonoTag';

export default function RepProfile() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const data = await getRep(user.uid);
        if (data) {
          setFormData(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const updateForm = (key, val) => setFormData(p => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      await updateRep(user.uid, formData);
      alert('Profile updated successfully');
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
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
      <div className="pb-24 max-w-md mx-auto p-4 sm:p-6 mt-4 space-y-4 font-sans">
        <Skeleton className="w-full h-20 rounded-[1.25rem]" />
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

  return (
    <div className="pb-24 font-sans max-w-md mx-auto p-4 sm:p-6 mt-2 selection:bg-amber-100 selection:text-sand-600">
      
      {/* Top Header Card */}
      <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-[1.25rem] border border-line shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-[0.875rem] bg-navy-900 text-white flex items-center justify-center font-display font-bold text-xl shadow-sm">
            {userData?.name?.charAt(0) || 'R'}
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-ink leading-tight">My Profile</h1>
            <p className="text-xs text-ink-soft mt-0.5">{userData?.name || 'Medical Rep'}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-10 h-10 rounded-[0.75rem] bg-coral-50 text-coral-600 flex items-center justify-center hover:bg-coral-100 transition-colors border border-coral-600/20"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <EdgeCard edge="navy" className="p-5 flex flex-col gap-5">
          
          <div className="space-y-1.5">
            <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
              Designation
            </label>
            <input 
              type="text" 
              className="w-full border border-line rounded-[0.875rem] px-4 py-2.5 focus:ring-2 focus:ring-navy-100 focus:border-navy-500 bg-cream-50 outline-none font-medium text-ink placeholder:text-ink-mute text-xs transition-all"
              value={formData.designation || ''}
              onChange={(e) => updateForm('designation', e.target.value)}
              placeholder="e.g. Senior Medical Representative"
            />
          </div>

          <div className="space-y-1.5">
            <label className="font-mono text-xs uppercase tracking-wider text-ink-mute font-semibold px-0.5">
              Mobile Number
            </label>
            <PhoneInput 
              value={formData.mobile || ''}
              onChange={(val) => updateForm('mobile', val)}
            />
          </div>
          
          <div className="pt-3 border-t border-line space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-navy-500" />
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
          
          <div className="bg-cream-50 rounded-[0.875rem] p-3.5 border border-line">
            <ToggleSwitch 
              label="Samples Available"
              description="I usually carry product samples on my visits."
              checked={formData.samplesAvailable || false}
              onChange={(val) => updateForm('samplesAvailable', val)}
            />
          </div>
        </EdgeCard>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-navy-900 text-white font-bold rounded-[0.875rem] px-5 py-3.5 hover:bg-navy-700 transition-all active:scale-[0.99] flex items-center justify-center gap-2 shadow-sm text-xs disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Profile Changes'} <Check className="w-4 h-4 text-amber-500" />
        </button>
      </div>

      <RepBottomNav />
    </div>
  );
}
